const http = require('http');

const req = http.request({
  host: 'localhost',
  port: 5001,
  path: '/api/admin/dashboard', // It needs a token, ok let's just test something public or login
  method: 'GET'
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log(res.statusCode, body));
});
req.end();
