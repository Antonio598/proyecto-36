import http from 'http';

const req = http.request('http://localhost:3000/api/superadmin/accounts', {
  method: 'GET',
  headers: {
    'x-superadmin-id': 'test'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(res.statusCode, data));
});
req.end();
