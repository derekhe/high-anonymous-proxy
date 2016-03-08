var Agent = require('socks5-http-client/lib/Agent');
var request = require('request');
var async = require('async');
var fs = require('fs-extra');
var argv = require('minimist')(process.argv.slice(2));
var proxy = [];
var _ = require("lodash");

var socks;
if (argv["socks"]) {
    socks = argv["socks"].split(":");
}

function getOptions(url) {
    var opt = {
        url: url,
        timeout: 20 * 1000
    };

    if (socks) {
        opt.agentClass = Agent;
        opt.agentOptions = {
            socksHost: socks[0],
            socksPort: socks[1]
        }
    }

    return opt;
}

function finish(callback, args) {
    process.nextTick(function () {
        callback(args);
    });
}


function proxy_com_ru(callback) {
    var url = "http://www.proxy.com.ru/gaoni/";
    request(getOptions(url)
        , function (err, res, body) {
            var re = /<td>(.*?)<\/td><td>(.*?)<\/td><td>(.*?)<\/td>/g;

            regexMatch(re, body, function (m) {
                proxy.push(m[2] + ":" + m[3]);
            });

            finish(callback, url);
        });
}

function cn_proxy(callback) {
    var url = "http://cn-proxy.com/";
    request(getOptions(url)
        , function (err, res, body) {
            var re = /(\d+\.\d+.\d+.\d+)<\/td>\s*<td>(\d+)<\/td>/g;

            regexMatch(re, body, function (m) {
                proxy.push(m[1] + ":" + m[2]);
            });

            finish(callback, url);
        });
}

function getproxy_ip(callback, args) {
    var url = "http://www.getproxy.jp/china" + args;
    request(getOptions(url)
        , function (err, res, body) {
            var re = /(\d+\.\d+.\d+.\d+\:\d+)/g;

            regexMatch(re, body, function (m) {
                proxy.push(m[1])
            });

            finish(callback, url);
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
    request(getOptions(url)
        , function (err, res, body) {
            var re = /<td>(\d+\.\d+\.\d+\.\d+)<\/td>\s*<td>(\d+)<\/td>/gm;
            regexMatch(re, body, function (m) {
                proxy.push(m[1] + ":" + m[2])
            });

            finish(callback, url);
        });
}

function pachong_org(callback) {
    var url = "http://pachong.org/area/short/name/cn/type/high.html";
    request(getOptions(url)
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

            finish(callback, url);
        });
}

function gatherproxy(callback, args) {
    var url = "http://www.gatherproxy.com/proxylist/country/";
    var options = getOptions(url);
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

        finish(callback, url + " " + args);
    })
}

var q = async.queue(function (task, callback) {
    task.f(callback, task.args);
}, 30);

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
    if (argv["file"]) {
        fs.writeFileSync(argv["file"], JSON.stringify(proxy, null, 2))
    } else {
        _.each(proxy, function (p) {
            console.log(p);
        });
    }
};