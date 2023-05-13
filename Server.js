const express=require('express');
const mongoose=require('mongoose');
const jwt_decode =require('jwt-decode') ;
const cors=require('cors')
const bodyParser = require('body-parser');
const User = require('./Models/user.model.js');
const Posts = require('./Models/post.model.js');
const Comments = require('./Models/comment.model.js');
require("dotenv").config()
const bcrypt = require('bcrypt')
const multer = require("multer")
const app=express();
const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer");

app.use(express.urlencoded({ extended: true }))

app.use(bodyParser.json());
app.use(cors());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://kitchenf.onrender.com/')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})
app.use(express.json());
var fs = require('fs-extra');


/////////////////////////////upload to multer\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
//const profile_pics = multer({ dest: "profile_pics" })
var posts = multer({ dest: "posts" }).array('files');
var profile_pics = multer({dest:'profile_pics'}).single('file');

////////////////////////////////////////////////////connection to db////////////////////////
mongoose.set("strictQuery", true);
mongoose.connect(
  process.env.MONGO, 
    {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  );

  const connection = mongoose.connection;
  connection.on('error', console.error.bind(console, "connection error: "));
  connection.once('open', function () {
    console.log("Connected successfully");
  });
 
 /* User.find({'username':'fauzan'}, 
  function (err, result) {
    if (err) return handleError(err);
    else{
       console.log(result)
    }
}).select('email');*/
  
///////////////authentications/////////////////////
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
      const token = authHeader.split(' ')[1];
      jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
          if (err) {
              return res.sendStatus(403);
          }

        //  req.user = user;
          next();
      });
  } else {
      res.sendStatus(401);
  }
};
  



//////////////// post requests/////////////////////////////



//////////////////////////////////////Siignup/////////////////////////////////////
  app.post('/Signup',  function (req, res) {
    profile_pics(req, res, async function (err) {
        if (err) {
            res.status(500).json({ error: 'message' });
        }
        
        if (req.file == null) {
            // If Submit was accidentally clicked with no file selected...
            res.send('No pic uploaded');
            return 0;
        } 
            // read the img file from tmp in-memory location
          const newImg = fs.readFileSync(req.file.path);
          const encImg = newImg.toString('base64');
            // define your new document
          const hashedPswd= await bcrypt.hash(req.body.password,10)  
          console.log(hashedPswd)
         //use mongoose to get max id
            const usr = new User({
              uid: 1,
              username: req.body.username,
              email: req.body.email,
              password: hashedPswd,
              dp:encImg });
            
            usr.save();
            res.send('Signed in Successfully!');
        
    });
})

////////////////////////////////postmaking//////////////////////////////////////////////
app.post('/Postmaker', function (req, res) {
  posts(req, res, function (err) {
        if (err) {
            res.status(500).json({ error: 'message' });
        }
        if (req.files.length == 0) {
            // If Submit was accidentally clicked with no file selected...
            res.send('No pic selected');
        } else {
            let imgs=[]
            for(let i=0;i<req.files.length;i++){
              // read the img file from tmp in-memory location
              var newImg = fs.readFileSync(req.files[i].path);
              // encode the file as a base64 string.
              var encImg = newImg.toString('base64');
              imgs.push(encImg);
            }
            console.log(req.body.Caption)
            console.log(req.body)
            // define your new document
            const psts = new Posts({
              username : "fauzan",
              upid: 2,
              fav: 0,
              Caption: req.body.Caption,
              files: imgs
            });
            
            psts.save(function (err) {
              if (err) return handleError(err)});
            res.send('Signed in Successfully!');
        }
    });
})


////////////////////////commenting////////////////////////////////////////////////////////
app.post('/Post', (req, res) => {
  console.log('got post')
  var cmnt=new Comments({
    username: req.body.username,
    upid: req.body.upid,
    comment : req.body.comment
  });
  cmnt.save(function (err) {
    if (err) return handleError(err)});
  res.send('comment added');
  })




//////////////////////GET requests//////////////////////////////////////////////////////////////////////////////

/////////////////////////////to validate a user while signup////////////////////////////////////////////////
  function checkUsr(username,email){
    return new Promise(async (resolve,reject)=>{
      var validUser;
      User.find({'username':username}, // here we have used callbacks instead of .then() since mongoose automatically supports(returns) promises
//we could have used .then() also but i coded this first so decided to go on with it )
      function (err, result) {
      if (err) return handleError(err);
      else{
        console.log(result.length);
        if(result.length>0){
          validUser=0;
          resolve(0);
        }
        else{
          User.find({'email':email}, 
          function (err, result) {
            if (err) return handleError(err);
            else{
            if(result.length>0){
              resolve(2);
            }
            else
            validUser=1;
            resolve(validUser) ;
          }
          })
        }
      }})
      
      
    })
   
    
  }

  app.get('/validation',(req, res) => {
    console.log(req.query)
    console.log('got a get ')
    checkUsr(req.query.username,req.query.email).then(check =>{res.send({check})})
    .catch(err => {res.send(err)})
    })  


