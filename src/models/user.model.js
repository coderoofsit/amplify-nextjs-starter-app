const mongoose = require("mongoose");

const courseDetailSchema = mongoose.Schema({
  selectedPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Plan",
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  selectedOptions: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Option",
  },
});

const userSchema = mongoose.Schema({
  // user schema fields here
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  name: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
  },
  picture: {
    type: String,
    default:
      "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
  },
  mob: {
    type: String,
    unique: true,
    required: true,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  isTemp: {
    type: Boolean,
    default: true, // Default value is true, indicating the user is temporary
  },
  assignedCourses: [
    {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course", // Adjust this based on your Course model name
  }],
  courseDetails: [courseDetailSchema], // Array to store multiple course details
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const userModel = mongoose.model("User", userSchema);

module.exports = userModel;
