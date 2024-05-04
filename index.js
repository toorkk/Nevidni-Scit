
//------KODA ZA PRIDOBIVANJE TRACKING COOKIJEV-------//

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
            let cookieList = document.getElementById('trackerList');
            let listItem = document.createElement('li');
            listItem.className = 'list-group-item';
            listItem.textContent = domain;
            cookieList.appendChild(listItem);
            break; 
        }
    }
}


document.addEventListener('DOMContentLoaded', function() {
    console.log("DOMContentLoaded event triggered");
    startListeners(); 
});

//---------------KONEC KODE ZA PRIDOBIVANJE TRACKING COOKIJEV --------------//