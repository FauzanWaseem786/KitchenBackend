const mongoose =require('mongoose');
const { Schema } = mongoose;

const commentSchema = new Schema({
  username:  String, 
  upid: String,
  comment : String,
}, 
{timestamps :true});

const Comments=mongoose.model('Comments',commentSchema);
module.exports= Comments;