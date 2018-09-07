/**
 * Welcome to your Workbox-powered service worker!
 *
 * You'll need to register this file in your web app and you should
 * disable HTTP caching for this file too.
 * See https://goo.gl/nhQhGp
 *
 * The rest of the code is auto-generated. Please don't update this file
 * directly; instead, make changes to your Workbox build configuration
 * and re-run your build process.
 * See https://goo.gl/2aRDsh
 */

importScripts("https://storage.googleapis.com/workbox-cdn/releases/3.4.1/workbox-sw.js");

workbox.core.setCacheNameDetails({prefix: "gatsby-plugin-offline"});

workbox.skipWaiting();
workbox.clientsClaim();

/**
 * The workboxSW.precacheAndRoute() method efficiently caches and responds to
 * requests for URLs in the manifest.
 * See https://goo.gl/S9QRab
 */
self.__precacheManifest = [
  {
    "url": "webpack-runtime-70fbf99cd44e250ff20a.js"
  },
  {
    "url": "app-3947a9405ec42fe226f1.js"
  },
  {
    "url": "component---node-modules-gatsby-plugin-offline-app-shell-js-e1db923de682346dea78.js"
  },
  {
    "url": "index.html",
    "revision": "09c21d81f4add1fe886877efe21afb1f"
  },
  {
    "url": "offline-plugin-app-shell-fallback/index.html",
    "revision": "e9c50a46ab02a2a543fbfa8310ffd052"
  },
  {
    "url": "1.970ef0306e109181cd53.css",
    "revision": "6586a706c96fc59f052035b8258135b6"
  },
  {
    "url": "component---src-pages-index-js-db16be40f829737bac88.js"
  },
  {
    "url": "0-0f75985e0ca84630bd7b.js"
  },
  {
    "url": "1-1f3300dfdce9c532670a.js"
  },
  {
    "url": "9-5adae1823c91f8c22d41.js"
  },
  {
    "url": "static/d/173/path---index-6a9-NZuapzHg3X9TaN1iIixfv1W23E.json",
    "revision": "c2508676a2f33ea9f1f0bf472997f9a0"
  },
  {
    "url": "component---src-pages-404-js-16d3dbb3818f74630c9f.js"
  },
  {
    "url": "static/d/164/path---404-html-516-62a-NZuapzHg3X9TaN1iIixfv1W23E.json",
    "revision": "c2508676a2f33ea9f1f0bf472997f9a0"
  },
  {
    "url": "static/d/520/path---offline-plugin-app-shell-fallback-a-30-c5a-NZuapzHg3X9TaN1iIixfv1W23E.json",
    "revision": "c2508676a2f33ea9f1f0bf472997f9a0"
  },
  {
    "url": "manifest.webmanifest",
    "revision": "9274d7d3918b23153fc8c079919b562c"
  }
].concat(self.__precacheManifest || []);
workbox.precaching.suppressWarnings();
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});

workbox.routing.registerNavigationRoute("/offline-plugin-app-shell-fallback/index.html", {
  whitelist: [/^[^?]*([^.?]{5}|\.html)(\?.*)?$/],
  blacklist: [/\?(.+&)?no-cache=1$/],
});

workbox.routing.registerRoute(/\.(?:png|jpg|jpeg|webp|svg|gif|tiff|js|woff|woff2|json|css)$/, workbox.strategies.staleWhileRevalidate(), 'GET');
