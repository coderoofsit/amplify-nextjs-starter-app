// payment.model.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  transactionId: { type: String, required: true },
  receiptId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  
  // You can add more fields as needed, such as payment status, timestamp, etc.
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
