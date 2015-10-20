/**
 * Created by sche on 10/19/15.
 */
var Agent = require('socks5-http-client/lib/Agent');
var request = require('request');
var async = require('async');
var fs = require('fs-extra');

var proxy = [];

function getUrl(url) {
    return {
        url: url,
        agentClass: Agent,
        agentOptions: {
            socksHost: 'localhost',
            socksPort: 7070
        },
        timeout: 20 * 1000
    }
}

function proxy_com_ru(callback) {
    var url = "http://www.proxy.com.ru/gaoni/";
    request(getUrl(url)
        , function (err, res, body) {
            var re = /<td>(.*?)<\/td><td>(.*?)<\/td><td>(.*?)<\/td>/g;

            regexMatch(re, body, function (m) {
                proxy.push(m[2] + ":" + m[3]);
            });

            callback(url);
        });
}

function cn_proxy(callback) {
    var url = "http://cn-proxy.com/";
    request(getUrl(url)
        , function (err, res, body) {
            var re = /(\d+\.\d+.\d+.\d+)<\/td>\s*<td>(\d+)<\/td>/g;

            regexMatch(re, body, function (m) {
                proxy.push(m[1] + ":" + m[2]);
            });

            callback(url);
        });
}

function getproxy_ip(callback, args) {
    var url = "http://www.getproxy.jp/china" + args;
    request(getUrl(url)
        , function (err, res, body) {
            var re = /(\d+\.\d+.\d+.\d+\:\d+)/g;

            regexMatch(re, body, function (m) {
                proxy.push(m[1])
            });

            callback(url);
        });
}

function regexMatch(re, body, func) {
    var m;

    while ((m = re.exec(body)) !== null) {
        if (m.index === re.lastIndex) {
            re.lastIndex++;
        }

        func(m);
    }
}
function kuai_daili(callback, args) {
    var url = "http://www.kuaidaili.com/proxylist/" + args + "/";
    request(getUrl(url)
        , function (err, res, body) {
            var re = /<td>(\d+\.\d+\.\d+\.\d+)<\/td>\s*<td>(\d+)<\/td>/gm;
            regexMatch(re, body, function (m) {
                proxy.push(m[1] + ":" + m[2])
            });
            callback(url);
        });
}

function pachong_org(callback) {
    var url = "http://pachong.org/area/short/name/cn/type/high.html";
    request(getUrl(url)
        , function (err, res, body) {
            var scriptRe = /<script type="text\/javascript">(.*?)<\/script>/gm;
            var script;
            regexMatch(scriptRe, body, function (m) {
                script = m[1];
            });

            var re = /<td>(\d+\.\d+\.\d+\.\d+)<\/td>\s+<td><script>document.write(.*?)<\/script>/gm;

            regexMatch(re, body, function (m) {
                var port = eval(script + ";" + m[2]);
                proxy.push(m[1] + ":" + port);
            });
            callback(url);
        });
}

function gatherproxy(callback, args) {
    var url = "http://www.gatherproxy.com/proxylist/country/";
    var options = getUrl(url);
    options.method = "POST";
    options.form = {
        "Filter": "elite",
        "Uptime": "70",
        "Country": "China",
        "PageIdx": args
    };

    request(options, function (err, res, body) {
        var re = /write\('(\d+\.\d+\.\d+\.\d+)'\)<\/script><\/td>\s*(.*?)dep\('(\d+)'/gm;
        regexMatch(re, body, function (m) {
            var ip = m[1] + ":" + parseInt(m[3], 16);
            proxy.push(ip);
        });

        callback(url + " " + args);
    })
}

var q = async.queue(function (task, callback) {
    task.f(callback, task.args);
}, 30);

var tasks = [];
var tasks = [{f: proxy_com_ru}, {f: pachong_org}, {f: cn_proxy}];

for (var page = 1; page <= 5; page++) {
    tasks.push({f: getproxy_ip, args: page});
}

for (var page = 1; page <= 10; page++) {
    tasks.push({f: kuai_daili, args: page});
}

for (var page = 1; page <= 50; page++) {
    tasks.push({f: gatherproxy, args: page});
}

q.push(tasks, function (url) {
    console.log("Finished ", url, " remaining ", q.length());
});

q.drain = function () {
    console.log(proxy);
    console.log(proxy.length);
    fs.ensureDirSync("./out");
    fs.writeFileSync("./out/proxy.json", JSON.stringify(proxy, null, 2));
};