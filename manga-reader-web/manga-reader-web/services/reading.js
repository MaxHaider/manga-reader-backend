var fs = require("fs");
var config = require("../config/config");
var mongo = require('mongodb').MongoClient;
var assert = require('assert');
var mongoose = require('mongoose');
var Manga = mongoose.model('Manga');
var User = mongoose.model('User');
var Reading = mongoose.model('Reading');
var async = require('async');

function connectToDb() {
    mongoose.connect(config.BASE_DB_URI, {
        useMongoClient: true
    });
}

function disconnectFromDb() {
    mongoose.connection.close();
}

exports.getSpecificPage = function (req, res) {
    connectToDb();
    async.waterfall([
        async.apply(findReading, req, res),
        getManga,
        async.apply(calcSpecificPage, req.body.path),
        updateReading,
        sendResponse
    ]);
};

exports.getCurrentPage = function (req, res) {
    connectToDb();
    async.waterfall([
        async.apply(findReading, req, res),
        getManga,
        calcCurrPage,
        sendResponse
    ]);
};


exports.getNextPage = function (req, res) {
    connectToDb();
    async.waterfall([
        async.apply(findReading,req,res),
        getManga,
        calcNextPage,
        updateReading,
        sendResponse
    ]);
};

exports.getPreviousPage = function (req, res) {
    connectToDb();
    async.waterfall([
        async.apply(findReading, req, res),
        getManga,
        calcPrevPage,
        updateReading,
        sendResponse
    ]);
};

function findReading(req,res,callback) {
    var username = req.body.username.username;
    var manganame = req.body.manganame;
    Reading.find({ username: username, manganame: manganame }, function (err, reading) {
        var status = 400;
        if (!err) {
            if (reading.length > 0 && reading != null) {
                status = 200;
                callback(null, reading[0], manganame, username, res);
            } else {
                addReading(username, manganame, req, res, callback);
            }

        } else {
            console.log(err);
        }

    });
}

function getManga(reading, manganame,username,res, callback) {
    Manga.find({ name: manganame }, function (err, manga) {
        if (!err && manga.length != 0) {
            callback(null,reading,manga[0],username,res);
        }
    });
}

function calcSpecificPage(path, reading, manga, username, res, callback) {
    console.log(path);
    var volume = Number(path.split('\\')[2]);
    var chapter = Number(path.split('\\')[3].substring(8));
    var page = Number(path.split('\\')[4].split('_')[3].substring(0,3));

    reading.username = username;
    reading.manganame = manga.name;
    reading.currentPage = page;
    reading.currentChapter = chapter;
    reading.currentVolume = volume;

    retval = buildImagePathRelative(reading.currentPage, reading.currentChapter, reading.currentVolume, manga.name, manga.specialString);
    callback(null, reading, retval, res);
}

function calcCurrPage(reading, manga, username, res, callback) {
    retval = buildImagePathRelative(reading.currentPage, reading.currentChapter, reading.currentVolume, manga.name, manga.specialString);
    console.log(buildImagePathRelative(reading.currentPage, reading.currentChapter, reading.currentVolume, manga.name, manga.specialString));
    callback(null, 200, retval, res);
}

function calcNextPage(reading, manga,username,res, callback) {
    var specialString = manga.specialString;
    var manganame = manga.name;
    var currpage = reading.currentPage;
    var currchapter = reading.currentChapter;
    var currvolume = reading.currentVolume;

    currpage++;
    var pagefound = false;
    var endOfManga = false;
    if (checkIfPageExisits(currpage, currchapter, currvolume, manganame, specialString)) {
        pagefound = true;
    } else {
        currchapter++;
        if (checkIfPageExisits(currpage, currchapter, currvolume, manganame, specialString)) {
            pagefound = true;
        } else {
            currvolume++;
            currpage = 1;
            if (checkIfPageExisits(currpage, currchapter, currvolume, manganame, specialString)) {
                pagefound = true;
            } else {
                pagefound = false;
                endOfManga = true;
            }
        }
    }
    

    var retval = null;
    if (!pagefound && endOfManga) {
        currpage = 1;
        currchapter = 1;
        currvolume = 1;
        retval = buildImagePathRelative(currpage, currchapter, currvolume, manganame, specialString);
    } else if (pagefound) {
        retval = buildImagePathRelative(currpage, currchapter, currvolume, manganame, specialString);
    }

    reading.username = username;
    reading.manganame = manganame;
    reading.currentPage = currpage;
    reading.currentChapter = currchapter;
    reading.currentVolume = currvolume;

    callback(null, reading, retval, res);

}

