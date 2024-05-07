function LoadBlockedDomains() {
    chrome.storage.local.get('blockedDomains', function(data) {
        let blockedDomains = data.blockedDomains ? JSON.parse(data.blockedDomains) : { domains: [] };

        blockedList = document.getElementById("blockedTrackerList");

        let doit = blockedDomains.domains;

        console.log('blockedDomains: ' + JSON.stringify(doit));

        chrome.declarativeNetRequest.getDynamicRules().then(response => console.log("dynamicRules:" + JSON.stringify(response)));


        doit.forEach(function(element) {
            var li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.id = element.domain;
            
            li.textContent = element.domain;
            var buttonDiv = document.createElement('div');
            buttonDiv.className = 'button-container';
            
            var allowBtn = document.createElement('button');
            allowBtn.type = 'button';
            allowBtn.className = 'btn btn-success';
            allowBtn.innerHTML = '<i class="fas fa-check"></i>';

            // dodaj logic za allowanje cookijev :)
            allowBtn.addEventListener('click', function() {
                RemoveFromBlockList(element.domain);
                location.reload();
            });

            buttonDiv.appendChild(allowBtn);
            li.appendChild(buttonDiv);

            blockedList.appendChild(li);
        });

    });

}

LoadBlockedDomains();

function deleteCookiesForDomain(domain) {
    chrome.cookies.getAll({domain: domain}, function(cookies) {
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i];
            chrome.cookies.remove({url: "https://" + cookie.domain + cookie.path, name: cookie.name});
        }
    });
}

function AddToBlockList(domain) {
    deleteCookiesForDomain(domain);
    
    chrome.storage.local.get('blockedDomains', function(data) {
        let blockedDomains = data.blockedDomains ? JSON.parse(data.blockedDomains) : { domains: [] };

        let domainExists = false;

        for(element in blockedDomains){
            if (element.domain == domain) {
                domainExists = true;
            }
        }

            if(!domainExists){

                let DynamicRuleIdCounter = 1;

                chrome.storage.sync.get(['DynamicRuleIdCounter'], function(items) {

                    if (items && items.DynamicRuleIdCounter !== undefined) {
                        DynamicRuleIdCounter = parseInt(items.DynamicRuleIdCounter);
                    }
                
                    console.log('dric :' + DynamicRuleIdCounter);
                });
                
                DynamicRuleIdCounter = DynamicRuleIdCounter + 2;
                let domainSet = {domain: domain, id: Math.floor(Math.random() * (1000000 - 1) ) + 1};
                blockedDomains.domains.push(domainSet);
                
                let li = document.getElementById(domain);
                li.classList.add("red");

                chrome.storage.local.set({ 'blockedDomains': JSON.stringify(blockedDomains) }, function() {
                    console.log('Domain added:', domain);
                    console.log(blockedDomains);
                });

                chrome.storage.sync.set({'DynamicRuleIdCounter': DynamicRuleIdCounter});

                addBlockedDomains(domainSet.domain, domainSet.id);

            } else {
                console.log('Domain already exists:', domain);
            }

    });
}

function RemoveFromBlockList(domain) {
    chrome.storage.local.get('blockedDomains', function(data) {
        let blockedDomains = data.blockedDomains ? JSON.parse(data.blockedDomains) : { domains: [] };
        
        
        const domainValues = blockedDomains.domains.map(item => item.domain);
        const index = domainValues.indexOf(domain);

        if (index !== -1) {
            removeBlockedDomain(blockedDomains.domains[index].id);

            blockedDomains.domains.splice(index, 1);

            let li = document.getElementById(domain);

            chrome.storage.local.set({ 'blockedDomains': JSON.stringify(blockedDomains) }, function() {
                console.log('Domain removed:', domain);
                console.log(blockedDomains);
            });
            
        //setColours();
        
        } else {
            console.log('Domain not found:', domain);
        }
    });
}

function addBlockedDomains(domain, id) {

    if(domain.charAt(0) == "."){
    domain = domain.slice(1);
    console.log('sliced domain: ' + domain);
    }
                
    try{
    chrome.declarativeNetRequest.updateDynamicRules({
        addRules: [{
            'id': id,
            'priority': 1,
            action: {
                type: "modifyHeaders",
                "requestHeaders": [{
                    "header": "Set-Cookie",
                    "operation": "remove"
                }]
            },
            'condition': {
                'urlFilter': '||' + domain,
            }
            },
            {
            'id': id + 1,
            'priority': 1,
            action: {
                type: "modifyHeaders",
                "responseHeaders": [{
                    "header": "Set-Cookie",
                    "operation": "remove"
                }]
            },
            'condition': {
                'urlFilter': '||' + domain,
            }
            }]
    });
    } catch (e) {
        console.log(`Failed to save rules: ${e}`);
    }

    chrome.declarativeNetRequest.getDynamicRules().then(response => console.log(response));

}

function removeBlockedDomain(id) {

    chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [id, id + 1]
    });
    chrome.declarativeNetRequest.getDynamicRules().then(response => console.log(response));

}

