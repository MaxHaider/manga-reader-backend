var mongoose = require('mongoose');

var mangaSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    numVolumes: {
        type: Number,
        required: true
    },
    specialString: {
        type: String,
        required: true
    }
});

mangaSchema.methods.find = function(name){
    return this.model('Manga').findOne({ name: name });
}


mongoose.model('Manga', mangaSchema);