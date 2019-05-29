var xhr = new XMLHttpRequest();

xhr.open('GET', '/api/channel');
xhr.setRequestHeader('Content-Type', 'application/json');
xhr.onload = () => {
  if (xhr.status === 200) {
    var res = JSON.parse(xhr.responseText);
    log("Created Channel " + res.channel);

    var video = document.querySelector('video');
    var canvas = document.querySelector('canvas');
    var ctx = canvas.getContext('2d');

    var drawToCanvas = () => {
      ctx.drawImage(video, 0, 0, 320, 240);
      ctx.fillText('TEST!!!', 160, 120, 320);
      // requestAnimationFrame ensures drawCanvas is 
      // called each time the browser window updates
      requestAnimationFrame(drawToCanvas);
    };

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '50px serif';
    ctx.fillStyle = "#00ff00"; 
    drawToCanvas();

    rtcBegin('pilot', res.channel, getOptions(false), (stream) => {
      log('PILOT STREAM:');
      video.srcObject = stream;
      video.play();    
    });

    rtcBegin('operator', res.channel, getOptions(false, canvas.captureStream()));
  } else {
    log("AJAX FAILED: " + xhr.status);
  }
};
xhr.send();