/////////////////////// dummy to check users//////////////////////////////////////
    app.get('/Profile',authenticateJWT,async (req, res) => {
      try{
      const user =await User.findOne({'username': req.query.username}).select("-password")  // here we have used callbacks instead of .then() since mongoose automatically supports(returns) promises
//we could have used .then() also but i coded this first so decided to go on with it )
      res.send(user)
      }
      catch(e){
      res.status(404).json({msg :"Not Found"})
      }
    })




// ////////////////////////////////getting posts//////////////////////////////////////////////////////////
  app.get('/posts',async (req, res) => {
       console.log('got a get')
      var posts=await Posts.find({}).skip(req.query.page*5).limit(5) 
    //  var posts_data=await posts.json();
      var data=[]
      
      for (let i=0;i<posts.length;i++){
        var user=await User.find({'username':posts[i].username}).select('dp');
        var comment=await Comments.find({'upid':posts[i]._id}).limit(1);
        var cmnt_cntnt=null;
        var commentUser=[];
        if(comment.length>0){
          cmnt_cntnt=comment[0].comment;
          commentUser=await User.find({'username':comment[0].username}).select("dp username");
        }
        
        var cmnt_usr=null;
        var cmnt_usrname=null;
        
        if(commentUser.length>0) {
          cmnt_usr=commentUser[0].dp
          cmnt_usrname=commentUser[0].username
        }
        
        data.push({
          imgindex:0,
          username :posts[i].username,
          userDp:user[0].dp,
          id :posts[i]._id,
          fav :posts[i].fav,
          caption :posts[i].Caption,
          files:posts[i].files,
          comments:[{comment:cmnt_cntnt,commentUser:cmnt_usr,username:cmnt_usrname}]
        })

      }   
     // console.log(data) 
      res.send(data);
  })   


/////////////////////////////////getting comments/////////////////////////////////////////////
///for posting posts and comments we have used authentication on client side using jwt token and 
//for a change for getting comments we have used server side authentication using a middleware to verify jwt token 
  

app.get('/comments',authenticateJWT,async (req, res) => {
    var comments=await Comments.find({'upid':req.query.upid}).skip(req.query.page*3).limit(3) 
    var data=[]
    for (let i=0;i<comments.length;i++){
      var user=await User.find({'username':comments[i].username}).select("dp username");
      data.push({
        comment:comments[i].comment,commentUser:user[0].dp,username:user[0].username
      })

    }    
    res.send(data);
})   

////////////////////////////////////////////////////////////Login authentication/////////////////////

app.post('/Login', async function (req, res) {
  
  const { username, password } = req.body;
  console.log(username)
  try {
    const user = await User.findOne({ username }).exec();
    if (!user) {
      console.log('1')
      return res.status(401).json({ message: 'No Such User' });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      console.log('2')
      return res.status(401).json({ message: 'Incorrect Credentials' });
    }
    const token = jwt.sign({ username: user.username,email:user.email ,userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token:token ,dp:user.dp});
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});


///////////////////////////////forget and reset password////////////////

// Step 1: Add the /forgot-password route
app.post('/forgot-password', async (req, res) => {
  console.log(req.body.email)
  const { email } = req.body;

  try {
    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate a unique token
    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    // Send an email to the user's registered email address
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: "Reset Your Password",
      html: `
        <p>Hello ${user.username},</p>
        <p>We received a request to reset your password.</p>
        <p>Please click on the link below to reset your password.</p>
        <a href="${req.headers.referer}reset-password/${token}">${req.headers.referer}/reset-password/${token}</a>
        <p>This link is valid for 15 minutes.</p>
        <p>If you did not request a password reset, please ignore this email.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: "An email has been sent to your registered email address with further instructions." });
  } catch (error) {
    console.error(error);
    res.status(500).json({message : 'Internal Server Error'})
  }
});



// Step 2: Add the /reset-password route
app.post('/reset-password', async (req, res) => {
  
  try {
    const {  p ,token} = req.body;

    // Verify JWT token
     jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
          return res.sendStatus(403);
      }});
      const decoded = jwt_decode(token);
      const email=decoded.email
    // Update user's password in the database
    const hashedPassword = await bcrypt.hash(p, 10);
    await User.findOneAndUpdate({ email }, { password: hashedPassword });

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.listen(5000,() =>{
    console.log(`server is running on port 3000`);
})