//------KODA ZA PRIDOBIVANJE TRACKING COOKIJEV-------//

function laufaj() {

function startListeners() {
    let extraInfoSpecRequest = ['requestHeaders'];
    if (chrome.webRequest.OnBeforeSendHeadersOptions && chrome.webRequest.OnBeforeSendHeadersOptions.hasOwnProperty('EXTRA_HEADERS')) {
        extraInfoSpecRequest.push('extraHeaders');
    }
    chrome.webRequest.onBeforeSendHeaders.addListener(function(details) {
        checkForSetCookiesInRequest(details);
    }, { urls: ["<all_urls>"] }, extraInfoSpecRequest);

   
    let extraInfoSpecResponse = ['responseHeaders'];
  
    if (chrome.webRequest.OnResponseStartedOptions && chrome.webRequest.OnResponseStartedOptions.hasOwnProperty('EXTRA_HEADERS')) {
        extraInfoSpecResponse.push('extraHeaders');
    }
    chrome.webRequest.onResponseStarted.addListener(function(details) {
        checkForSetCookiesInResponse(details);
    }, { urls: ["<all_urls>"] }, extraInfoSpecResponse);
}

function checkForSetCookiesInRequest(details) {
    if (details.requestHeaders) {
        for (let i = 0; i < details.requestHeaders.length; i++) {
            if (details.requestHeaders[i].name.toLowerCase() === 'cookie') {
                addToCookieList(details.requestHeaders[i].value);
                break;
            }
        }
    }
}

function checkForSetCookiesInResponse(details) {
    if (details.responseHeaders) {
        for (let i = 0; i < details.responseHeaders.length; i++) {
            if (details.responseHeaders[i].name.toLowerCase() === 'set-cookie') {
                addToCookieList(details.responseHeaders[i].value);
            }
        }
    }
}


function addToCookieList(cookieHeader) {
    let cookies = cookieHeader.split(';');

    
    for (let cookie of cookies) {

        cookie = cookie.trim();
        
        if (cookie.toLowerCase().startsWith('domain=')) {
            let domain = cookie.substring('Domain='.length);

            if (!domainsAdded.includes(domain)) {
                domainsAdded.push(domain);
                addToVisualization(domain);      
              }

            var exists = false;

            filteredCookies.forEach(function(filteredCookie) {
                if(domain == filteredCookie){
                    exists = true;
                }
            })

            if(exists) {continue;}

            filteredCookies.push(domain);


            let cookieList = document.getElementById('trackerList');

            var li = document.createElement('li');
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            li.id = domain;
            
            li.textContent = domain;
            var buttonDiv = document.createElement('div');
            buttonDiv.className = 'button-container';
            
            var disableBtn = document.createElement('button');
            disableBtn.type = 'button';
            disableBtn.className = 'btn btn-danger';
            disableBtn.innerHTML = '<i class="fas fa-times"></i>';

            //Dodaj logic za disablanje cookijev 
            disableBtn.addEventListener('click', function() {
                AddToBlockList(domain);
            });

            buttonDiv.appendChild(disableBtn);
            li.appendChild(buttonDiv);

            cookieList.appendChild(li);

            break; 
            }
    }
}

var filteredCookies = [];
var domainsAdded = [];

startListeners();

}

chrome.tabs.onUpdated.addListener( function (tabId, changeInfo, tab) {
    if (changeInfo.status == 'complete' && tab.active) {
  
        console.log("DOMContentLoaded event triggered");
        laufaj();  
    }
  });

//---------------KONEC KODE ZA PRIDOBIVANJE TRACKING COOKIJEV --------------//

var nodes = new vis.DataSet([]);
var edges = new vis.DataSet([]);
var network;

document.addEventListener('DOMContentLoaded', function () {
  var container = document.getElementById('mynetwork');
  if (!container) {
    console.error('Visualization container not found');
    return;
  }

  var data = {
    nodes: nodes,
    edges: edges,
  };

  var options = {
    physics: {
      enabled: true,
      solver: 'forceAtlas2Based',
      forceAtlas2Based: {
        gravitationalConstant: -300,
        centralGravity: 0.01,
        springConstant: 0.08,
        damping: 1,
        avoidOverlap: 1,
      },
      timestep: 0.5,
      stabilization: {
        iterations: 1000,
      },
      hierarchicalRepulsion: {
        nodeDistance: 10,
      },
    },
    nodes: {
      font: {
        size: 20,
        color: '#FFFFFF',
      },
      shape: 'circle',
      size: 15,
    },
    edges: {
      color: '#FFFFFF',
    },
  };

  network = new vis.Network(container, data, options);

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var currentURL = new URL(tabs[0].url).hostname;
    addToVisualization(currentURL, true);
  });
});

function addToVisualization(domain, isMainDomain) {
  if (!nodes.get(domain)) {
    var color = isMainDomain ? '#FFD700' : '#66CCCC';
    nodes.add({
      id: domain,
      label: domain,
      color: color,
    });

    if (!isMainDomain) {
      edges.add({
        from: domain,
        to: nodes.getIds()[0],
      });
    }
  }
}