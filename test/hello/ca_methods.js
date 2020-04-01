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

"use strict";
var caf = require('caf_core');
var caf_comp = caf.caf_components;
var myUtils = caf_comp.myUtils;

exports.methods = {
    '__ca_init__' : function(cb) {
        this.state.out  = {};
        this.state.meta = {};
        this.state.in = {};
        this.state.trace__iot_sync__ = 'traceSync';
        cb(null);
    },
    'getState' : function(cb) {
        cb(null, this.state);
    },
    'traceSync' : function(cb) {
        var $$ = this.$.sharing.$;
        this.state.in = $$.toCloud.get('in');
        cb(null);
    }
};
