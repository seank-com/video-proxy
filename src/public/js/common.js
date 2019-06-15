function getOptions(initiator, stream) {
  var options = {
    initiator: false,
    config: { 
      iceServers: [
        // google's default STUN server is filtered in China
        // we are explicitly not providing TURN servers
        { urls: [ 'stun:numb.viagenie.ca' ] }
      ]
    },
    trickle: true 
  };

  if (initiator) {
    options.initiator = true;
  }

  if (stream) {
    options.stream = stream;
  }

  return options;
}

function log() {
  var val = document.querySelector('#outgoing').textContent;

  val = val + '\r\n' + 
    Array.prototype.slice.call(arguments).map((item) => {
      if (typeof item !== 'string') {
        item = JSON.stringify(item);
      }
      return item;
    }).join(' ');;

  document.querySelector('#outgoing').textContent = val;
}
  
function rtcBegin(name, channel, options, onStream) {
  var title = name.toUpperCase();
  var path = name.toLowerCase();
  var socket = `ws://${location.host}/api/signal/${path}?channel=${channel}`;

  var ws = new WebSocket(socket);
  ws.on = ws.addEventListener;
  var peer = null;

  function closeConnections() {
    if (ws) {
      log(`TERMINATING ${title} WS:`);
      ws.close();
      ws = null;
    }
    if (peer) {
      log(`TERMINATING ${title}:`);
      peer.destroy();
      peer = null;
    }
  };

  ws.on('error', (event) => {
    log(`${title} WS ERROR:`, event);
  });

  ws.on('message', (event) => {
    log(`${title} WS MESSAGE:`, event.data);

    peer.signal(JSON.parse(event.data));
  });

  ws.on('open', () => {
    log(`${title} WS OPEN:`);

    peer = new SimplePeer(options);

    peer.on('error', (err) => {
      log(`${title} ERROR:`, err);
    });
  
    peer.on('signal', (data) => {
      log(`${title} SIGNAL:`, data);
      ws.send(JSON.stringify(data));
    });
  
    peer.on('connect', () => {
      log(`${title} CONNECT:`);
    });
   
    peer.on('close', () => {
      log(`${title} CLOSE:`);
      peer = null;
      closeConnections();
    });
  
    peer.on('data', (data) => {
      log(`${title} DATA:` + JSON.stringify(data));
    });
  
    peer.on('stream', (onStream) ? onStream : (stream) => {
      log(`${title} STREAM:`);
    });
  
    peer.on('track', (track) => {
      log(`${title} TRACK:`);
    });
  });
  
  ws.on('close', (code, message) => {
    log(`${title} WS CLOSE:`, code, message);
    ws = null;
    closeConnections();
  });

}