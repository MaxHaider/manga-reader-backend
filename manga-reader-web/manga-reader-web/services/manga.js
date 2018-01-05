var fs = require("fs");
var config = require("../config/config");
var mongo = require('mongodb').MongoClient;
var assert = require('assert');
var mongoose = require('mongoose');
var Manga = mongoose.model('Manga');


function connectToDb() {
    mongoose.Promise = global.Promise;
    mongoose.connect(config.BASE_DB_URI, {
        useMongoClient: true
    });
}

function disconnectFromDb() {
    mongoose.connection.close();
}

exports.getDirectory = function (req, res) {
    var files = [];
    var dirdata = req.body;
    var dirpath = config.FILEPATH + "\\" + req.body.path;
    console.log(dirpath);
    fs.readdirSync(dirpath).forEach(file => {
        files.push(file)
    });
    res.send(files);
}

exports.getAll = function (req, res) {
    connectToDb();
    console.log("jerome");
    Manga.find({}, function (err, docs) {
        var json = "";
        var status = 400;
        if (!err) {
            json = docs;
            status = 200;
        } else {
            json = err;

        }
        res.status(status)
        res.json(json);
        disconnectFromDb();

    })
};

exports.add = function (req, res) {
    connectToDb();
    var manga = new Manga();
    manga.name = req.body.name;
    manga.numVolumes = req.body.numVolumes;
    manga.specialString = req.body.specialString;
    manga.save(function (err) {
        var status = 400;
        var result = "";
        if (!err) {
            status = 200;
        } else {
            result = err;
        }
        
        res.status(status);
        res.json(result);
        disconnectFromDb();
    })
}

