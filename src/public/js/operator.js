
var opt = {
    initiator: true,
    config: { 
      iceServers: [
        // google's default STUN server is filtered in China
        { urls: [ 'stun:numb.viagenie.ca' ] }
      ]
    },
    trickle: true 
  },
  peer = new SimplePeer(opt),
  channel = '',
  offer = null;

peer.on('error', (err) => {
  console.log('ERROR: ', err);
});

peer.on('signal', (data) => {
  console.log('SIGNAL', JSON.stringify(data));
  if (data.type && data.type === 'offer') {
    offer = data;
    document.querySelector('#outgoing').textContent = "connection ready";
  }
});

peer.on('connect', () => {
  console.log('CONNECT: sending data')
  peer.send('whatever' + Math.random())
});

peer.on('data', (data) => {
  console.log('DATA: ', data)
});

peer.on('stream', (stream) => {
  var video = document.querySelector('video')
  video.srcObject = stream;
  video.play();
});
  
document.querySelector('form').addEventListener('submit', (ev) => {
  ev.preventDefault();

  channel = document.querySelector('#incoming').value;

  var xhr = new XMLHttpRequest();

  xhr.open('POST', 'api/operator');
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onload = () => {
    var result = "";

    if (xhr.status === 200) {
      var response = JSON.parse(xhr.responseText);
      if (response.answer) {
        result = "connecting to channel " + channel;
        peer.signal(response.answer);
      } else {
        result = "ERROR: expected answer";
      }
    } else {
      result = "AJAX FAILED: " + xhr.status;
    }
    document.querySelector('#outgoing').textContent = result;
  };
  xhr.send(JSON.stringify({channel: channel, offer: offer}));
});