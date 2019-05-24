
var opt = {
    initiator: true,
    config: { 
      iceServers: [
        // google's default STUN server is filtered in China
        { urls: [ 'stun:numb.viagenie.ca' ] }
      ]
    },
    trickle: true 
  }, peer = null;

navigator.getUserMedia({ video: true, audio: false }, (stm) => {
  var video = document.querySelector('video');

  opt.stream = stm;
  peer = new SimplePeer(opt);

  peer.on('error', (err) => {
    console.log('ERROR: ', err);
  });
  
  peer.on('signal', (data) => {

    console.log('SIGNAL', JSON.stringify(data));
    if (data.type && data.type === 'offer') {
      var xhr = new XMLHttpRequest();

      xhr.open('POST', 'api/pilot');
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.onload = () => {
        var result = "";

        if (xhr.status === 200) {
          var response = JSON.parse(xhr.responseText);
          if (response.answer) {
            result = "created channel " + response.channel;
            peer.signal(response.answer);
          } else {
            result = "ERROR: expected answer";
          }
        } else {
          result = "AJAX FAILED: " + xhr.status;
        }
        document.querySelector('#outgoing').textContent = result;
      };
      xhr.send(JSON.stringify(data));
    }
  });
  
  peer.on('connect', () => {
    console.log('CONNECT: sending data')
    peer.send('whatever' + Math.random())
  });
  
  peer.on('data', (data) => {
    console.log('DATA: ', data)
  });

  video.srcObject = stm;
  video.play();
}, (err) => {
  console.log('getUserMedia failed', err)
});

