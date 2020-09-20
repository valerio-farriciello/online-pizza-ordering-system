//Author: Valerio Farriciello

const http = require('http');

const HOST_NAME = '127.0.0.1';
const PORT_NUM = process.env.PORT || 3000;

var server = http.createServer(function(req, res) {  
  require('./router').get(req, res);
});



server.listen(PORT_NUM, HOST_NAME, () =>
{
    console.log(`Server is running at ${HOST_NAME}:${PORT_NUM}`);
});
