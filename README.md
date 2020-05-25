# Caf.js

Co-design permanent, active, stateful, reliable cloud proxies with your web app or gadget.

See https://www.cafjs.com

## Library for Bluetooth GATT Services

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
