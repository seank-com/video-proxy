var options = null;

navigator.getUserMedia({ video: true, audio: false }, (stream) => {
  var video = document.querySelector('video');

  options = getOptions(true, stream);
  video.srcObject = stream;
  video.play();
}, (err) => {
  log('getUserMedia failed', err)
});

document.querySelector('#connect').addEventListener('click', (ev) => {
  var channel = document.querySelector('#incoming').value;

  rtcBegin('pilot', channel, options);
});