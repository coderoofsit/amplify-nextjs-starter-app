const { Schema, model } = require("mongoose");

const courseSchema = new Schema({
  title: String,
 
  duration:String,
  thumbnail:String,
  subjects: [{
    title: String,
    level:Number,
    options: [{
      heading: String,
      url: String,
      thumbnail: String,
      batch: String,
      Conference_no: String,
      subjects: [{
        title: String,
        videourls: [
          {
            url: String,
            thumbnail: String, 
          },
        ],
        pdfsurls: [String],
      }],
      time: String,
      date:String,
    }],
  }],
});

const CourseModel = model('Course', courseSchema);

module.exports = {
  CourseModel,
};
