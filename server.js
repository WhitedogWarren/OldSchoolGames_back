const http = require('http');
const app = require('./app');
const server = http.createServer(app);
const jwt = require('jsonwebtoken');

const io = require('socket.io')(server);
const ioUtils = require('./socket.io/socketHandler');

const normalizePort = val => {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    return val;
  }
  if (port >= 0) {
    return port;
  }
  return false;
};
const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

const errorHandler = error => {
  if (error.syscall !== 'listen') {
    throw error;
  }
  const address = server.address();
  const bind = typeof address === 'string' ? 'pipe ' + address : 'port: ' + port;
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges.');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use.');
      process.exit(1);
      break;
    default:
      throw error;
  }
};

server.on('error', errorHandler);
server.on('listening', () => {
  const address = server.address();
  const bind = typeof address === 'string' ? 'pipe ' + address : 'port ' + port;
  console.log('Listening on ' + bind);
});

server.listen(port);

io.use((socket, next) => {
  //jwt authentication
  if(socket.handshake.query && socket.handshake.query.token) {
    //console.log('token : ', socket.handshake.query.token);
    jwt.verify(socket.handshake.query.token, process.env.TOKEN_SECRET, (err, decoded) => {
      if(err) {
        return next(new Error('Authentication failed'));
      }
      console.log('decoded : ', decoded);
      socket.decoded = decoded;
      next();
    });
  }
  else {
    next(new Error('Authentication error'));
  }
}) 
.on('connection', ioUtils.connectionHandler);