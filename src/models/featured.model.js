const { Schema, model } = require("mongoose");

const FeaturedSchema = new Schema({
  featuredHeading: {
    type: String,
  },

  featuredThumbnail: {
    type: String,
  },

upComing:{
type:Boolean,
default:false
},
Description:{
type:String
},
VideoUrl:{
type:String
},
Duration:{
type:String
},

CourseId:{
  type:Schema.Types.ObjectId,
  ref: "Course",
},


planId: {
  type: Schema.Types.ObjectId,
  ref: "Plan",
},

});

const FeaturedModel = model("Featured", FeaturedSchema);
module.exports = FeaturedModel;