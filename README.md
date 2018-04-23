# CAF (Cloud Assistant Framework)

Co-design permanent, active, stateful, reliable cloud proxies with your web app or gadget.

See http://www.cafjs.com

## CAF BLUETOOTH GATT

A library to access Bluetooth GATT services from an IoT device, or a browser using the Web Bluetooth API (Chrome).

## API

    lib/proxy_iot_gatt.js

## Configuration Example

### iot.json

    {
            "module": "caf_iot_gatt#plug_iot",
            "name": "gatt",
            "description": "Access BLE GATT services.",
            "env" : {
                "maxRetries" : "$._.env.maxRetries",
                "retryDelay" : "$._.env.retryDelay",
                "findCharactTimeout" : "process.env.FIND_CHARACT_TIMEOUT||1000"
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
