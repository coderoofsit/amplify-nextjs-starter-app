const { Schema, model } = require("mongoose");

const PlanSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  CourseId:{
    type:Schema.Types.ObjectId,
    ref: "Course",
  },
  plans: [
    {
      name: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      level: {
        type: String,
        enum: ["1", "2", "3"],
        required: true,
      },
      
      options: [
        {
          type: String,
          required: true,
        },
      ],
      price: {
        type: Number,
        required: true,
      },
    },
  ],
});

const PlanModel = model("plan", PlanSchema);

module.exports = PlanModel;
