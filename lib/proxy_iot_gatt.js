/*!
Copyright 2013 Hewlett-Packard Development Company, L.P.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

'use strict';

/**
 * A proxy to access BLE GATT services.
 *
 *  The typical workflow is:
 *
 * 1. `findServices` to find devices that export a particular service. If
 *  reading advertised data is all it is needed, stop here.
 *
 * 2. Otherwise, pick one of them. Use `findCharacteristics` to create a
 * connnection and discover its characteristics.
 *
 * 3. Read/Write/Subscribe/Unsubscribe to these characteristics.
 *
 * 4. Disconnect, and if needed, go back to step 2 with a different device.
 *
 * Note that to maintain compatibility with current WebBluetooth API we are
 * not discovering all BLE services in a device. The service id needs
 * to be known beforehand.
 *
 *
 * @module caf_iot_gatt/proxy_iot_gatt
 * @augments external:caf_components/gen_proxy
 *
 */
var assert = require('assert');
var caf_iot = require('caf_iot');
var caf_comp = caf_iot.caf_components;
var genProxy = caf_comp.gen_proxy;

/**
 * Factory method to access GATT services.
 *
 */
exports.newInstance = function($, spec, cb) {

    var that = genProxy.constructor($, spec);

    /**
     * Finds BLE devices that export a GATT service.
     *
     * The provided method will be called with each device exporting the
     *  service. To stop the scanning call `stopFindServices` or
     * `findCharacteristics`.
     *
     * @param {string} service A service id.
     * @param {string} handlerMethodName The method called when a device is
     * found. The type is signature is `function(service, device, cb)`
     * where:
     *  * `service` type  is string
     *  * `device` type is noble.peripheral (see
     *      https://github.com/sandeepmistry/noble.git)
     *  * `cb` type is `caf.cb`
     *
     * @memberof!  module:caf_iot_gatt/proxy_iot_gatt#
     * @alias findServices
     */
    that.findServices = function(service, handlerMethodName) {
        assert(typeof service === 'string');
        assert(typeof handlerMethodName === 'string');
        $._.__iot_findServices__(service, handlerMethodName);
    };

    /**
     * Stops scanning for services.
     *
     * @memberof!  module:caf_iot_gatt/proxy_iot_gatt#
     * @alias stopFindServices
     */
    that.stopFindServices = function() {
        $._.__iot_stopFindServices__();
    };

    /**
     * Finds all the GATT characteristics of a service.
     *
     *  Implicitly stops scanning for services.
     *
     * @param {string} serviceId A service identifier.
     * @param {noble.peripheral} device A device returned by `findServices`.
     * @param {string} handlerMethodName The method called when the
     * characteristics  are found.
     * The type is signature is `function(service, device, charact, cb)`
     * where:
     *  * `service` type  is noble.service (service.uuid is original identifier)
     *  * `device` type is noble.peripheral
     *  * `charact` type is Array.<noble.characteristic>
     *  * `cb` type is `caf.cb`
     *
     * @memberof!  module:caf_iot_gatt/proxy_iot_gatt#
     * @alias findCharacteristics
     */
    that.findCharacteristics = function(serviceId, device, handlerMethodName) {
        assert(typeof serviceId === 'string');
        assert(device && (typeof device === 'object'));
        assert(typeof handlerMethodName === 'string');

        $._.__iot_findCharacteristics__(serviceId, device, handlerMethodName);
    };

    /**
     * Disconnects from a device.
     *
     * The method `findCharacteristics` creates the connection, and keeps it
     * open to read/write/subscribe characteristics.
     *
     * @param {noble.peripheral} device A device to disconnect.
     *
     * @memberof!  module:caf_iot_gatt/proxy_iot_gatt#
     * @alias disconnect
     */
    that.disconnect = function(device) {
        assert(device && (typeof device === 'object'));
        $._.__iot_disconnect__(device);
    };

    /**
     * Reads the value of a  GATT characteristic.
     *
     * @param {noble.characteristic} characteristic A characteristic to read.
     * @param {string} handlerMethodName The method called with the
     * characteristic value.
     *
     * The type is signature is `function(charact, value, cb)`
     * where:
     *  * `charact` type is noble.characteristic
     *  * `value` type is Buffer
     *  * `cb` type is `caf.cb`
     *
     * @memberof!  module:caf_iot_gatt/proxy_iot_gatt#
     * @alias read
     */
    that.read = function(characteristic, handlerMethodName) {
        assert(characteristic && (typeof characteristic === 'object'));
        assert(typeof handlerMethodName === 'string');
        $._.__iot_read__(characteristic, handlerMethodName);
    };

    /**
     * Writes the value of a  GATT characteristic.
     *
     * @param {noble.characteristic} characteristic A characteristic to write
     * @param {Buffer} value The new value.
     *
     * @memberof!  module:caf_iot_gatt/proxy_iot_gatt#
     * @alias write
     */
    that.write = function(characteristic, value) {
        assert(characteristic && (typeof characteristic === 'object'));
        $._.__iot_write__(characteristic, value);
    };

    /**
     * Subscribes to a  GATT characteristic.
     *
     * @param {noble.characteristic} characteristic A characteristic to read.
     * @param {string} handlerMethodName The method called with the
     * characteristic value.
     *
     * The type is signature is `function(charact, value, cb)`
     * where:
     *  * `charact` type is noble.characteristic
     *  * `value` type is Buffer
     *  * `cb` type is `caf.cb`
     *
     *
     * @memberof!  module:caf_iot_gatt/proxy_iot_gatt#
     * @alias subscribe
     */
    that.subscribe = function(characteristic, handlerMethodName) {
        assert(characteristic && (typeof characteristic === 'object'));
        assert(typeof handlerMethodName === 'string');
        $._.__iot_subscribe__(characteristic, handlerMethodName);
    };

    /**
     * Unsubscribes to a  GATT characteristic.
     *
     * @param {noble.characteristic} characteristic A characteristic to
     * unsubscribe.
     *
     * @memberof!  module:caf_iot_gatt/proxy_iot_gatt#
     * @alias unsubscribe
     */
    that.unsubscribe = function(characteristic) {
        assert(characteristic && (typeof characteristic === 'object'));
        $._.__iot_unsubscribe__(characteristic);
    };

    Object.freeze(that);

    cb(null, that);
};
