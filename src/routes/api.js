var express = require('express');

var router = express.Router();

router.get('/items', function(req, res) {
  var result = [], i, ones, tens, hundreds, thousands;

  for (i = 1; i < 10001; i += 1) {
    ones = i % 10;
    tens = Math.floor((i % 100) / 10);
    hundreds = Math.floor((i % 1000) / 100);
    thousands = Math.floor((i % 10000) / 1000);

    result.push({
      title: " Sample Item " + i,
      tags: [
        ["tag-0", "tag-I", "tag-II", "tag-III", "tag-IV", "tag-V", "tag-VI", "tag-VII", "tag-VIII", "tag-IX"][ones],
        ["tag-00", "tag-X", "tag-XX", "tag-XXX", "tag-XL", "tag-L", "tag-LX", "tag-LXX", "tag-LXXX", "tag-XC"][tens],
        ["tag-000", "tag-C", "tag-CC", "tag-CCC", "tag-CD", "tag-D", "tag-DC", "tag-DCC", "tag-DCCC", "tag-CM"][hundreds],
        ["tag-0000", "tag-M", "tag-MM", "tag-MMM", "tag-MV-", "tag-V-", "tag-V-M", "tag-V-MM","tag-V-MM","tag-MX-"][thousands]
      ]
    });
  }

  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(result, null, 2));
});

module.exports = router;
