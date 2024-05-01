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
            let li = document.getElementById(domain);
            li.className = li.className + " red";
        });});
}

function AddToBlockList(domain) {
    chrome.storage.local.get('blockedDomains', function(data) {
        let blockedDomains = data.blockedDomains ? JSON.parse(data.blockedDomains) : { domains: [] };

        if (!blockedDomains.domains.includes(domain)) {
            blockedDomains.domains.push(domain);
            
            let li = document.getElementById(domain);
            li.className = li.className + " red";

            chrome.storage.local.set({ 'blockedDomains': JSON.stringify(blockedDomains) }, function() {
                console.log('Domain added:', domain);
                console.log(blockedDomains);
            });
        } else {
            console.log('Domain already exists:', domain);
        }
    });
}

function RemoveFromBlockList(domain) {
    chrome.storage.local.get('blockedDomains', function(data) {
        let blockedDomains = data.blockedDomains ? JSON.parse(data.blockedDomains) : { domains: [] };

        const index = blockedDomains.domains.indexOf(domain);
        if (index !== -1) {
            blockedDomains.domains.splice(index, 1);

            let li = document.getElementById(domain);
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            location.reload();

            chrome.storage.local.set({ 'blockedDomains': JSON.stringify(blockedDomains) }, function() {
                console.log('Domain removed:', domain);
                console.log(blockedDomains);
            });
        } else {
            console.log('Domain not found:', domain);
        }
    });
    setColours();
}

chrome.runtime.onInstalled.addListener(function() {
    fetch(chrome.runtime.getURL('blockedDomains.json'))
        .then(response => response.json())
        .then(json => {
            const domains = json.domains;
            const rules = domains.map(domain => ({
                id: "remove_cookie_rule_" + domain.replace(/[^\w]/g, "_"),
                priority: 100,
                action: {
                    type: "removeRequestHeader",
                    header: "cookie"
                },
                condition: {
                    urlFilter: {
                        urlContains: domain
                    }
                }
            }));
            
            chrome.declarativeNetRequest.updateDynamicRules({
                remove: rules.map(rule => rule.id)
            });
            
            chrome.declarativeNetRequest.updateSessionRules({
                add: rules
            });
        })
        .catch(error => console.error('Error loading domains:', error));
});