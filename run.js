"use strict";
if (process.env.NODE_ENV === "dev") {
    // Load local env variables
    require("./env");
}

if (!process.env.GITHUB_TOKEN) throw new Error("Need process.env.GITHUB_TOKEN");

var escRegExp = require("escape-string-regexp");
var REGEXP = new RegExp(escRegExp(process.env.GITHUB_TOKEN), "g");
function safeLog(str) {
    console.log((str || "").replace(REGEXP, "[GITHUB_TOKEN]"));
}

var INTERVAL_IN_MINUTES = 60;

var job = require("./job")({
    repoUrl: "https://<token>:x-oauth-basic@github.com/tobie/specref.git".replace("<token>", process.env.GITHUB_TOKEN),
    dirname: "specref",
    pushTo: "HEAD:master",
    email: process.env.GITHUB_EMAIL,
    username: process.env.GITHUB_NAME,
    log: safeLog
});

function run() {
    job(function(err) {
        safeLog(err ? err + "" : "success!");
        safeLog("Next update in " + INTERVAL_IN_MINUTES + " minutes.");
        setTimeout(run, INTERVAL_IN_MINUTES * 60 * 1000);
    });
}
run();