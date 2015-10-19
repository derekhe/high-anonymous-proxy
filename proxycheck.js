
/**
 * Created by sche on 10/19/15.
 */

var _ = require("lodash");
var proxies = require("./out/proxy.json");
var async = require("async");
var request = require("request");
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
        timeout: 10 * 1000,
        time: true
    }, function (error, res, body) {
        var isvalid = check(body);
        if (isvalid) {
            var time = parseInt(res.elapsedTime / 1000);
            console.log(time, proxy);
            valid.push({proxy: proxy, time: time});
        }

        process.nextTick(callback);
    })
}, 100);

q.drain = function () {
    var sorted = _.filter(_.sortBy(valid, function (v) {
        return v.time;
    }), function (v) {
        return v.time < 5;
    });

    var results = _.map(sorted, function(s){
        return s.proxy;
    });

    fs.writeFileSync("./out/valid.json", JSON.stringify(results, null, 2));
    console.log(results.length);
    console.log("done");
};

console.log(proxies.length);
_.each(proxies, function (proxy) {
    q.push(proxy, function () {
    });
})