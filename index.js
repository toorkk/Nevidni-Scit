document.addEventListener('DOMContentLoaded', function() {
    chrome.cookies.getAll({}, function(cookies) {
        var cookieList = document.getElementById('cookieList');
        cookies.forEach(function(cookie) {
            var li = document.createElement('li');
            li.textContent = `${cookie.name}: ${cookie.value}`;
            cookieList.appendChild(li);
        });
    });
});