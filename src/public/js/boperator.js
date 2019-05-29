
document.querySelector('#connect').addEventListener('click', (ev) => {
  var channel = document.querySelector('#incoming').value;
  var video = document.querySelector('video');

  rtcBegin('operator', channel, getOptions(true), (stream) => {
    log('OPERATOR STREAM:');
    video.srcObject = stream;
    video.play();    
  })  
});
