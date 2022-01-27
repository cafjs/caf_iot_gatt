# Release notes

Changes for the `Caf.js` project, a Derivative Work (see Apache 2.0 license terms) of the `CAF` project.

The  copyright of the original `CAF` project is assigned to `Hewlett-Packard Development Company, L.P.` and, to respect the terms of the `CAF` license (Apache 2.0), we track changes after `Caf.js` first release here.

## 0.4.3
 - Enable mkStatic() in hosts with no bluetooth hardware

## 0.4.2
 - Enable devices with non-advertised services by using a name prefix.

## 0.4.1
 - Replace callbacks by promises.
 - Provide timeouts for GATT reads/writes or subscribe/unsubscribe.
 - Handle lower case identifiers.
 - Add reset() interface.
 - Support iOS with the WebBLE app.
 - Fix noble dependency to avoid util.promisify missing (browserify)
 - Customize GATT "write without response"
 - Do not rediscover services if it was done recently

## 0.4.0
 - Add new copyright to simplify third-party contributions
