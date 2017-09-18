var caf_iot = require('caf_iot');
var caf_core = require('caf_core');

exports.load = function($, spec, name, modules, cb) {
    modules = modules || [];
    modules.push(module);
    modules.push(caf_iot.getModule());

    caf_core.init(modules, spec, name, cb);
};

