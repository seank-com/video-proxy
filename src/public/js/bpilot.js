
var opt = {
    initiator: true,
    config: { 
      iceServers: [
        // google's default STUN server is filtered in China
        // we are explicitly not providing TURN servers
        { urls: [ 'stun:numb.viagenie.ca' ] }
      ]
    },
    trickle: true 
  },
  log = (msg) => {
    var val = document.querySelector('#outgoing').textContent;
    val = val + '\r\n' + msg;
    document.querySelector('#outgoing').textContent = val;
  },
  peer = null;
  
navigator.getUserMedia({ video: true, audio: false }, (stream) => {
  var video = document.querySelector('video');

  opt.stream = stream;
  peer = new SimplePeer(opt);

  peer.on('error', (err) => {
    log('ERROR: ' + JSON.stringify(err));
  });

  peer.on('signal', (data) => {
    log('SIGNAL: ' + JSON.stringify(data));
    if (data.type && data.type === 'offer') {
      var xhr = new XMLHttpRequest();

      xhr.open('POST', 'api/signal/pilotOffer');
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.onload = () => {
        var result = "";
    
        if (xhr.status === 200) {
          result = "Sent Pilot Offer";
        } else {
          result = "AJAX FAILED: " + xhr.status;
        }
        log(result);
        document.querySelector('#answer').disabled = false;
      };
      xhr.send(JSON.stringify(data));
    }
  });

  peer.on('connect', () => {
    log('CONNECT:')
  });

  peer.on('data', (data) => {
    log('DATA: ' + JSON.stringify(data));
  });

  peer.on('stream', (stream) => {
    log('STREAM: ');
  });
  
  video.srcObject = stream;
  video.play();
}, (err) => {
  log('getUserMedia failed', err)
});
  
document.querySelector('#answer').addEventListener('click', (ev) => {
  var xhr = new XMLHttpRequest();

  xhr.open('GET', 'api/signal');
  xhr.onload = () => {
    if (xhr.status === 200) {
      var response = JSON.parse(xhr.responseText);
      if (response.pilotAnswer) {
        log("Got Pilot Answer");
        peer.signal(response.pilotAnswer);  
        document.querySelector('#answer').disabled = true;
      } else {
        log("Signal did not contain pilotAnswer");
      }
    } else {
      log("AJAX FAILED: " + xhr.status);
    }
  };
  xhr.send();        
});

document.querySelector('#answer').disabled = true;