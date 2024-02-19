const mongoose = require("mongoose");

const attemptedTestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to your User model
    required: true,
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz', // Reference to your Quiz model
    required: true,
  },
  testName: {
    type: String,
    required: true,
  },
  questionsAndAnswers: [
    {
      questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz.questions._id', // Reference to the questions in the Quiz model
        required: true,
      },
      chosenAnswer: {
        type: String, // Adjust the type based on your answer format (string, number, etc.)
        required: true,
      },
    },
  ],
  remainingDuration: {
    type: Number,
    required: true,
  },
  indexPage: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const AttemptedTest = mongoose.model("AttemptedTest", attemptedTestSchema);

module.exports = AttemptedTest;
