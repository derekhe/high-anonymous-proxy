匿名代理采集
==================
用法

首先设置本地能够翻墙的socks5 proxy，代码中默认为localhost:7070，请根据自己的需要修改
如果你是能翻墙的http proxy，则请修改代码为

```
function getUrl(url) {
    return {
        url: url,
        proxy: "http://xxxxxx"
    }
}
```

然后
```
npm install
node fetch.js
node proxycheck.js
```