function calcPrevPage(reading, manga, username, res, callback) {
    var specialString = manga.specialString;
    var manganame = manga.name;
    var currpage = reading.currentPage;
    var currchapter = reading.currentChapter;
    var currvolume = reading.currentVolume;

    currpage--;
    var pagefound = false;
    var endOfManga = false;
    if (checkIfPageExisits(currpage, currchapter, currvolume, manganame, specialString)) {
        pagefound = true;
    } else {
        currchapter--;
        if (checkIfPageExisits(currpage, currchapter, currvolume, manganame, specialString)) {
            pagefound = true;
        } else {
            currvolume = 1;
            currpage = 1;
            if (checkIfPageExisits(currpage, currchapter, currvolume, manganame, specialString)) {
                pagefound = true;
            } else {
                pagefound = false;
                endOfManga = true;
            }
        }
    }


    var retval = null;
    if (!pagefound && endOfManga) {
        currpage = 1;
        currchapter = 1;
        currvolume = 1;
        retval = buildImagePathRelative(currpage, currchapter, currvolume, manganame, specialString);
    } else if (pagefound) {
        retval = buildImagePathRelative(currpage, currchapter, currvolume, manganame, specialString);
    }

    reading.username = username;
    reading.manganame = manganame;
    reading.currentPage = currpage;
    reading.currentChapter = currchapter;
    reading.currentVolume = currvolume;

    callback(null, reading, retval, res);

}

function updateReading(updatedReading, retval, res, callback) {
    Reading.findOneAndUpdate({ username: updatedReading.username, manganame: updatedReading.manganame }, updatedReading, { upsert: true }, function (err) {
        console.log(err);
        callback(null, 200, retval, res);
    });

}

function sendResponse(status, result, res, callback) {
    disconnectFromDb();
    res.status(status);
    res.json(result);
    callback(null);
}

function addReading(username, manganame, req, res, callback) {
    var reading = null;
    //if (checkIfMangaExists(manganame) && checkIfUserExists(username)) {
        reading = new Reading();
        reading.username = username;
        reading.manganame = manganame;
        reading.currentPage = 1;
        reading.currentChapter = 1;
        reading.currentVolume = 1;

    
        
        reading.save(function (err) {
            if (err) {
                console.log(err);
            }
            else {
                findReading(req, res, callback);
            }
        });
}

function checkIfMangaExists(name) {
    Manga.find({ name: name }, function (err, docs) {
        var success = false;
        if (!err) {
            if (docs.length != 0) {
                success = true
            }
        } else {
            success = false;

        }
        return success;
    });
}

function checkIfUserExists(name) {
    User.find({ username: name }, function (err, docs) {
        var success = false;
        if (!err) {
            if (docs.length != 0) {
                success = true
            }
        } else {
            success = false;

        }
        return success;
    });
}


function buildImagePath(page, chapter, volume, manganame, specialString) {
    if (volume < 10) {
        volume = "0" + volume;
    }
    if (page < 10) {
        page = "00" + page;
    } else if (page < 100) {
        page = "0" + page;
    }
    

    return config.FILEPATH + "\\mangas\\" + manganame + "\\" + volume + "\\Chapter " + chapter + "\\" + specialString + "_color_v" + volume + "_" + page + ".jpg";
}

function buildImagePathRelative(page, chapter, volume, manganame, specialString) {
    if (volume < 10) {
        volume = "0" + volume;
    }
    if (page < 10) {
        page = "00" + page;
    } else if (page < 100) {
        page = "0" + page;
    }
    

    return "mangas\\" + manganame + "\\" + volume + "\\Chapter " + chapter + "\\" + specialString + "_color_v" + volume + "_" + page + ".jpg";
}

function checkIfPageExisits(page, chapter, volume, manganame, specialString) {
    return fs.existsSync(buildImagePath(page, chapter, volume, manganame, specialString));
}

