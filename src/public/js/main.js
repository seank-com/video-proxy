
var p, 
  createPeer = (stm) => {
    var peer, opt = {
      initiator: !!stm, //
      config: { 
        iceServers: [
          // google's default STUN server is filtered in China
          { urls: 'stun:numb.viagenie.ca' }
        ]
      },
      trickle: true 
    };
    if (stm) {
      opt.stream = stm;
    }
    peer = new SimplePeer(opt);
    peer.on('error', (err) => {
      console.log('error', err);
    });
    peer.on('signal', (data) => {
      console.log('SIGNAL', JSON.stringify(data));
      if (data.type) {
        document.querySelector('#outgoing').textContent = JSON.stringify(data);
      }
    });
    peer.on('connect', () => {
      console.log('CONNECT')
      peer.send('whatever' + Math.random())
    });
    peer.on('data', data => {
      console.log('data: ' + data)
    });
    return peer;
  };

if (location.hash === '#pilot') {
  //document.querySelector('form').style.visibility = 'hidden';
  //document.querySelector('video').style.visibility = 'hidden';
  // If I am the pilot then get the camera
  navigator.getUserMedia({ video: true, audio: false }, (stm) => {
    p = createPeer(stm);
    document.querySelector('form').addEventListener('submit', ev => {
      ev.preventDefault();
      p.signal(JSON.parse(document.querySelector('#incoming').value));
    });  
  }, (err) => {
    console.log('getUserMedia', err)
  })
} else {
  p = createPeer();
  // If we are the operator handle the submit and prepare for video
  document.querySelector('form').addEventListener('submit', ev => {
    ev.preventDefault();
    p.signal(JSON.parse(document.querySelector('#incoming').value));
  });
  p.on('stream', (stm) => {
    var video = document.querySelector('video')
    video.srcObject = stm;
    video.play();
  })
}

