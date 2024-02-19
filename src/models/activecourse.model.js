const { Schema, model } = require("mongoose");

const ActivecourseSchema = new Schema({
  ActivecourseHeading: {
    type: String,
  },

  ActivecourseThumbnail: {
    type: String,
  },

// upComing:{
// type:Boolean,
// default:false
// },
Description:{
type:String
},
VideoUrl:{
type:String
},
Duration:{
type:String
},
Price:{
type:String
},

planId: {
  type: Schema.Types.ObjectId,
  ref: "Plan",
},

CourseId:{
  type:Schema.Types.ObjectId,
  ref: "Course",
},

});

const ActivecourseModel = model("Activecourse", ActivecourseSchema);
module.exports = ActivecourseModel;