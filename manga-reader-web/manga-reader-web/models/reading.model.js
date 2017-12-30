var mongoose = require('mongoose');

var readingSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    manganame: {
        type: String,
        required: true
    },
    currentPage: {
        type: Number,
    },
    currentChapter: {
        type: Number,
    },
    currentVolume: {
        type: Number,
    }
});

readingSchema.methods.find = function (username, manganame) {
    return this.model('Reading').disctinct(
        {
            username: username,
            manganame: manganame
        }
    );
}


mongoose.model('Reading', readingSchema);