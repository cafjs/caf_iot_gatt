var hello = require('./hello/main.js');
var helloIoT = require('./hello/iot/main.js');
var caf_iot = require('caf_iot');
var caf_components = caf_iot.caf_components;
var cli = caf_iot.caf_cli;
var myUtils = caf_components.myUtils;
var async = caf_components.async;
var app = hello;
var appIoT = helloIoT;
var crypto = require('crypto');


/*
                            WARNING!!!

    This is not a proper test unit but just a helper program
    to manually test BLE functionality.

    It requires a local BLE device properly configured to export a
   'bcde' service with  characteristics 'abcd' and 'aaaa'.
    See test/puckjs/service.js if you are a lucky owner of a fantastic Puck.js.

    Most of the checks are based on looking at console logs or LEDs...
*/


process.on('uncaughtException', function (err) {
    console.log("Uncaught Exception: " + err);
    console.log(myUtils.errToPrettyStr(err));
    process.exit(1);
});

var CA_NAME = 'antonio-' + crypto.randomBytes(16).toString('hex');
process.env['MY_ID'] = CA_NAME;



module.exports = {
    setUp: function (cb) {
        var self = this;
        app.load(null, {name: 'top'}, 'framework.json', null,
                 function(err, $) {
                     if (err) {
                         console.log('setUP Error' + err);
                         console.log('setUP Error $' + $);
                         // ignore errors here, check in method
                         cb(null);
                     } else {
                         self.$ = $;
                         cb(err, $);
                     }
                 });
    },
    tearDown: function (cb) {
        var self = this;
        if (!this.$) {
            cb(null);
        } else {
            this.$.top.__ca_graceful_shutdown__(null, cb);
        }
    },

    hello: function(test) {
        test.expect(3);
        var s;
        async.series([
            function(cb) {
                s = new cli.Session('http://root-hellogatt.vcap.me:3000',
                                    CA_NAME, {from: CA_NAME,
                                              log: function(x) {
                                                  console.log(x);
                                              }});
                s.onopen = function() {
                    var cb1 = function(err, data) {
                        test.ifError(err);
                        console.log('GOT: '+ JSON.stringify(data));
                        cb(err, data);
                    };
                    async.series([
                        function(cb2) {
                            // input, pullup
                            s.getState(cb2);
                        }
                    ], cb1);
                };
                s.onerror = function(err) {
                    test.ifError(err);
                    console.log(err);
                };
            },
            function(cb) {
                var self = this;
                appIoT.load(null, {name: 'topIoT'}, null, null,
                 function(err, $) {
                     if (err) {
                         console.log('setUP Error' + err);
                         console.log('setUP Error $' + $);
                         // ignore errors here, check in method
                         cb(null);
                     } else {
                         self.$IoT = $;
                         cb(err, $);
                     }
                 });
            },
            function(cb) {
                setTimeout(function() {cb(null);}, 2000);
            },
            function(cb) {
                var self = this;
                s.getState(function(err, state) {
                    console.log(state);
                    cb(err, state);
                });
            },
            function(cb) {
                this.$IoT.topIoT.$.iot.$.handler.findServices('bcde', cb);
            },
            function(cb) {
                setTimeout(function() {cb(null);}, 2000);
            },
            function(cb) {
                this.$IoT.topIoT.$.iot.$.handler.findCharacteristics('abcd', cb);
            },
            function(cb) {
                setTimeout(function() {cb(null);}, 2000);
            },
            function(cb) {
                this.$IoT.topIoT.$.iot.$.handler.read(cb);
            },
            function(cb) {
                setTimeout(function() {cb(null);}, 2000);
            },
            function(cb) {
                this.$IoT.topIoT.$.iot.$.handler.write('on', cb);
            },
            function(cb) {
                setTimeout(function() {cb(null);}, 2000);
            },
            function(cb) {
                this.$IoT.topIoT.$.iot.$.handler.write('off', cb);
            },
            function(cb) {
                setTimeout(function() {cb(null);}, 2000);
            },
            function(cb) {
                this.$IoT.topIoT.$.iot.$.handler.read(cb);
            },
            function(cb) {
                setTimeout(function() {cb(null);}, 2000);
            },
            function(cb) {
                this.$IoT.topIoT.$.iot.$.handler.disconnect(cb);
            },
            function(cb) {
                this.$IoT.topIoT.$.iot.$.handler.findCharacteristics('aaaa',
                                                                     cb);
            },
            function(cb) {
                setTimeout(function() {cb(null);}, 2000);
            },
            function(cb) {
                this.$IoT.topIoT.$.iot.$.handler.subscribe(cb);
            },
            function(cb) {
                setTimeout(function() {cb(null);}, 6000);
            },
            function(cb) {
                this.$IoT.topIoT.$.iot.$.handler.unsubscribe(cb);
            },
            function(cb) {
                setTimeout(function() {cb(null);}, 4000);
            },
            function(cb) {
                var all = this.$IoT.topIoT.$.iot.$.handler.debugGetAll();
                console.log(JSON.stringify(all));
                cb(null);
            },
            function(cb) {
                if (!this.$IoT) {
                    cb(null);
                } else {
                    this.$IoT.topIoT.__ca_graceful_shutdown__(null, cb);
                }
            },
            function(cb) {
                s.onclose = function(err) {
                    test.ifError(err);
                    cb(null);
                };
                s.close();
            }
        ], function(err, res) {
            test.ifError(err);
            test.done();
        });

    }
};
