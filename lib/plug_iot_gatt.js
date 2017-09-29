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
 * @module caf_iot_gatt/plug_iot_gatt
 * @augments external:caf_iot/gen_plug_iot
 *
 */
var caf_iot = require('caf_iot');
var caf_comp = caf_iot.caf_components;
var myUtils = caf_comp.myUtils;
var async = caf_comp.async;
var genPlugIoT = caf_iot.gen_plug_iot;
var noble = require('noble');


/**
 * Factory method for a plug to  BLE GATT services.
 *
 */
exports.newInstance = function($, spec, cb) {
    try {
        var that = genPlugIoT.constructor($, spec);

        $._.$.log && $._.$.log.debug('New BLE GATT plug');

        var subscribers = {};

        var finders = {};

        that.__iot_findServices__ = function(service, handlerMethodName) {
            that.__iot_stopFindServices__();
            noble.startScanning([service]);
            var f = function(peripheral) {
                $._.$.log && $._.$.log.debug('found device:' + peripheral.uuid
                                             + ' for service:' + service);
                var args = [service, peripheral];
                $._.$.queue.process(handlerMethodName, args, {noSync: true});
            };
            finders[service] = f;
            noble.on('discover', f);
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

        that.__iot_disconnect__ = function(peripheral) {
            peripheral.disconnect();
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
                                                    handlerMethodName) {
            that.__iot_stopFindServices__();
            var service = null;
            async.waterfall([
                function(cb1) {
                    peripheral.connect(function(err) {
                        cb1(err, null);
                    });
                },
                function(_ignore, cb1) {
                    peripheral.discoverServices([serviceId], cb1);
                },
                function(services, cb1) {
                    var matchId = function() {
                        var result = null;
                        services.some(function(x) {
                            var matchServiceId = serviceId;
                            if ((typeof matchServiceId === 'string') &
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
                    services = Array.isArray(services) ? services : [services];
                    service = matchId();
                    if (service) {
                        service.discoverCharacteristics([], cb1);
                    } else {
                        cb1(new Error('no matching service ' + serviceId));
                    }
                }
            ], function (err, chrs) {
                if (err) {
                    $._.$.log && $._.$.log.warn(myUtils.errToPrettyStr(err));
                } else {
                    var args = [service, peripheral, chrs];
                    $._.$.queue.process(handlerMethodName, args,
                                        {noSync: true});
                }
            });
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
            characteristic.write(value);
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

        if (process.env['MK_STATIC']) {
            // dry run to capture dependencies, ble not accessible sometimes
            cb(null, that);
        } else if (noble.state === 'poweredOn') {
            cb(null, that);
        } else {
            noble.once('stateChange', function(state) {
                if (state === 'poweredOn') {
                    cb(null, that);
                } else {
                    cb(new Error('BLE not powered on'));
                }
            });
        }

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

    } catch (err) {
        cb(err);
    }
};
