const mongoose = require('mongoose');

const DataSchema = mongoose.Schema({
    platform: {
        type : String ,
        required : true
    },

    password: {
        type : String ,
        required : true
    },
    
    iv: String

})

module.exports = mongoose.model('data', DataSchema)