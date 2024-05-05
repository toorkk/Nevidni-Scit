var counter = 0;

document.addEventListener('DOMContentLoaded', function() {
    chrome.cookies.getAll({}, function(cookies) {

        var filteredCookies = [];

        cookies.forEach(function(cookie) {
            var exists = false;

            filteredCookies.forEach(function(filteredCookie) {
                if(cookie.domain == filteredCookie.domain){
                    exists = true;
                }
            })

            if(!exists){
                filteredCookies.push(cookie);
            }
        });

        filteredCookies.sort((a, b) => a.domain.localeCompare(b.domain));
        
        var trackerList = document.getElementById('trackerList');

        filteredCookies.forEach(function(filtCookie) {
            if (!filtCookie.hostOnly) {
                var li = document.createElement('li');
                li.className = 'list-group-item d-flex justify-content-between align-items-center';
                li.id = filtCookie.domain;
                
                li.textContent = `${filtCookie.domain}`;
                var buttonDiv = document.createElement('div');
                buttonDiv.className = 'button-container';
                
                var allowBtn = document.createElement('button');
                allowBtn.type = 'button';
                allowBtn.className = 'btn btn-success';
                allowBtn.innerHTML = '<i class="fas fa-check"></i>';

                // dodaj logic za allowanje cookijev :)
                allowBtn.addEventListener('click', function() {
                    RemoveFromBlockList(filtCookie.domain);
                });

                var disableBtn = document.createElement('button');
                disableBtn.type = 'button';
                disableBtn.className = 'btn btn-danger';
                disableBtn.innerHTML = '<i class="fas fa-times"></i>';

                //Dodaj logic za disablanje cookijev 
                disableBtn.addEventListener('click', function() {
                    AddToBlockList(filtCookie.domain);
                });


                buttonDiv.appendChild(allowBtn);
                buttonDiv.appendChild(disableBtn);
                li.appendChild(buttonDiv);

                trackerList.appendChild(li);
            }
        });
        
        setColours();

    });
});


function setColours() {
    chrome.storage.local.get('blockedDomains', function(data) {
        let blockedDomains = data.blockedDomains ? JSON.parse(data.blockedDomains) : { domains: [] };

        blockedDomains.domains.forEach(function(domain){
            let li = document.getElementById(domain.domain);
            li.className = li.className + " red";
        });});
}

function AddToBlockList(domain) {
    chrome.storage.local.get('blockedDomains', function(data) {
        let blockedDomains = data.blockedDomains ? JSON.parse(data.blockedDomains) : { domains: [] };

        let domainExists = false;

        for(element in blockedDomains){
            if (element.domain == domain) {
                domainExists = true;
            }
        }

            if(!domainExists){
                counter = counter + 2;
                let domainSet = {domain: domain, id: counter};
                console.log(blockedDomains);
                blockedDomains.domains.push(domainSet);
                
                let li = document.getElementById(domain);
                li.className = li.className + " red";

                chrome.storage.local.set({ 'blockedDomains': JSON.stringify(blockedDomains) }, function() {
                    console.log('Domain added:', domain);
                    console.log(blockedDomains);
                });

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
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            location.reload();

            chrome.storage.local.set({ 'blockedDomains': JSON.stringify(blockedDomains) }, function() {
                console.log('Domain removed:', domain);
                console.log(blockedDomains);
            });
            
        setColours();
        
        } else {
            console.log('Domain not found:', domain);
        }
    });
}

function addBlockedDomains(domain, id) {

    domain = domain.slice(1);
    console.log('sliced domain: ' + domain);
                
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