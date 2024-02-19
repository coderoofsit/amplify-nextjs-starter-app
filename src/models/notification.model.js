// Import mongoose
const mongoose = require('mongoose');

// Define the Notification schema
const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to your User model, replace with your actual User model name
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course', // Reference to your Course model, replace with your actual Course model name
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create the Notification model
const Notification = mongoose.model('Notification', notificationSchema);

// Export the Notification model
module.exports = Notification;
