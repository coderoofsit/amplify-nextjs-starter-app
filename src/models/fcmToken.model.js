const mongoose = require('mongoose')

const FcmTokenSchema = mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "user",
        required: true,
    },
    token: {
        type: String,
        required: true,
    },
}, {
    timestamps: true
})

const FCM = mongoose.model('fcm', FcmTokenSchema)
module.exports = FCM