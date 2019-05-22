
/**
 * Module dependencies.
 */
var http = require('http');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');

var routes = require('./routes');

var app = express();

// setup favicon before logging so that 
// we don't fill our logs with useless data
app.use(favicon(path.join(__dirname, 'public/favicon.ico')));

// setup body-parser (now included in Express)
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// setup serve-static (now included in Express)
app.use(express.static(path.join(__dirname, 'public')));

routes.init(app);

// Normalize a port into a number, string, or false.
function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

// Event listener for HTTP server "error" event.
function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

// Event listener for HTTP server "listening" event.
function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  console.log('Listening on ' + bind);
}

// Get port from environment and store in Express.
var port = normalizePort(process.env.PORT || '4000');
app.set('port', port);

// Create HTTP server.
var server = http.createServer(app)
  .on('error', onError)
  .on('listening', onListening)
  .listen(port);

// docker send a SIGTERM for graceful shutdown, 
// lets atleast try to be a good citizen.
process.on('SIGTERM', () => {
  console.log('exiting process');
  process.exit(0);
});
