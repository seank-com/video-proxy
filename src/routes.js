var createError = require('http-errors');

var indexRoutes = require('./routes/index');
var apiRoutes = require('./routes/api');

function init(app) {
  // Setup Routes
  app.use('/', indexRoutes);
  app.use('/api', apiRoutes);
  
  // catch 404 and forward to error handler
  app.use((req, res, next) => {
    console.log('creating 404');
    next(createError(404));
  });

  // error handler
  app.use((err, req, res, next) => {
    if (err) {
      console.log('error ', err);
    }

    console.log(req);
    
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = err;

    // render the error page
    var status = err.status || 500;
    res.status(status);
    console.log('rendering error page for ' + status);
    if (req.app.get('env') === 'development') {
      res.send('error' + err.message + JSON.stringify(err));
    } else {
      res.send('Internal Server Error')
    }
  });
}

module.exports.init = init;