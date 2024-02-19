const { Schema, model } = require("mongoose");

const StuffSchema = new Schema({
    stuffHeading: 
        {
          type: String,
        },
      
      stuffThumbnail: 
        {
            type: String,
        },
    
      stuffLink: [
        {
          title: {
            type: String,
          },
          link: {
            type: String,
          }
        }
    ],
        stuffVideoUrl:[
            {
                title: {
                  type: String,
                },
                link: {
                  type: String
                }
            }
        ],
    
   
});

const StuffModel=model("Stuff", StuffSchema)
module.exports=StuffModel;