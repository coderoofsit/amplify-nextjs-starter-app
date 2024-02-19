const { Schema, model } = require("mongoose");

const AdsSchema = new Schema({
    adsPictures: [
        {
          type: String,
        },
      ],
      adsLink: [
        {
            type: String,
        }
      ]
   
});

const AdsModel=model("ads", AdsSchema)
module.exports=AdsModel;