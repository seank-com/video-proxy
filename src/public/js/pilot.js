var options = null,
  channel = '';

function CreateChannel() {
  var xhr = new XMLHttpRequest();

  xhr.open('GET', '/api/channel');
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onload = () => {
    if (xhr.status === 200) {
      var res = JSON.parse(xhr.responseText);
      channel = res.channel;
      log("Created Channel " + channel);
      rtcBegin('pilot', channel, options);
    } else {
      log("AJAX FAILED: " + xhr.status);
    }
  };
  xhr.send();
}  

navigator.getUserMedia({ video: true, audio: false }, (stream) => {
  var video = document.querySelector('video');

  options = getOptions(true, stream);
  video.srcObject = stream;
  video.play();
  CreateChannel();
}, (err) => {
  log('getUserMedia failed', err)
});


