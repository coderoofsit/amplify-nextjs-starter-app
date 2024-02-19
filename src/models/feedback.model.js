const mongoose = require('mongoose')

const feedbackSchema = mongoose.Schema({
    feedback: {
        type: String,
        required: true,
    },
    user: {
        type: mongoose.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
})

const Feedback = mongoose.model('feedback', feedbackSchema)
module.exports = Feedback