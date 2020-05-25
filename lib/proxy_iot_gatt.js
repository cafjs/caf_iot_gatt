// Modifications copyright 2020 Caf.js Labs and contributors
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
const assert = require('assert');
const caf_iot = require('caf_iot');
const caf_comp = caf_iot.caf_components;
const genProxy = caf_comp.gen_proxy;
const utilGatt = require('./util_gatt');

/**
 * Factory method to access GATT services.
 *
 */
exports.newInstance = async function($, spec) {
    try {
        const that = genProxy.create($, spec);

        /**
         * Finds BLE devices that export a GATT service or a collection of
         * GATT services.
         *
         * The provided method will be called with each device exporting the
         *  service. To stop the scanning call `stopFindServices` or
         * `findCharacteristics`.
         *
         * @param {string|Array.<string>} service A service(s) id. They will get
         * converted to lower case due to `noble` package requirements.
         * @param {string} handlerMethodName The method called when a device is
         * found. The type is signature is `function(service, device, cb)`
         * where:
         *  * `service` type  is string or array of strings
         *  * `device` type is noble.peripheral (see
         *      https://github.com/sandeepmistry/noble.git)
         *  * `cb` type is `caf.cb`
         *
         * or `async function(service, device)` returning an array with an
         * error/data pair.
         *
         * @memberof!  module:caf_iot_gatt/proxy_iot_gatt#
         * @alias findServices
         */
        that.findServices = function(service, handlerMethodName) {
            assert((typeof service === 'string') || Array.isArray(service));
            assert(typeof handlerMethodName === 'string');
            const serviceLowerCase = Array.isArray(service) ?
                service.map(x => x.toLowerCase()) :
                service.toLowerCase();
            $._.__iot_findServices__(serviceLowerCase, handlerMethodName);
        };

        /**
         * Finds BLE devices using the `Web Bluetooth API` that export a GATT
         * service or a collection of GATT services.
         *
         * This method is needed in the browser since the
         * `Web Bluetooth API` requires a user click before starting the
         * search. It needs access to the DOM, so it only works in the browser.
         *
         * A returned promise allows the client to wait for user selection.
         *
         * The provided method will be called with the selected device
         * exporting the service(s).
         *
         * @param {string|Array.<string>} service A service(s) id.
         * @param {string} handlerMethodName The method called when a device is
         * found. The type is signature is `function(service, device, cb)`
         * where:
         *  * `service` type  is string or array of strings
         *  * `device` type is noble.peripheral (see
         *      https://github.com/sandeepmistry/noble.git)
         *  * `cb` type is `caf.cb`
         *
         * or `async function(service, device)` returning an array with an
         * error/data pair.
         * @param {string} clickable The id of an HTML button to start the
         * search.
         * @param {string} confirm The id of an HTML confirmation message.
         *
         * @return {Promise<null>} A promise to wait for selection.
         *
         * @memberof!  module:caf_iot_gatt/proxy_iot_gatt#
         * @alias findServicesWeb
         */
        that.findServicesWeb = function(service, handlerMethodName, clickable,
                                        confirm) {
            assert((typeof service === 'string') || Array.isArray(service));
            assert(typeof handlerMethodName === 'string');
            assert(typeof clickable === 'string');
            assert(typeof confirm === 'string');
            assert(typeof window !== 'undefined');

            return new Promise((resolve, reject) => {
                try {
                    /* For example:
                     *  A button with id 'confirmScan' that is only
                     * visible when input is needed to bypass Web BT security
                     * check.
                     *  A confirmation message with id 'afterConfirmScan'
                     * visible after the selection.
                     *
                     *   <button id="confirmScan" style= "display:none;">
                     *     Click to allow Bluetooth scan</button>
                     *   <h2 id="afterConfirmScan" style= "display:none;">
                     *     Running... </h2>
                     */
                    const button = document.getElementById(clickable);
                    button.style = 'display:inline;';
                    button.addEventListener('click', function handler() {
                        try {
                            $._.__iot_findServices__(service,
                                                     handlerMethodName);
                            button.removeEventListener('click', handler);
                            button.style = 'display:none;';
                            const message = document.getElementById(confirm);
                            message.style = 'display:inline;';
                            resolve(null);
                        } catch (err) {
                            reject(err);
                        }
                    });
                } catch (err) {
                    reject(err);
                }
            });
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
         * Finds GATT characteristics of a service.
         *
         *  Implicitly stops scanning for services.
         *
         * @param {string} serviceId A service identifier.
         * @param {noble.peripheral} device A device returned by `findServices`.
         * @param {Array.<string>=} charIds Optional identifiers for the
         * characteristics. If undefined, all the characteristics
         * will be returned. Otherwise, the order in the array response
         * will match the order of this array, and an error will be propagated
         * if any is missing.
         * @param {cbType=} cb A standard callback returning an error, possibly
         * due to a timeout, or an object of type `CharactInfo`:
         *
         *    {service: noble.service, device: noble.peripheral,
         *     characteristics:  Array.<noble.characteristic>}
         *
         * where `service.uuid` is the original identifier.
         *
         * @return {Promise<CharactInfo>|null} A promise with the
         * characteristics if no callback was provided, or `null` otherwise.
         *
         * @memberof!  module:caf_iot_gatt/proxy_iot_gatt#
         * @alias findCharacteristics
         */
        that.findCharacteristics = function(serviceId, device, charIds, cb) {
            assert(typeof serviceId === 'string');
            assert(device && (typeof device === 'object'));
            if (!cb && (typeof charIds === 'function')) {
                // backwards compatibility...
                cb = charIds;
                charIds = undefined;
            }
            charIds && assert(Array.isArray(charIds));
            cb && assert(typeof cb === 'function');

            return $._.__iot_findCharacteristics__(serviceId, device, charIds,
                                                   cb);
        };

        /**
         * Disconnects from a device.
         *
         * The method `findCharacteristics` creates the connection, and keeps it
         * open to read/write/subscribe characteristics.
         *
         * @param {noble.peripheral} device A device to disconnect.
         * @param {number=} delay An optional delay in msec before
         * disconnecting.
         * @param {cbType=} cb An optional callback to wait for disconnection.
         *
         * @return {Promise<null>|null} A promise to wait for disconnection if
         * there was no callback, or `null` otherwise.

         *
         * @memberof!  module:caf_iot_gatt/proxy_iot_gatt#
         * @alias disconnect
         */
        that.disconnect = function(device, delay, cb) {
            assert(device && (typeof device === 'object'));
            return $._.__iot_disconnect__(device, delay, cb);
        };

        /**
         * Disconnects from all connections.
         *
         * @return {Promise<Array.<null>>} A promise to wait for disconnection.
         *
         * @memberof!  module:caf_iot_gatt/proxy_iot_gatt#
         * @alias reset
         */
        that.reset = function() {
            return $._.__iot_reset__();
        };

        /**
         * Reads the value of a  GATT characteristic.
         *
         * @param {noble.characteristic} characteristic A characteristic to
         * read.
         * @param {string} handlerMethodName The method called with the
         * characteristic value.
         *
         * The type is signature is `function(charact, value, cb)`
         * where:
         *  * `charact` type is noble.characteristic
         *  * `value` type is Buffer
         *  * `cb` type is `caf.cb`
         *
         * or `async function(charact, value)` returning an array with an
         * error/data pair.
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
         * Dirty reads the value of a GATT characteristic, i.e., breaking the
         * transaction.
         *
         * The read timed out, rejecting the promise with an error, if it takes
         * longer than `RWCharactTimeout` msec.
         *
         * @param {noble.characteristic} characteristic A characteristic to
         * read.
         * @return {Promise<Buffer>} A promise with the read value.
         *
         * @memberof!  module:caf_iot_gatt/proxy_iot_gatt#
         * @alias dirtyRead
         */
        that.dirtyRead = function(characteristic) {
            assert(characteristic && (typeof characteristic === 'object'));
            return $._.__iot_dirtyRead__(characteristic);
        };

        /**
         * Writes the value of a  GATT characteristic.
         *
         * This write times out, rejecting the promise with an error, if it
         * takes longer than `RWCharactTimeout` msec.
         *
         * @param {noble.characteristic} characteristic A characteristic to
         * write.
         * @param {Buffer} value The new value.
         *
         * @return {Promise<null>} A promise to wait for completion or notify
         * a timeout error.
         *
         * @memberof!  module:caf_iot_gatt/proxy_iot_gatt#
         * @alias write
         */
        that.write = function(characteristic, value) {
            assert(characteristic && (typeof characteristic === 'object'));
            return $._.__iot_write__(characteristic, value);
        };

        /**
         * Subscribes to a  GATT characteristic.
         *
         * This operation times out, rejecting the promise with an error, if it
         * takes longer than `RWCharactTimeout` msec.
         *
         * @param {noble.characteristic} characteristic A characteristic to
         * read.
         * @param {string} handlerMethodName The method called with the
         * characteristic value.
         *
         * The method type signature is `function(charact, value, cb)`
         * where:
         *  * `charact` type is noble.characteristic
         *  * `value` type is Buffer
         *  * `cb` type is `caf.cb`
         *
         * or `async function(charact, value)` returning an array with an
         * error/data pair.
         *
         * @return {Promise<null>} A promise to wait for completion or notify
         * a timeout error.
         *
         * @memberof!  module:caf_iot_gatt/proxy_iot_gatt#
         * @alias subscribe
         */
        that.subscribe = function(characteristic, handlerMethodName) {
            assert(characteristic && (typeof characteristic === 'object'));
            assert(typeof handlerMethodName === 'string');
            return $._.__iot_subscribe__(characteristic, handlerMethodName);
        };

        /**
         * Unsubscribes to a  GATT characteristic.
         *
         * This operation times out, rejecting the promise with an error, if it
         * takes longer than `RWCharactTimeout` msec.
         *
         * @param {noble.characteristic} characteristic A characteristic to
         * unsubscribe.
         *
         * @return {Promise<null>} A promise to wait for completion or notify
         * a timeout error.
         *
         * @memberof!  module:caf_iot_gatt/proxy_iot_gatt#
         * @alias unsubscribe
         */
        that.unsubscribe = function(characteristic) {
            assert(characteristic && (typeof characteristic === 'object'));
            return $._.__iot_unsubscribe__(characteristic);
        };

        /**
         * Utility function to compare characteristic ids.
         *
         * @param {string} x A characteristic id to compare.
         * @param {string} y Another characteristic id to compare.
         * @return {boolean} True if they map to the same characteristic.
         *
         * @memberof!  module:caf_iot_gatt/proxy_iot_gatt#
         * @alias compareId
         */
        that.compareId = function(x, y) {
            assert(typeof x === 'string');
            assert(typeof y === 'string');
            return utilGatt.compareId(x, y);
        };

        Object.freeze(that);
        return [null, that];
    } catch (err) {
        return [err];
    }
};
