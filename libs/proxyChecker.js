'use strict';
require("babel-core").transform("code");

(function () {
    var _ = require("lodash");
    var async = require("async");
    var request = require("request");
    var fs = require("fs-extra");
    var log4js = require('log4js');
    var logger = log4js.getLogger();

    function validate(proxies) {
        return new Promise((resolve, reject)=> {
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
                        logger.debug(time, proxy);
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

                var results = _.map(sorted, function (s) {
                    return s.proxy;
                });

                results = _.uniq(results);

                logger.debug(results.length);
                logger.debug("done");
                resolve(results);
            };

            _.each(proxies, function (proxy) {
                q.push(proxy, function () {
                });
            })
        });
    };

    module.exports = {
        validate: validate
    }
})();