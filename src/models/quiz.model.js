const { Schema, model } = require("mongoose");

const QuizSchema = new Schema({
  // timestamp: {
  //   type: Date,
  //   default: Date.now,
  // },
  testSeriesName: {
    type: String,
    required: true,
  },
  CourseId:{
    type:Schema.Types.ObjectId,
    ref: "Course",
  },
  testSeriesDescription: {
    type: String,
    required: true,
  },

  date: {
    type: String,
    required: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  resultTime: {
    type: Date,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  totalMarks: {
    type: Number,
    required: true,
  },
  negativeMarking: {
    type: Number,
    required: true,
  },
  images:[
    {
      type:String,
      required: true,
    }

  ],
  questions: [
    {
      question: {
        type: String,
        required: true,
      },
      options: [
        {
          type: String,
          required: true,
        },
      ],
      correctOption: {
        type: Number,
        required: true,
      },
      
      marks: {
        type: Number,
        required: true,
      },
    },
  ],
});

const QuizModel = model("quiz", QuizSchema);

module.exports = QuizModel;
