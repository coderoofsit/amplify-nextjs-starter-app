const { Schema, model } = require("mongoose");

const teacherSchema = new Schema({
    email: {
        type: String,
    },
    name:{
    type:String,
    },
    mob:{
    type: Number,
    },
    profilePic:{
type:String,
default:"https://cdn.pixabay.com/photo/2012/04/13/21/07/user-33638_1280.png"
    },
    password: {
        type: String,
    },
    role: {
        type: String,
        default: 'teacher'
    }
});

const teacherModel=model("teacher", teacherSchema)
module.exports=teacherModel;