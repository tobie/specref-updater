#!/usr/bin/env node
"use strict";
var fs = require("fs");
var path = require("path");
var cp = require("child_process");
var async = require("async");
var TMPDIR = require("os").tmpdir();

function spawn(cmd, args, options, callback) {
    var log = options.log || console.log.bind(console);
    delete options.log;
    var called = false;
    function cb(err) {
        if (called) return;
        called = true;
        callback(err);
    }
    var child = cp.spawn(cmd, args || [], options);
    child.on('error', cb);
    child.on('close', function (code) {
        if (code != 0) {
            var err = new Error();
            err.errno = code;
            cb(err);
        } else {
            cb(null);
        }
    });
    
    child.stdout.on('data', function (data) {
        log('' + data);
    });

    child.stderr.on('data', function (data) {
        log('stderr: ' + data);
    });
}

function spawner(cmd, args, options) {
    return function(callback) {
        spawn(cmd, args, options, callback);
    }
}

module.exports = function(options) {
    var dir = path.join(TMPDIR, options.dirname);
    return function (callback) {
        async.series([
            spawner("rm", ["-rf", options.dirname], { cwd: TMPDIR, log: options.log }),
            spawner("mkdir", [options.dirname], { cwd: TMPDIR, log: options.log }),
            spawner("git", ["init"], { cwd: dir, log: options.log }),
            spawner("git", ["config", "user.email", options.email], { cwd: dir, log: options.log }),
            spawner("git", ["config", "user.name", options.username], { cwd: dir, log: options.log }),
            spawner("git", ["pull", options.repoUrl], { cwd: dir, log: options.log }),
            spawner("npm", ["install"], { cwd: dir, log: options.log }),
            spawner("node", ["./scripts/auto-update.js"], { cwd: dir, log: options.log }),
            spawner("git", ["push", options.repoUrl, options.pushTo], { cwd: dir, log: options.log }),
        ], function(err) {
            spawn("rm", ["-rf", options.dirname], { cwd: TMPDIR, log: options.log }, function(err2) {
                if (err2) {
                    return callback(err2);
                }
                if (err) {
                    // 64 stands for no update required.
                    return callback(err.errno == 64 ? null : err);
                }
                return callback(null);
            });
        });
    }
};