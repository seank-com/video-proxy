var express = require('express');
var crypto = require('crypto');
var Peer = require('simple-peer');
var wrtc = require('wrtc');
var url = require('url');
var WebSocket = require('ws');
var canvas = require('canvas');

var router = express.Router();
var channels = {};

function getOptions(initiator, stream) {
  var options = {
    initiator: false,
    config: { 
      iceServers: [
        // google's default STUN server is filtered in China
        // we are explicitly not providing TURN servers
        { urls: [ 'stun:numb.viagenie.ca' ] }
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

  if (initiator) {
    options.initiator = true;
  }

  if (stream) {
    options.stream = stream;
  }

  return options;
};

function config(conn, data, options) {
  conn = conn.toLowerCase();
  var title = conn.toUpperCase();
  
  data[conn].wss = new WebSocket.Server({ noServer: true });
  data[conn].rtc = new Peer(options);  
  
  function closeAll() {
    data[conn].wss.clients.forEach((client) => {
      client.terminate();
    });
  }

  function send(msg) {
    data[conn].wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
  }

  data[conn].wss.on('connection', function connection(ws) {
    ws.isAlive = true;

    ws.on('pong', () => {
      console.log(`${title} PONG:`);
      ws.isAlive = true;
    });

    ws.on('message', (msg) => {
      // Broadcast to everyone else.
      console.log(`${title} MESSAGE: `, msg);
      data[conn].rtc.signal(msg);
    });

    ws.on('close', () => {
      console.log(`${title} CLOSE:`);
      closeAll();
    });

    data[conn].rtc.on('error', (err) => {
      console.log(`${title} ERROR:`, err);
    });
  
    data[conn].rtc.on('signal', (data) => {
      console.log(`${title} SIGNAL:`, data);
      send(JSON.stringify(data));
    });
  
    data[conn].rtc.on('connect', () => {
      console.log(`${title} CONNECT:`);
    });
  
    data[conn].rtc.on('close', () => {
      console.log(`${title} CLOSE:`);
      closeAll();
    })
  
    data[conn].rtc.on('data', (data) => {
      console.log(`${title} DATA:`, data);
    });
  });

// This code might be needed to cleanup bad connections
// and keep the server running longer. Commenting until 
// I can prove it adds value.
//
//  const interval = setInterval(() => {
//    console.log(`${title} INTERVAL:`);    
//    wss.clients.forEach((client) => {
//      if (client.isAlive === false) {
//        console.log(`${title} TERMINATING ALL SOCKETS`);
//        closeAll();
//      } else {
//        console.log(`${title} PING`);
//        client.isAlive = false;
//        client.ping(()=>{});
//      }
//    });
//  },5000);

  data[conn].wss.on('error', (event) => {
    console.log(`${title} WSS ERROR:`, event);
  });
}

function createChannel(channel) {
  console.log(`CREATE CHANNEL: ${channel}`);

  var data = {
    pilot:{}, 
    operator:{}
  };

  if (channels[channel]) {
    data = channels[channel];
  } else {
    channels[channel] = data;
  }

  if (data.pilot.rtc) {
    data.pilot.rtc.close();
    data.pilot.rtc = null;  
  }

  if (data.operator.rtc) {
    data.operator.rtc.close();
    data.operator.rtc = null;
  }
  if (data.pilot.wss) {
    data.pilot.wss.terminate();
    data.pilot.wss = null;
  }

  if (data.operator.wss) {
    data.operator.wss.terminate();
    data.operator.wss = null;
  }

  var videoSource = new wrtc.nonstandard.RTCVideoSource();
  var videoTrack = videoSource.createTrack();
  var mediaStream = new wrtc.MediaStream();
  mediaStream.addTrack(videoTrack);

  config('pilot', data, getOptions());
  config('operator', data, getOptions(false, mediaStream));

  var width = 0;
  var height = 0;
  var videoSink = null;
  var srcCanvas = null;
  var srcContext = null;
  var dstCanvas = null;
  var dstContext = null;
  
  data.pilot.rtc.on('track', (track) => {
    if (track.kind === 'video' && !videoSink) {
      videoSink = new wrtc.nonstandard.RTCVideoSink(track);

      videoSink.onframe = ({frame}) => {
        if (!height && !width) {
          console.log('INIT FRAME:');

          width = frame.width;
          height = frame.height;
          srcCanvas = canvas.createCanvas(width, height);
          srcContext = srcCanvas.getContext('2d', { pixelFormat: 'RGBA24' });
          dstCanvas = canvas.createCanvas(width, height);
          dstContext = dstCanvas.getContext('2d', { pixelFormat: 'RGBA24' });
          dstContext.textAlign = 'center';
          dstContext.textBaseline = 'middle';
          dstContext.font = '50px serif';
          dstContext.fillStyle = "#00ff00";     
        }

        var rgba = new Uint8ClampedArray(width * height * 4);
        var rgbaFrame = canvas.createImageData(rgba, width, height);
        wrtc.nonstandard.i420ToRgba(frame, rgbaFrame);

        srcContext.putImageData(rgbaFrame, 0, 0);

        dstContext.drawImage(srcCanvas, 0, 0);
        dstContext.fillText('TEST!!!', width/2, height/2, width);

        rgbaFrame = dstContext.getImageData(0, 0, width, height);  
        var i420Frame = {
          width: width,
          height: height,
          data: new Uint8ClampedArray(1.5 * width * height)
        };

        wrtc.nonstandard.rgbaToI420(rgbaFrame, i420Frame);
        videoSource.onFrame(i420Frame);
      }
    }
  });  
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
        ch.pilot.wss.handleUpgrade(request, socket, head, (ws) => {
          ch.pilot.wss.emit('connection', ws, request);
        });
      } else if (wsUrl.pathname === '/api/signal/operator') { 
        ch.operator.wss.handleUpgrade(request, socket, head, (ws) => {
          ch.operator.wss.emit('connection', ws, request);
        });
      } else {
        socket.destroy();
      }
    }
  });  
};

module.exports = router;
