
var getOpt = () => { 
    return {
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
  },
  log = (msg) => {
    var val = document.querySelector('#outgoing').textContent;
    val = val + '\r\n' + msg;
    document.querySelector('#outgoing').textContent = val;
  },  
  pilot = null,
  operator = null;

document.querySelector('#pilot').addEventListener('click', (ev) => {
  var xhr = new XMLHttpRequest();
  pilot = new SimplePeer(getOpt());

  pilot.on('error', (err) => {
    log('PILOT ERROR: ' + JSON.stringify(err));
  });
  
  pilot.on('signal', (data) => {
    log('PILOT SIGNAL: ' + JSON.stringify(data));
    if (data.type && data.type === 'answer') {
      var xhr = new XMLHttpRequest();
  
      xhr.open('POST', 'api/signal/pilotAnswer');
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.onload = () => {
        if (xhr.status === 200) {
          log("Sent Pilot Answer");
          document.querySelector('#pilot').disabled = true;
          document.querySelector('#operator').disabled = false;            
        } else {
          log("AJAX FAILED: " + xhr.status);
        }
      };
      xhr.send(JSON.stringify(data));
    }
  });
  
  pilot.on('connect', () => {
    log('PILOT CONNECT:');
  });
  
  pilot.on('data', (data) => {
    log('PILOT DATA: ' + JSON.stringify(data));
  });
  
  pilot.on('stream', (stream) => {
    log('PILOT STREAM:');
    var video = document.querySelector('video'),
      ctx = document.querySelector('canvas').getContext( '2d' ),
      drawToCanvas = () => {
        ctx.drawImage(video, 0, 0, 320, 240);
        ctx.fillText('TEST!!!', 160, 120, 320);
        // requestAnimationFrame ensures drawCanvas is 
        // called each time the browser window updates
        requestAnimationFrame( drawToCanvas );
      };

    video.srcObject = stream;
    video.play();

    // drawing settings that only need to be set once
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '50px serif';
    ctx.fillStyle = "#00ff00"; 
    drawToCanvas();
  });
  
  xhr.open('GET', 'api/signal');
  xhr.onload = () => {
    if (xhr.status === 200) {
      var response = JSON.parse(xhr.responseText);
      if (response.pilotOffer) {
        log("Creating Pilot Answer");
        pilot.signal(response.pilotOffer);
      } else {
        log("ERROR: expected offer");
      }
    } else {
      log("AJAX FAILED: " + xhr.status);
    }
  };
  xhr.send();
});

document.querySelector('#operator').addEventListener('click', (ev) => {
  var xhr = new XMLHttpRequest();
  var opt = getOpt();

  var canvas = document.querySelector('canvas');

  opt.stream = canvas.captureStream();
  operator = new SimplePeer(opt);

  operator.on('error', (err) => {
    log('OPERATOR ERROR: ' + JSON.stringify(err));
  });

  operator.on('signal', (data) => {
    log('OPERATOR SIGNAL: ' + JSON.stringify(data));
    if (data.type && data.type === 'answer') {
      var xhr = new XMLHttpRequest();
  
      xhr.open('POST', 'api/signal/operatorAnswer');
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.onload = () => {
        if (xhr.status === 200) {
          log("Sent Operator Answer");
          //document.querySelector('#operator').disabled = true;
        } else {
          log("AJAX FAILED: " + xhr.status);
        }
      };
      xhr.send(JSON.stringify(data));
    }
  });
   
  operator.on('connect', () => {
    log('OPERATOR CONNECT:');
//    operator.addStream(video);
  });

  operator.on('data', (data) => {
    log('OPERATOR DATA: ' + JSON.stringify(data));
  });

  operator.on('stream', (stream) => {
    log('OPERATOR STREAM:');
  });

  xhr.open('GET', 'api/signal');
  xhr.onload = () => {
    if (xhr.status === 200) {
      var response = JSON.parse(xhr.responseText);
      if (response.operatorOffer) {
        log("Creating Operator Answer");
        operator.signal(response.operatorOffer);
      } else {
        log("ERROR: expected offer");
      }
    } else {
      log("AJAX FAILED: " + xhr.status);
    }
  };
  xhr.send();
});
  
document.querySelector('#pilot').disabled = false;
document.querySelector('#operator').disabled = true;            
