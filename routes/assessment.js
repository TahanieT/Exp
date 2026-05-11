var express = require('express');
var router  = express.Router();

router.get('/assessment', function(req, res) {
  res.render('assessment');
});

module.exports = router;
