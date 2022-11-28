var proxy = require('express-http-proxy');
var app = require('express')();

server = process.argv[2]
port = process.argv[3]
 
app.use('/', proxy(`${server}:${port}`, {
    preserveHostHdr: true,
    limit: '100mb'
  }));
app.listen(port, () => console.log(`${server} proxy ${port}!`))