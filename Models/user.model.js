const mongoose=require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
  uid:  Number, 
  username :String,
  email :String,
  password:String,
  dp:String
}, 
{timestamps :true});

const User=mongoose.model('User',UserSchema);
module.exports= User;