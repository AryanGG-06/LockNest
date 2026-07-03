const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    fullName: {
        type : String ,
        required : true
    },

    email: {
        type : String ,
        required : true,
        unique : true
    },

    password: { 
        type : String ,
        required : true
    },
    
    masterKey: { type: String },

    savedPass: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'data'
    }],
})

module.exports = mongoose.model('user', userSchema)