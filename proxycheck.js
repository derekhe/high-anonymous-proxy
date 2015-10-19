/**
 * Created by sche on 10/19/15.
 */

var proxies = require("./out/proxy.json");
var async = require("async");
var request = require("request");
var _ = require("lodash");
var fs = require("fs-extra");

var url = "http://www.qunar.com";
var check = function (html) {
    if (_.isEmpty(html)) return false;
    return html.indexOf("去哪儿网") != -1;
};

var valid = [];

var q = async.queue(function (proxy, callback) {
    var t = new Date();
    request({
        url: url,
        proxy: "http://" + proxy,
        timeout: 5 * 1000
    }, function (error, res, body) {
        var isvalid = check(body);
        if (isvalid) {
            var time = parseInt((new Date() - t) / 1000);
            console.log(proxy, " is valid " + time);
            valid.push({proxy: proxy, time: time});
        }

        process.nextTick(callback);
    })
}, 50);

q.drain = function () {
    var sorted = _.filter(_.sortBy(valid, function (v) {
        return v.time;
    }), function (v) {
        return v.time < 5;
    });

    fs.writeFileSync("./out/valid.json", JSON.stringify(sorted, null, 2));
    console.log(valid.length);
    console.log("done");
};

_.each(proxies, function (proxy) {
    q.push(proxy, function () {

    });
})