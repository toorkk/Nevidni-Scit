document.addEventListener('DOMContentLoaded', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        var currentUrl = new URL(tabs[0].url);
        var currentDomain = currentUrl.hostname;

        chrome.cookies.getAll({}, function(allCookies) {
            var nodes = [], edges = [];
            var idCounter = 1;
            var nodeMap = {};

            allCookies.forEach(function(cookie) {
                // Adjust cookie domain for comparison
                var cookieDomainAdjusted = cookie.domain.startsWith('.') ? cookie.domain.substring(1) : cookie.domain;
                var isThirdParty = !currentDomain.includes(cookieDomainAdjusted); // Enhanced check for domain match

                // Determine node color by cookie scope
                var nodeColor = isThirdParty ? 'red' : 'green'; // Default color settings
                if (isThirdParty && currentUrl.hostname.endsWith(cookieDomainAdjusted)) {
                    nodeColor = 'blue'; // Blue if third-party cookie is being used
                }

                // Create domain node if not already created
                if (!nodeMap[cookie.domain]) {
                    nodes.push({
                        id: idCounter,
                        label: cookie.domain + (isThirdParty ? " (3rd party)" : ""),
                        group: isThirdParty ? 'third-party' : 'first-party',
                        color: nodeColor
                    });
                    nodeMap[cookie.domain] = idCounter++;
                }

                // Create cookie node
                nodes.push({
                    id: idCounter,
                    label: cookie.name,
                    group: isThirdParty ? 'third-party-cookie' : 'first-party-cookie',
                    color: nodeColor
                });

                // Link cookie node to domain node
                edges.push({
                    from: nodeMap[cookie.domain],
                    to: idCounter++
                });
            });

            var data = {
                nodes: new vis.DataSet(nodes),
                edges: new vis.DataSet(edges)
            };

            var options = {
                nodes: {
                    shape: 'dot',
                    size: 15,
                    font: {
                        size: 12
                    }
                },
                edges: {
                    width: 2
                },
                physics: {
                    forceAtlas2Based: {
                        gravitationalConstant: -50,
                        centralGravity: 0.005,
                        springLength: 100,
                        springConstant: 0.18
                    },
                    maxVelocity: 146,
                    solver: 'forceAtlas2Based',
                    timestep: 0.35,
                    stabilization: { iterations: 150 }
                }
            };

            var container = document.getElementById('mynetwork');
            var network = new vis.Network(container, data, options);
        });
    });
});
