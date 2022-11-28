# Caf.js

Co-design cloud assistants with your web app and IoT devices.

See https://www.cafjs.com

## Library for Bluetooth GATT Services

A library to access Bluetooth GATT services from an IoT device, or a browser using the Web Bluetooth API (Chrome).

## Dependencies Warning

To eliminate expensive dependencies for apps in the workspace that do not need `caf_iot_gatt`, the packages `@abandonware/noble@^1.9.2-7`, `readable-stream@^2.3.7`, and `@abandonware/bluetooth-hci-socket@^0.5.3-1`have been declared as optional dependencies even though they are always needed.

Applications that depend on `caf_iot_gatt` should also include these dependencies in package.json as normal dependencies.


## API

    lib/proxy_iot_gatt.js

## Configuration Example

### iot.json
```
    {
            "module": "caf_iot_gatt#plug_iot",
            "name": "gatt",
            "description": "Access BLE GATT services.",
            "env" : {
                "maxRetries" : "$._.env.maxRetries",
                "retryDelay" : "$._.env.retryDelay",
                "findCharactTimeout" : "process.env.FIND_CHARACT_TIMEOUT||4000",
                "RWCharactTimeout" : "process.env.RW_CHARACT_TIMEOUT||2000"
            },
            "components" : [
                {
                    "module": "caf_iot_gatt#proxy_iot",
                    "name": "proxy",
                    "description": "Proxy to access GATT services.",
                    "env" : {
                    }
                }
            ]
    }
```
## Debugging Web Bluetooth API on Chrome

The Web Bluetooth API is only available with `https` or a `localhost` address, and it will not work with our usual `http://*.localtest.me` local address.

It is also blocked for cross-origin iframes, and the app needs to be in its own tab. This is the reason all the examples (see `caf_helloiotbrowser2`) spawn a new page when Bluetooth activates.

In the rest of this discussion we are referring to the URL of this new page, e.g., `http://root-helloiotbrowser2.localtest.me/...`.

In Chrome (and only in Chrome) you can have subdomains in localhost, e.g., `root-helloiotbrowser2.localhost`, and they correctly resolve to the local interface. When running in local mode, i.e., after `cafjs run`, the application is always exposed on local port 3003.

Therefore, a hack to get Web Bluetooth API to work in local mode is as follows:

-Run your app locally as usual, spawn the window with Bluetooth code. It will have an address of the form `http://root-<app>.localtest.me/...&token=...`

-Replace `localtest.me` by `localhost:3003` in the Chrome address bar and reload. Leave the rest of the URL as it is, e.g.:
```
    http://root-<app>.localhost:3003/... &token=...
```
And now Web Bluetooth is working!
