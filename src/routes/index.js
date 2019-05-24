var express = require('express');

var router = express.Router();

var options = {
  root: __dirname + '/../public/html/',
  dotfiles: 'deny',
  headers: {
      'x-timestamp': Date.now(),
      'x-sent': true
  }
};

function getPage(name) {
  return (req, res, next) => {
    res.sendFile(name, options, (err) => {
      if (err) {
        next(err);
      } else {
        console.log('Sent: ', name);
      }  
    });  
  }
}

router.get('/', getPage('index.html'));
router.get('/pilot', getPage('pilot.html'));
router.get('/operator', getPage('operator.html'));
router.get('/bpilot', getPage('bpilot.html'));
router.get('/bcloud', getPage('bcloud.html'));
router.get('/boperator', getPage('boperator.html'));

router.get('/ping', function(req, res){
  res.status(200).send("pong!");
});

module.exports = router;
