'use strict';
require("babel-core").transform("code");
var fetch = require("./libs/proxyCrawler.js");
var checker = require("./libs/proxyChecker.js");
var express = require('express');
var app = express();
var log4js = require('log4js');
var logger = log4js.getLogger();

var allProxy = [];
var validProxy = [];

app.get('/proxy', function (req, res) {
    res.send(allProxy);
});

app.get('/proxy/valid', function (req, res) {
    res.send(validProxy);
});

app.post('/refresh', function (req, res) {
    refresh();

    res.send(200);
});


app.listen(9090, function () {
    logger.debug("app listening");
    refresh();
});

function refresh(){
    fetch.fetchProxy().then(function (proxy) {
        logger.debug(proxy);
        allProxy = proxy;
        return checker.check(proxy);
    }).then(function (validated) {
        validProxy = validated;
        logger.debug(validated);
    });
}