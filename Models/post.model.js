const mongoose =require('mongoose') ;
const { Schema } = mongoose;

const PostSchema = new Schema({
  username:  String, 
  upid: Number,
  fav: Number,
  Caption : String,
  files :[String]
}, 
{timestamps :true});

const Posts=mongoose.model('Posts',PostSchema);
module.exports= Posts;