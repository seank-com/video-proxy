var express = require('express');
var crypto = require('crypto');
var Peer = require('simple-peer');
var wrtc = require('wrtc');
var url = require('url');
var WebSocket = require('ws');

var router = express.Router();

var options = {
  initiator: false,
  config: { 
    iceServers: [
      // google's default STUN server is filtered in China
      //{ urls: [ 'stun:numb.viagenie.ca' ] }
      { urls: [ 'stun:10.1.8.175:3478' ] }
    ],
    portRange: {
      // needs to match the range exposed by the container
      min: 8200, 
      max: 8202
    }
  },
  trickle: true, 
  wrtc: wrtc
};

var channels = {};

function configWS(title, wss) {
  function closeAll() {
    wss.clients.forEach((client) => {
      client.terminate();
    });
  }

  wss.on('connection', function connection(ws) {
    ws.isAlive = true;

    ws.on('pong', () => {
      console.log(`${title} PONG:`);
      ws.isAlive = true;
    });

    ws.on('message', (data) => {
      // Broadcast to everyone else.
      console.log(`${title} MESSAGE: `, data);
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(data);
        }
      });
    });

    ws.on('close', () => {
      console.log(`${title} CLOSE:`);
      closeAll();
    });
  });

  const interval = setInterval(() => {
    console.log(`${title} INTERVAL:`);    
    wss.clients.forEach((client) => {
      if (client.isAlive === false) {
        console.log(`${title} TERMINATING ALL SOCKETS`);
        closeAll();
      } else {
        console.log(`${title} PING`);
        client.isAlive = false;
        client.ping(()=>{});
      }
    });
  },5000);
}

function createChannel(channel) {
  if (channels[channel]) {
    if (channels[channel].rtcPilot) {
      channels[channel].rtcPilot.close();
      channels[channel].rtcPilot = null;  
    }

    if (channels[channel].rtcOperator) {
      channels[channel].rtcOperator.close();
      channels[channel].rtcOperator = null;
    }
    if (channels[channel].wssPilot) {
      channels[channel].wssPilot.terminate();
      channels[channel].wssPilot = null;
    }

    if (channels[channel].wssOperator) {
      channels[channel].wssOperator.terminate();
      channels[channel].wssOperator = null;
    }
  } else {
    channels[channel] = {};
  }

  var wssPilot = new WebSocket.Server({ noServer: true });
  configWS('PILOT', wssPilot);
  channels[channel].wssPilot = wssPilot;

  var wssOperator = new WebSocket.Server({ noServer: true });
  configWS('OPERATOR', wssOperator);
  channels[channel].wssOperator = wssOperator;

  //var optPilot = Object.assign({}, options);
  //var rtcPilot = new Peer(optPilot);
  channels[channel].rtcPilot = null;

  // peer.on('error', (err) => {
  //   console.log("ERROR: pilot connection error on channel " + channel, err);
  // });

  // peer.on('signal', (data) => {
  //   if (data.type && data.type === 'answer') {
  //     res.setHeader('Content-Type', 'application/json');
  //     res.send(JSON.stringify({channel: channel, answer: data}, null, 2));
  //     console.log('SIGNAL: pilot connection on channel ' + channel, 'answer');
  //   } else {
  //     console.log('SIGNAL: pilot connection on channel ' + channel, data);
  //   }
  // });

  // peer.on('connect', () => {
  //   console.log("CONNECT: pilot connection on channel " + channel);
  // });

  // peer.on('data', (data) => {
  //   console.log("DATA: pilot connection received data on channel " + channel, data);
  // });

  // peer.on('stream', (stream) => {
  //   console.log("STREAM: pilot connection received stream on channel " + channel);
  //   connections[channel].stream = stream;
  // });

  // peer.signal(req.body);

  //var optOperator = Object.assign({}, options);
  //var rtcOperator = new Peer(optOperator);
  channels[channel].rtcOperator = null;
};

router.get('/channel', function(req, res, next) {
  var channel = crypto.randomBytes(5).toString('hex');

  createChannel(channel);

  res.json({channel: channel});
});

router.registerUpgrade = function(server) {
  server.on('upgrade', function upgrade(request, socket, head) {
    var wsUrl = url.parse(request.url, true);
    var ch = (wsUrl.query.channel) ? channels[wsUrl.query.channel] : null;

    if (ch) {
      if (wsUrl.pathname === '/api/signal/pilot') { 
        ch.wssPilot.handleUpgrade(request, socket, head, (ws) => {
          ch.wssPilot.emit('connection', ws, request);
        });
      } else if (wsUrl.pathname === '/api/signal/operator') { 
        ch.wssOperator.handleUpgrade(request, socket, head, (ws) => {
          ch.wssOperator.emit('connection', ws, request);
        });
      } else {
        socket.destroy();
      }
    }
  });  
};

module.exports = router;
