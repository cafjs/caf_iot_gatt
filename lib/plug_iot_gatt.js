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
 *  Provides access to BLE GATT services.
 *
 *  * Properties:
 *
 *  {findCharactTimeout: number}
 *
 * `findCharactTimeout` is a timeout in msec to detect a hang while finding
 * a BLE device characteristics.
 *
 * @module caf_iot_gatt/plug_iot_gatt
 * @augments external:caf_iot/gen_plug_iot
 *
 */
var assert = require('assert');
var caf_iot = require('caf_iot');
var caf_comp = caf_iot.caf_components;
var myUtils = caf_comp.myUtils;
var async = caf_comp.async;
var genPlugIoT = caf_iot.gen_plug_iot;
var noble = require('@abandonware/noble');


/**
 * Factory method for a plug to  BLE GATT services.
 *
 */
exports.newInstance = function($, spec, cb) {
    try {
        var that = genPlugIoT.constructor($, spec);

        $._.$.log && $._.$.log.debug('New BLE GATT plug');

        assert.equal(typeof(spec.env.findCharactTimeout), 'number',
                     "'spec.env.findCharactTimeout' is not a number");
        var findCharactTimeout = spec.env.findCharactTimeout;

        var subscribers = {};

        var finders = {};

        that.__iot_findServices__ = function(service, handlerMethodName) {
            var findServices = function() {
                that.__iot_stopFindServices__();
                noble.startScanning([service]);
                var f = function(peripheral) {
                    $._.$.log && $._.$.log.debug('found device:' +
                                                 peripheral.uuid +
                                                 ' for service:' + service);
                    var args = [service, peripheral];
                    $._.$.queue.process(handlerMethodName, args,
                                        {noSync: true});
                };
                finders[service] = f;
                noble.on('discover', f);
            };

            // allow lazy initialization of noble
            if (noble.state === 'poweredOn') {
                findServices();
            } else {
                noble.removeAllListeners('stateChange');
                noble.once('stateChange', function(state) {
                    if (state === 'poweredOn') {
                        findServices();
                    } else {
                        var err = new Error('BLE not powered on');
                        $._.$.log &&
                            $._.$.log.warn(myUtils.errToPrettyStr(err));
                    }
                });
            }
        };

        that.__iot_stopFindServices__ = function() {
            var resetFinders = function() {
                noble.stopScanning();
                Object.keys(finders).forEach(function(x) {
                    noble.removeListener('discover', finders[x]);
                    delete finders[x];
                });
            };
            resetFinders();
        };

        that.__iot_disconnect__ = function(peripheral, delay, cb) {
            if (delay) {
                setTimeout(function() {
                    that.__iot_disconnect__(peripheral, 0, cb);
                }, delay);
            } else {
                peripheral.disconnect(cb);
            }
        };

        var toNumber = function(str) {
            var result;
            var numStr = str.toUpperCase();
            if (numStr.indexOf('0X') === 0) {
                result = parseInt(numStr);
            } else {
                result = parseInt('0X' + numStr);
            }
            return (isNaN(result) ? str : result);
        };

        that.__iot_findCharacteristics__ = function(serviceId, peripheral,
                                                    cb0) {
            var matchId = function(services) {
                var result = null;
                services.some(function(x) {
                    var matchServiceId = serviceId;
                    if ((typeof matchServiceId === 'string') &&
                        (typeof x.uuid === 'number')) {
                        matchServiceId = toNumber(serviceId);
                    }
                    if (x.uuid === matchServiceId) {
                        result = x;
                        return true;
                    } else {
                        return false;
                    }
                });
                return result;
            };

            var f = function(cbTop) {
                that.__iot_stopFindServices__();
                var service = null;
                async.waterfall([
                    function(cb1) {
                        $._.$.log && $._.$.log.debug('#1# connect');
                        peripheral.connect(function(err) { cb1(err, null); });
                    },
                    function(_ignore, cb1) {
                        $._.$.log && $._.$.log.debug('#2# discover services');
                        peripheral.discoverServices([serviceId],
                                                    function(err, data) {
                                                        cb1(err, data || []);
                                                    });
                    },
                    function(services, cb1) {
                        $._.$.log && $._.$.log.debug('#3# discover characts');
                        services = Array.isArray(services) ? services :
                            [services];
                        service = matchId(services);
                        if (service) {
                            service.discoverCharacteristics([], cb1);
                        } else {
                            cb1(new Error('no matching service ' + serviceId));
                        }
                    }
                ], function (err, chrs) {
                    $._.$.log && $._.$.log.debug('#4# queue handler');
                    if (err) {
                        $._.$.log &&
                            $._.$.log.warn(myUtils.errToPrettyStr(err));
                        try {
                            peripheral.disconnect();
                        } catch (_ign) {/*ignore*/}
                        cbTop(err);
                    } else {
                        var result = {service: service, device: peripheral,
                                      characteristics: chrs};
                        cbTop(null, result);
                    }
                });
            };

            f = myUtils.wrapWithTimeout(f, findCharactTimeout);
            f(cb0);
        };

        that.__iot_read__ = function(characteristic, handlerMethodName) {
            characteristic.read(function(err, data) {
                if (err) {
                    $._.$.log && $._.$.log.warn(myUtils.errToPrettyStr(err));
                } else {
                    var args = [characteristic, data];
                    $._.$.queue.process(handlerMethodName, args,
                                        {noSync: true});
                }
            });
        };

        that.__iot_write__ = function(characteristic, value) {
            characteristic.write(value, true);
        };

        that.__iot_subscribe__ = function(characteristic, handlerMethodName) {
            if (!subscribers[characteristic.uuid]) {
                characteristic.subscribe();
                var f = function(data) {
                    var args = [characteristic, data];
                    $._.$.queue.process(handlerMethodName, args,
                                        {noSync: true});
                };
                characteristic.on('data', f);
                subscribers[characteristic.uuid] = f;
            } else {
                $._.$.log && $._.$.log.debug('Ignoring duplicate subscription' +
                                            ' in ' + characteristic.uuid);
            }
        };

        that.__iot_unsubscribe__ = function(characteristic) {
            if (subscribers[characteristic.uuid]) {
                characteristic.unsubscribe();
                characteristic.removeListener('data',
                                              subscribers[characteristic.uuid]);
                delete subscribers[characteristic.uuid];
            } else {
                $._.$.log && $._.$.log.debug('Ignoring unsubscribe ' +
                                            ' in ' + characteristic.uuid);
            }
        };

        noble.removeAllListeners('error');
        noble.on('error', function(err) {
            $._.$.log && $._.$.log.debug('Got error in BLE :' +
                                         myUtils.errToPrettyStr(err));
            that.__ca_shutdown__(null, function(err) {
                if (err) {
                    $._.$.log &&
                        $._.$.log.debug('Got error in BLE shutdown:' +
                                        myUtils.errToPrettyStr(err));
                }
            });
        });

        cb(null, that);
    } catch (err) {
        cb(err);
    }
};
