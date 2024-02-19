const { Schema, model } = require("mongoose");

const adminSchema = new Schema({
    email: {
        type: String,
    },
    password: {
        type: String,
    },
    role: {
        type: String,
        default: 'admin'
    }
});

const adminModel=model("admin", adminSchema)
module.exports=adminModel;