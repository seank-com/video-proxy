var express = require('express');
var crypto = require('crypto');
var Peer = require('simple-peer');
var wrtc = require('wrtc');

var router = express.Router();

var optPilot = {
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
      max: 8300
    }
  },
  trickle: true, 
  wrtc: wrtc
};

var optOperator = {
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
      max: 8300
    }
  },
  trickle: true, 
  wrtc: wrtc
};

var connections = {};

var signal = {};

function getStatus(signal) {
  var props = [];
  if (signal.pilotOffer) {
    props.push('po');
  }
  if (signal.pilotAnswer) {
    props.push('pa');
  }
  if (signal.operatorOffer) {
    props.push('oo');
  }
  if (signal.operatorAnswer) {
    props.push('oa');
  }

  return "(" + props.join() + ")";
}

router.post('/pilot', function(req, res, next) {
  if (req.body.type && req.body.type === 'offer') {
    var channel = crypto.randomBytes(5).toString('hex');
    var peer = new Peer(optPilot);
    
    connections[channel] = {};
    connections[channel].pilot = peer;

    peer.on('error', (err) => {
      console.log("ERROR: pilot connection error on channel " + channel, err);
    });

    peer.on('signal', (data) => {
      if (data.type && data.type === 'answer') {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({channel: channel, answer: data}, null, 2));
        console.log('SIGNAL: pilot connection on channel ' + channel, 'answer');
      } else {
        console.log('SIGNAL: pilot connection on channel ' + channel, data);
      }
    });

    peer.on('connect', () => {
      console.log("CONNECT: pilot connection on channel " + channel);
    });

    peer.on('data', (data) => {
      console.log("DATA: pilot connection received data on channel " + channel, data);
    });

    peer.on('stream', (stream) => {
      console.log("STREAM: pilot connection received stream on channel " + channel);
      connections[channel].stream = stream;
    });

    peer.signal(req.body);
  } else {
    next(new Error("expected WebRTC offer"));
  }
});

router.post('/operator', function(req, res, next) {
  if (req.body.channel && req.body.offer) {
    var channel = req.body.channel;
    if (connections[channel]) {

      optOperator.stream = connections[channel].stream
      var peer = new Peer(optOperator);
      connections[channel].operator = peer;

      peer.on('error', (err) => {
        console.log("ERROR: operator connection error on channel " + channel, err);
      });

      peer.on('signal', (data) => {
        if (data.type && data.type === 'answer') {
          res.setHeader('Content-Type', 'application/json');
          res.send(JSON.stringify({channel: channel, answer: data}, null, 2));
          console.log('SIGNAL: operator connection on channel ' + channel, 'answer'); 
        } else {
          console.log('SIGNAL: operator connection on channel ' + channel, data);
        }
      });
  
      peer.on('connect', () => {
        console.log("CONNECT: operator connection on channel " + channel);
      });

      peer.on('data', (data) => {
        console.log("DATA: operator connection received data on channel " + channel, data);
      });

      peer.on('stream', (stream) => {
        console.log("STREAM: operator connection received stream on channel " + channel);
      });
  
      peer.signal(req.body.offer);
    } else {
      next(new Error("channel not found"));
    }
  } else {
    next(new Error("expected WebRTC offer"));
  }
});

router.get('/signal', function(req, res, next) {
  console.log("SIGNAL requested " + getStatus(signal));
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(signal, null, 2));
});

router.post('/signal/:name', function(req, res, next) {
  signal[req.params.name] = req.body;
  console.log("SIGNAL posted " + getStatus(signal));
  res.send('OK');
});

module.exports = router;
