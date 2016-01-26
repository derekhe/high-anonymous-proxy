'use strict';
require("babel-core").transform("code");
var fetch = require("./libs/proxyCrawler.js");
var checker = require("./libs/proxyChecker.js");

fetch.fetchProxy().then(function(proxy){
    console.log(proxy);
    return checker.validate(proxy);
}).then(function(validated){
    console.log(validated);
});