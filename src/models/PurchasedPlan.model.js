const { Schema, model } = require("mongoose");

const PurchasedPlanSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  planId: {
    type: Schema.Types.ObjectId,
    ref: "Plan",
    required: true,
  },
  selectedOptions:{
  type: Schema.Types.ObjectId,
  ref: "Plan",
  required: true,
},
  courseId: {
    type: Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  transactionId: {
    type: String,
    required: true,
  },
  receiptId: {
    type: String,
    required: true,
  },
  amount:
   { type: Number,
     required: true 
    },
  timestamp: {
    type: Date,
    default: Date.now, // Set default value to current timestamp
    required: true,
  },
  paymentStatus: {
    type: Boolean,
    default: false, // Set default value to "Pending"
    required: true,
  },
  level: {
    type: String,
    enum: ["1", "2", "3"],
    required: true,
  },
});

const PurchasedPlanModel = model("PurchasedPlan", PurchasedPlanSchema);

module.exports = PurchasedPlanModel;
