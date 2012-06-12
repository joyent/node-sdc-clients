// Copyright 2012 Joyent, Inc.  All rights reserved.

var Logger = require('bunyan');
var restify = require('restify');
var uuid = require('node-uuid');

var VMAPI = require('../lib/index').VMAPI;
var NAPI = require('../lib/index').NAPI;



// --- Globals

var VMAPI_URL = 'http://' + (process.env.VMAPI_IP || '10.99.99.18');
var NAPI_URL = 'http://' + (process.env.NAPI_IP || '10.99.99.10');

var vmapi = null;
var napi = null;
var ZONE = null;
var IMAGE_UUID = null;
var QUERY = null;
var CUSTOMER = '930896af-bf8c-48d4-885c-6573a94b1853';
var NETWORKS = null;



// --- Helpers

function waitForState(state, callback) {
    function check() {
        return vmapi.getVm(QUERY, function (err, vm) {
            if (err)
                return callback(err);

            if (vm.state === state)
                return callback(null);

            return setTimeout(check, 3000);
        });
    }

    return check();
}


// TODO duplicated function above. Fix soon
function waitForAlias(alias, callback) {
    function check() {
        return vmapi.getVm(QUERY, function (err, vm) {
            if (err)
                return callback(err);

            if (vm.alias === alias)
                return callback(null);

            return setTimeout(check, 3000);
        });
    }

    return check();
}


// --- Tests

exports.setUp = function (callback) {
    var logger = new Logger({
            name: 'vmapi_unit_test',
            stream: process.stderr,
            level: (process.env.LOG_LEVEL || 'info'),
            serializers: Logger.stdSerializers
    });

    vmapi = new VMAPI({
        url: VMAPI_URL,
        retry: {
            retries: 1,
            minTimeout: 1000
        },
        log: logger
    });

    napi = new NAPI({
        url: NAPI_URL,
        retry: {
            retries: 1,
            minTimeout: 1000
        },
        log: logger
    });

    callback();
};



exports.test_list_networks = function (test) {
    napi.listNetworks({}, function (err, networks) {
        test.ifError(err);
        test.ok(networks);
        NETWORKS = networks[0].uuid;
        test.done();
    });
};


exports.test_list_vms = function (test) {
    vmapi.listVms(function (err, vms) {
        test.ifError(err);
        test.ok(vms);
        ZONE = vms[0].uuid;
        IMAGE_UUID = vms[0].image_uuid;
        QUERY = {
            uuid: ZONE,
            owner_uuid: CUSTOMER
        };
        test.done();
    });
};


exports.test_list_vms_by_owner = function (test) {
    vmapi.listVms({ owner_uuid: CUSTOMER }, function (err, vms) {
        test.ifError(err);
        test.ok(vms);
        test.done();
    });
};


exports.test_get_vm = function (test) {
    vmapi.getVm(QUERY, function (err, vm) {
        test.ifError(err);
        test.ok(vm);
        test.done();
    });
};


exports.test_create_zone = function (test) {
    var opts = {
        owner_uuid: CUSTOMER,
        image_uuid: IMAGE_UUID,
        networks: NETWORKS,
        brand: 'joyent-minimal',
        ram: 64
    };

    vmapi.createVm(opts, function (err, job) {
        test.ifError(err);
        test.ok(job);
        ZONE = job.vm_uuid;
        QUERY = {
            uuid: ZONE,
            owner_uuid: CUSTOMER
        };
        test.done();
    });
};


exports.test_wait_for_running = function (test) {
    waitForState('running', function (err) {
        test.ifError(err);
        setTimeout(function () {
            // Try to avoid the reboot after zoneinit so we don't stop the zone
            // too early
            test.done();
        }, 20000);
    });
};


exports.test_update_zone = function (test) {
    var UPDATE_QUERY = {
        uuid: ZONE,
        owner_uuid: CUSTOMER,
        alias: 'foobar'
    };

    vmapi.updateVm(UPDATE_QUERY, function (err, job) {
        test.ifError(err);
        test.ok(job);
        test.done();
    });
};


exports.test_wait_for_updated = function (test) {
    waitForAlias('foobar', function (err) {
        test.ifError(err);
        test.done();
    });
};


exports.test_stop_zone = function (test) {
    vmapi.stopVm(QUERY, function (err, job) {
        test.ifError(err);
        test.ok(job);
        test.done();
    });
};


exports.test_wait_for_stopped = function (test) {
    waitForState('stopped', function (err) {
        test.ifError(err);
        test.done();
    });
};


exports.test_start_zone = function (test) {
    vmapi.startVm(QUERY, function (err, job) {
        test.ifError(err);
        test.ok(job);
        test.done();
    });
};


exports.test_wait_for_started = function (test) {
    waitForState('running', function (err) {
        test.ifError(err);
        test.done();
    });
};


exports.test_reboot_zone = function (test) {
    vmapi.rebootVm(QUERY, function (err, job) {
        test.ifError(err);
        test.ok(job);
        test.done();
    });
};


exports.test_wait_for_reboot = function (test) {
    setTimeout(function () {
        waitForState('running', function (err) {
            test.ifError(err);
            test.done();
        });
    }, 3000);
};


exports.test_destroy_zone = function (test) {
    vmapi.deleteVm(QUERY, function (err, job) {
        test.ifError(err);
        test.ok(job);
        test.done();
    });
};


exports.test_wait_for_destroyed = function (test) {
    waitForState('destroyed', function (err) {
        test.ifError(err);
        test.done();
    });
};
