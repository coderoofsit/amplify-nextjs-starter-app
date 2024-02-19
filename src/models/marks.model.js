// marks.model.js
const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  Duration: {
    type: String,
    required: true,
  },
  resultTime:{
    type:String,
    required: true,
  },
  totalMarks: {
    type: String,
    required: true,
  },
  testName: {
    type: String,
    required: true,
  },
  marks: {
    type: Number,
    required: true,
  },
 

  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course', 
    required: true,
  },
}, {
  timestamps: true,
});

const Marks = mongoose.model('Marks', marksSchema);

module.exports = Marks;
