document.addEventListener('DOMContentLoaded', function() {
    chrome.cookies.getAll({}, function(cookies) {
        var trackerList = document.getElementById('trackerList');
        cookies.forEach(function(cookie) {
            if (!cookie.hostOnly) {
                var li = document.createElement('li');
                li.className = 'list-group-item';
                li.textContent = `Domain: ${cookie.domain}, Name: ${cookie.name}, Value: ${cookie.value}`;
                trackerList.appendChild(li);
            }
        });
    });
});