const mongoose = require('mongoose');

const syllabusSchema = new mongoose.Schema({
  Subject: String,
  pdfUrl: String, // Add the pdfUrl field
  Chapters: [
    {
      topic: String,
      _id: String, // Include the _id field
    },
  ],
  __v: Number, // Include the __v field if needed
});

const SyllabusModel = mongoose.model('Syllabus', syllabusSchema);

module.exports = SyllabusModel;
