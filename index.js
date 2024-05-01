document.addEventListener('DOMContentLoaded', function() {
    chrome.cookies.getAll({}, function(cookies) {
        var cookieList = document.getElementById('cookieList');
        cookies.forEach(function(cookie) {
            if (!cookie.hostOnly) {
                var li = document.createElement('li');
                li.textContent = `Domain: ${cookie.domain}, ${cookie.name}`;
                cookieList.appendChild(li);
            }
        });
    });
});
