var fs = require("fs");
var config = require("../config/config");
var mongo = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var mongoose = require('mongoose');
var crypto = require('crypto');
var User = mongoose.model('User');
var passport = require('passport');


function connectToDb() {
    mongoose.Promise = global.Promise;
    mongoose.connect(config.BASE_DB_URI, {
        useMongoClient: true
    });
}

function disconnectFromDb() {
    mongoose.connection.close();
}


exports.register = function (req, res) {
    connectToDb();
    var user = new User();
    user.username = req.body.username;
    user.setPassword(req.body.password);
    user.save(function (err) {
        var token;
        token = user.generateJwt();
        res.status(200);
        res.json({
            "token": token
        });
        disconnectFromDb()
    })
};

exports.login = function (req, res) {
    connectToDb();
    passport.authenticate('local', function (err, user, info) {
        var token;
        var json;
        var status;

        if (err) {
            json = err;
            status = 401;
        }
        
        if (user) {
            token = user.generateJwt();
            json = {
                "token": token
            };
            status = 200;
        } else {
            json = info;
            status = 401;
        }

        res.status(status).json(json);
        disconnectFromDb();
    })(req, res);

};

