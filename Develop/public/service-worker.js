const { response } = require("express");

const SITE_CACHE_NAME = "my-site-cache-v1";
const DATA_CACHE_NAME = "data-cache-v1";

const FILES_TO_CACHE = [
    "/",
    "index.html",
    "assets/css/style.css",
    "assets/js/index.js",
    "manifest.json",
    "https://cdn.jsdelivr.net/npm/chart.js@2.8.0",
    "assets/js/db.js",
    "assets/images/icons/icon-192x192.png",    
    "assets/images/icons/icon-512x512.png"    
];

//Install the service worker
self.addEventListener("install", function(evt) {
    evt.waitUntil (
        caches.open(SITE_CACHE_NAME).then(cache => {
            console.log('Your files have been pre-cached successfully!');
            return cache.addAll(FILES_TO_CACHE);
        })
    );

    self.skipWaiting();
});

//Activate the service worker and remove old data from the cache
self.addEventListener("activate", function(evt) {
    evt.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(
                keyList.map((key) => {
                    if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                        console.log("Removing old cache data", key);
                        return caches.delete(key);
                    }
                })
            )
        })
    );

    self.clients.claim();
});

//Intercept fetch requests
self.addEventListener("fetch", function(evt) {
    if (evt.request.url.includes("/api/")) {
        evt.respondWith (
            caches
                .open(DATA_CACHE_NAME)
                .then((cache) => {
                    return fetch(evt.request)
                    if (response.status === 200) {
                        cache.put(evt.request.url, response.clone());
                    }

                    return response;
                })
                .catch((err) => {
                    return cache.match(evt.request);
                })
            .catch((err) => console.log(err))
        );

        return;
    }

    evt.respondWith(
        fetch(evt.request).catch(function () {
            return caches.match(evt.request).then(function (response) {
                if (response) {
                    return response;
                } else if (evt.request.headers.get("accept").includes("text/html")) {
                    return caches.match("/");
                }
            });
        })
    );
});
