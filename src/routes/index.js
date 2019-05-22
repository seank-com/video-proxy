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

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log('root route!', __dirname);
  res.sendFile('index.html', options, (err) => {
    if (err) {
      next(err);
    } else {
      console.log('Sent: ', 'index.html');
    }  
  });
});

router.get('/ping', function(req, res){
  res.status(200).send("pong!");
});

module.exports = router;
