# Pagespeed issues on Mobile
##  Render blocking requests 
…css/efb9e9c20c27ebf4.css

## Use efficient cache lifetimes 
### Google Maps
…api/js?key=AIzaSyCjA…&libraries=geometry(maps.googleapis.com) Cache TTL 30m size: 100kb
…js/StaticMapService.GetMapImage?… Cache TTL 1d size: 64kb

## Improve image delivery 
### Google Maps
/maps/vt?pb=…(maps.googleapis.com)
50.8 KiB
40.1 KiB
Increasing the image compression factor could improve this image's download size.
8.1 KiB
This image file is larger than it needs to be (512x512) for its displayed dimensions (256x256). Use responsive images to reduce the image download size.
38.1 KiB
/maps/vt?pb=…(maps.googleapis.com)
47.6 KiB
36.9 KiB
Increasing the image compression factor could improve this image's download size.
4.9 KiB
This image file is larger than it needs to be (512x512) for its displayed dimensions (256x256). Use responsive images to reduce the image download size.
35.7 KiB
/maps/vt?pb=…(maps.googleapis.com)
43.6 KiB
32.9 KiB
This image file is larger than it needs to be (512x512) for its displayed dimensions (256x256). Use responsive images to reduce the image download size.
32.7 KiB
/maps/vt?pb=…(maps.googleapis.com)
35.2 KiB
26.4 KiB
This image file is larger than it needs to be (512x512) for its displayed dimensions (256x256). Use responsive images to reduce the image download size.
26.4 KiB
/maps/vt?pb=…(maps.googleapis.com)
33.6 KiB
25.2 KiB
This image file is larger than it needs to be (512x512) for its displayed dimensions (256x256). Use responsive images to reduce the image download size.
25.2 KiB
…js/StaticMapService.GetMapImage?…(maps.googleapis.com)
63.2 KiB
24.6 KiB
Using a modern image format (WebP, AVIF) or increasing the image compression could improve this image's download size.
24.6 KiB
pickafarm.com 1st party
61.3 KiB	47.8 KiB
/blog-images/best-christmas-trees-800.avif(pickafarm.com)
48.0 KiB
36.1 KiB
This image file is larger than it needs to be (800x408) for its displayed dimensions (378x213). Use responsive images to reduce the image download size.
36.1 KiB
/images/navbarlogo1.webp(pickafarm.com)
13.4 KiB
11.6 KiB
This image file is larger than it needs to be (421x161) for its displayed dimensions (168x64). Use responsive images to reduce the image download size.
11.2 KiB

## Forced Reflow
Top function call
Total reflow time
https://pickafarm.com:2:6564
54 ms
Source
Total reflow time
https://pickafarm.com:1:6788
54 ms
…8d/controls.js:88:173(maps.googleapis.com)
3 ms
…8d/controls.js:162:857(maps.googleapis.com)
8 ms
…8d/controls.js:163:55(maps.googleapis.com)
3 ms
[unattributed]
30 ms
…api/js?key=AIzaSyCjA…&libraries=geometry:263:447(maps.googleapis.com)
4 ms
…8d/controls.js:29:413(maps.googleapis.com)
1 ms
…8d/controls.js:128:372(maps.googleapis.com)
1 ms

## LCP Request Discovery
Optimize LCP by making the LCP image discoverable from the HTML immediately, and avoiding lazy-loadingLCP
lazy load not applied
fetchpriority=high should be applied
Request is discoverable in initial document
div > div > div > img
<img draggable="false" alt="" role="presentation" src="https://maps.googleapis.com/maps/vt?pb=!1m5!1m4!1i7!2i20!3i49!4i256!2m3!1e…" style="width: 256px; height: 256px; user-select: none; border: 0px; padding: 0px;">

## Network Dependency Tree
Avoid chaining critical requests by reducing the length of chains, reducing the download size of resources, or deferring the download of unnecessary resources to improve page load.LCP
Maximum critical path latency: 329 ms
Initial Navigation
https://pickafarm.com - 279 ms, 14.66 KiB
…css/efb9e9c20c27ebf4.css(pickafarm.com) - 321 ms, 12.76 KiB
…cloudflare-static/email-decode.min.js(pickafarm.com) - 329 ms, 1.23 KiB
Preconnected origins
preconnect hints help the browser establish a connection earlier in the page load, saving time when the first request for that origin is made. The following are the origins that the page preconnected to.
no origins were preconnected
Preconnect candidates
Add preconnect hints to your most important origins, but try to use no more than 4.
Origin
Est LCP savings
https://clerk.pickafarm.com
300 ms
https://ipapi.co
300 ms
https://stats.g.doubleclick.net
300 ms
https://pickafarm-api.94623956quebecinc.workers.dev
300 ms

## Reduce JavaScript execution time

URL
Total CPU Time
Script Evaluation
Script Parse
pickafarm.com 1st party
1,200 ms	712 ms	127 ms
…chunks/517-82d7553cc6895b03.js(pickafarm.com)
429 ms
357 ms
20 ms
https://pickafarm.com
278 ms
39 ms
1 ms
…chunks/webpack-2bb27098ce630c08.js(pickafarm.com)
118 ms
117 ms
1 ms
…cloudflare-static/rocket-loader.min.js(pickafarm.com)
114 ms
62 ms
6 ms
…dist/clerk.browser.js(clerk.pickafarm.com)
82 ms
54 ms
26 ms
…dist/framework_clerk.browser_04c54d_5.98.0.js(clerk.pickafarm.com)
69 ms
55 ms
13 ms
…chunks/390-0c105…c617c.js(pickafarm.com)
60 ms
0 ms
60 ms
…dist/subscript….browser_04c54d_5.98.0.js(clerk.pickafarm.com)
50 ms
28 ms
1 ms

### Google Maps
Google Maps utility 
584 ms	400 ms	72 ms
…8d/controls.js(maps.googleapis.com)
215 ms
151 ms
13 ms
…api/js?key=AIzaSyCjA…&libraries=geometry(maps.googleapis.com)
197 ms
148 ms
38 ms
…8d/common.js(maps.googleapis.com)
91 ms
43 ms
13 ms
…8d/map.js(maps.googleapis.com)
82 ms
58 ms
8 ms

## Minimize main-thread work

Minimize main-thread work 2.2 s
Consider reducing the time spent parsing, compiling and executing JS. You may find delivering smaller JS payloads helps with this. Learn how to minimize main-thread workTBT
Category
Time Spent
Script Evaluation
1,222 ms
Script Parsing & Compilation
344 ms
Other
278 ms
Style & Layout
231 ms
Rendering
62 ms
Parse HTML & CSS
45 ms
Garbage Collection
21 ms
