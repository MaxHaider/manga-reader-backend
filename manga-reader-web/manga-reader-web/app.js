'use strict';
var debug = require('debug');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
require('./models/user.model');
require('./models/manga.model');
require('./models/reading.model');
require('./config/passport');


var routes = require('./routes/index');
var users = require('./routes/users');


var app = express();
var cors = require('cors');


var userService = require('./services/user');
var mangaService = require('./services/manga');
var readingService = require('./services/reading');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(passport.initialize());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

app.use('/', routes);
app.use('/users', users);

//user
app.post('/api/login', userService.login);
app.post('/api/register', userService.register);

//manga
app.get('/api/manga/all', mangaService.getAll);
app.post('/api/manga/add', mangaService.add);
app.post('/api/manga/dir', mangaService.getDirectory);

//reading
app.post('/api/reading/current', readingService.getCurrentPage);
app.post('/api/reading/next', readingService.getNextPage);
app.post('/api/reading/previous', readingService.getPreviousPage);
app.post('/api/reading/specific', readingService.getSpecificPage);




// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

app.set('port', process.env.PORT || 3000);

var server = app.listen(app.get('port'), function () {
    debug('Express server listening on port ' + server.address().port);
});


