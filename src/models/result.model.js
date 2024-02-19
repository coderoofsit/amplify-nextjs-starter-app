

const mongoose = require('mongoose')

const resultSchema = mongoose.Schema({
    image: {
        type: String,
    },
    name: {
        type: String,
    },
    subject: {
        type: String,
    },
    score:{
        type: String,
    }
})

const result = mongoose.model('result', resultSchema)

module.exports = result