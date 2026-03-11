const http = require('http');
// Need a token to fetch students. I will fetch from API that doesn't need token, or just get health.
const req = http.request({
  host: 'localhost',
  port: 5001,
  path: '/api/courses',
  method: 'GET'
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('Courses:', res.statusCode, body));
});
req.end();
