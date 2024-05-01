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

        }) 

        console.log(filteredCookies);
        console.log(cookies);
        
        var trackerList = document.getElementById('trackerList');

        filteredCookies.forEach(function(filtCookie) {
            if (!filtCookie.hostOnly) {
                var li = document.createElement('li');
                li.className = 'list-group-item d-flex justify-content-between align-items-center';
                
                li.textContent = `Domain: ${filtCookie.domain}`;

                var allowBtn = document.createElement('button');
                allowBtn.type = 'button';
                allowBtn.className = 'btn btn-success';
                allowBtn.textContent = 'Dovoli';

                // dodaj logic za allowanje cookijev :)
                allowBtn.addEventListener('click', function() {
                    console.log(`You shall pass: ${filtCookie.domain}`);
                });

                var disableBtn = document.createElement('button');
                disableBtn.type = 'button';
                disableBtn.className = 'btn btn-danger';
                disableBtn.textContent = 'Onemogoči';

                //Dodaj logic za disablanje cookijev 
                disableBtn.addEventListener('click', function() {
                    console.log(`You shall not pass: ${filtCookie.domain}`);
                });


                li.appendChild(allowBtn);
                li.appendChild(disableBtn);
                trackerList.appendChild(li);
            }
        });
    });
});


/*chrome.webRequest.onBeforeSendHeaders.addListener(
    function(details) {
      for (var i = 0; i < details.requestHeaders.length; ++i) {
        if (details.requestHeaders[i].name === 'Cookie') {
          // Remove the cookie header
          details.requestHeaders.splice(i, 1);
          break;
        }
      }
      return {requestHeaders: details.requestHeaders};
    },
    {urls: ["*://*.example.com/*"]},  // Change to the domain you want to block
    ["blocking", "requestHeaders"]
  ); */

function startListeners() {
    // inspect cookies in outgoing headers
    let extraInfoSpec = ['requestHeaders'];
    if (utils.hasOwn(chrome.webRequest.OnBeforeSendHeadersOptions, 'EXTRA_HEADERS')) {
      extraInfoSpec.push('extraHeaders');
    }
    chrome.webRequest.onBeforeSendHeaders.addListener(function(details) {
      if (badger.INITIALIZED) {
        badger.heuristicBlocking.checkForTrackingCookies(details);
      }
    }, {urls: ["http://*/*", "https://*/*"]}, extraInfoSpec);
  
    // inspect cookies in incoming headers
    extraInfoSpec = ['responseHeaders'];
    if (utils.hasOwn(chrome.webRequest.OnResponseStartedOptions, 'EXTRA_HEADERS')) {
      extraInfoSpec.push('extraHeaders');
    }
    chrome.webRequest.onResponseStarted.addListener(function (details) {
      if (!badger.INITIALIZED) {
        return;
      }
  
      // check for cookie tracking if there are any set-cookie headers
      let has_setcookie_header = false;
      if (details.responseHeaders) {
        for (let i = 0; i < details.responseHeaders.length; i++) {
          if (details.responseHeaders[i].name.toLowerCase() == "set-cookie") {
            has_setcookie_header = true;
            break;
          }
        }
      }
      if (has_setcookie_header) {
        badger.heuristicBlocking.checkForTrackingCookies(details);
      }
  
      // check for pixel cookie sharing if the response appears to be for an image pixel
      badger.heuristicBlocking.checkForPixelCookieSharing(details);
  
    }, {urls: ["http://*/*", "https://*/*"]}, extraInfoSpec);
  }

function checkForTrackingCookies (details) {
    // ignore requests that are outside a tabbed window
    if (details.tabId < 0 || !badger.isLearningEnabled(details.tabId)) {
      return;
    }

    let self = this,
      tab_id = details.tabId,
      from_current_tab = true;

    // if this is a main window request, update tab data and quit
    if (details.type == "main_frame") {
      let tab_host = (new URI(details.url)).host;
      self.tabOrigins[tab_id] = getBaseDomain(tab_host);
      self.tabUrls[tab_id] = details.url;
      return;
    }

    let tab_base = self.tabOrigins[tab_id];
    if (!tab_base) {
      return;
    }

    let request_host = (new URI(details.url)).host;
    // CNAME uncloaking
    if (utils.hasOwn(badger.cnameDomains, request_host)) {
      // TODO details.url is still wrong
      request_host = badger.cnameDomains[request_host];
    }
    let request_base = getBaseDomain(request_host);

    let initiator_url = getInitiatorUrl(self.tabUrls[tab_id], details);
    if (initiator_url) {
      from_current_tab = false;
      tab_base = getBaseDomain(extractHostFromURL(initiator_url));
    }

    // ignore first-party requests
    if (!utils.isThirdPartyDomain(request_base, tab_base)) {
      return;
    }

    // short-circuit if we already observed this eTLD+1 tracking on this site
    let firstParties = self.storage.getStore('snitch_map').getItem(request_base);
    if (firstParties && firstParties.includes(tab_base)) {
      return;
    }

    // short-circuit if we already made a decision for this FQDN
    let action = self.storage.getBestAction(request_host);
    if (action != constants.NO_TRACKING && action != constants.ALLOW) {
      return;
    }

    if (details.type == "beacon" || details.type == "ping") {
      self._recordPrevalence(request_host, request_base, tab_base);
      // update tracking_map
      badger.storage.recordTrackingDetails(request_base, tab_base, 'beacon');
      // log in popup
      if (from_current_tab) {
        badger.logThirdPartyOriginOnTab(
          tab_id, request_host, badger.storage.getBestAction(request_host));
      }
      // don't bother checking for tracking cookies
      return;
    }

    // check if there are tracking cookies
    if (hasCookieTracking(details)) {
      self._recordPrevalence(request_host, request_base, tab_base);
    }
  }