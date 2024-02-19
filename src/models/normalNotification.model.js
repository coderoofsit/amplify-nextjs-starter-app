const mongoose = require('mongoose');

// Define the schema for the normalNotification model
const normalNotificationSchema = new mongoose.Schema({
  heading: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    // required: true
  },
  date: {
    type: Date,
    // required: true,
    default: Date.now
  },
  time: {
    type: String,
    // required: true
  },


});

// Create the normalNotification model using the schema
const normalNotification = mongoose.model('normalNotification', normalNotificationSchema);

module.exports = normalNotification;
