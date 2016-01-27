匿名代理采集
==================
该脚本能够帮你从多个站点采集到高匿名的代理列表，并进行验证。

用法，可选择NodeJS或者Docker

NodeJS
======
```
npm install
node app.js
```

Docker
======
```
docker pull derekhe/anonymous-proxy
docker run -p 9090:9090 derekhe/anonymous-proxy
```

API
===

* 得到代理列表
  GET http://localhost:9090/proxy

* 得到验证过的代理列表
  GET http://localhost:9090/proxy/valid

* 刷新列表
  POST http://localhost:9090/refresh