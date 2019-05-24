
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
peer = new SimplePeer(opt),
fakeSignal = false;

peer.on('error', (err) => {
  log('ERROR: ' + JSON.stringify(err));
});

peer.on('signal', (data) => {
  log('SIGNAL: ' + JSON.stringify(data));
  if (data.type && data.type === 'offer') {
    var xhr = new XMLHttpRequest();

    xhr.open('POST', 'api/signal/operatorOffer');
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = () => {
      if (xhr.status === 200) {
        log("Sent Operator Offer");
      } else {
        log("AJAX FAILED: " + xhr.status);
      }
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
  var video = document.querySelector('video')
  video.srcObject = stream;
  video.play();
});

document.querySelector('#answer').addEventListener('click', (ev) => {
  var xhr = new XMLHttpRequest();

  xhr.open('GET', 'api/signal');
  xhr.onload = () => {
    if (xhr.status === 200) {
      var response = JSON.parse(xhr.responseText);
      if (response.operatorAnswer) {
        log("Got Operator Answer");
        peer.signal(response.operatorAnswer);  
        document.querySelector('#answer').disabled = true;
        if (!fakeSignal) {
          peer.signal(JSON.parse('{"transceiverRequest":{"kind":"video"}}'));
          fakeSignal = true;
          log("faking transceiverRequest signal");
        }
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