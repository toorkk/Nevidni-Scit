document.addEventListener('DOMContentLoaded', function() {
    chrome.cookies.getAll({}, function(cookies) {
        var trackerList = document.getElementById('trackerList');
        cookies.forEach(function(cookie) {
            if (!cookie.hostOnly) {
                var li = document.createElement('li');
                li.className = 'list-group-item d-flex justify-content-between align-items-center';
                
                li.textContent = `Domain: ${cookie.domain}`;

                var allowBtn = document.createElement('button');
                allowBtn.type = 'button';
                allowBtn.className = 'btn btn-success';
                allowBtn.textContent = 'Dovoli';

                // dodaj logic za allowanje cookijev :)
                allowBtn.addEventListener('click', function() {
                    console.log(`You shall pass: ${cookie.domain}`);
                });

                var disableBtn = document.createElement('button');
                disableBtn.type = 'button';
                disableBtn.className = 'btn btn-danger';
                disableBtn.textContent = 'Onemogoči';

                //Dodaj logic za disablanje cookijev 
                disableBtn.addEventListener('click', function() {
                    console.log(`You shall not pass: ${cookie.domain}`);
                });


                li.appendChild(allowBtn);
                li.appendChild(disableBtn);
                trackerList.appendChild(li);
            }
        });
    });
});
