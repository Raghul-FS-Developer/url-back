var express = require('express');
var router = express.Router();
var mongoose = require('mongoose')
var nodemailer = require("nodemailer");
require('dotenv').config()

const url =  require('../schema2')
const users = require("../schema");
var shortUrl = require("node-url-shortener");


mongoose.connect(process.env.URL).then(()=>console.log('db connected successfully'));

const { hashing, hashCompare, createjwt, auth } = require("../library/auth");
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post("/register", async (req, res) => {
  try {
    
    const hash = await hashing(req.body.password);
    req.body.password = hash;
    let token =await createjwt({email:req.body.email})
    const register = await users(req.body);
    
    register.save((err, data) => {
      if (err) {
        console.log(err);
        res.json({ statuscode: 400, message: "Email Already Exist" });
      }else{
        res.json({
          statuscode: 200,
        });
        let {name}=data
        
        
        var sender = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "fullstackdeveloper772@gmail.com",
            pass: process.env.pass,
          },
        });
        var composeMail = {
          from: "fullstackdeveloper772@gmail.com",
          to: req.body.email,
          subject: `Account-verification`,
          text: "",
          html: `<h2>Hello ${name}</h2>
        <p>We've recieved a request to verify your account associated with your email.
        You can register your account by clicking the link below</p>
        <a href=https://url-shortner-frontend.vercel.app/confirm/${token}>Register verification</a>
        <p><b>Note:</b>The link expires 5 minutes from now</p>
        </div>`,
        };
  
        sender.sendMail(composeMail, (error) => {
          if (error) {
            console.log(error);
          } 
        });
  
      
      
      }
    });
  } catch (error) {
    console.log(error);
    res.json({ message: "something went wrong" });
  }
});
router.post('/confirm/:token',async(req,res)=>{
  try {
    let mail=await auth(req.params.token)
    
    if(mail)
    {
      await users.updateOne({email:mail},{$set:{ValidityStatus:'Active'}})
      res.json({
        statuscode:200,
          })
    }else{
      res.json({statuscode:400,
      
      })
    }
  } catch (error) {
    console.log(error)
  }

})
router.post("/login", async (req, res) => {
  try {
    
    const login = await users.findOne({ email: req.body.email });
    let token1 =await createjwt({email:req.body.email})
    if(login){
      if (login.ValidityStatus=='Active') {
      const compare = await hashCompare(req.body.password, login.password);

      if (compare) {
        await createjwt({ email: req.body.email });

        res.json({
          statuscode: 200,
          messsage: "Login successfully",
          email:req.body.email
        });
      } else {
        res.json({
          message: "wrong password",
        });
      }
    } else {
      res.json({
        message: "Account is InActive , Check Your Mail For Activaton Link",
      });
      let {name}=login
     
        
        var sender = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "fullstackdeveloper772@gmail.com",
            pass: process.env.pass,
          },
        });
        var composeMail = {
          from: "fullstackdeveloper772@gmail.com",
          to: req.body.email,
          subject: `Account-verification`,
          text: "",
          html: `<h2>Hello ${name}</h2>
        <p>We've recieved a request to verify your account associated with your email.
        You can register your account by clicking the link below</p>
        <a href=https://url-shortner-frontend.vercel.app/confirm/${token1}>Register verification</a>
        <p><b>Note:</b>The link expires 5 minutes from now</p>
        </div>`,
        };
  
        sender.sendMail(composeMail, (error) => {
          if (error) {
            console.log(error);
          } 
        });
   
   
   
    }
  }else{
    res.json({
      message: "Email does not exist",
    });
  }
} catch (error) {
    console.log(error);
  }
});


router.post("/forgot-password", async (req, res) => {
  try {
    let step = await users.findOne({ email: req.body.email });
    
    if (step) {
      const { name } = step;
      let token = await createjwt({ email: req.body.email });
     
      var sender = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "fullstackdeveloper772@gmail.com",
          pass: process.env.pass,
        },
      });
      var composeMail = {
        from: "fullstackdeveloper772@gmail.com",
        to: req.body.email,
        subject: `Reset-password-verification`,
        text: "",
        html: `<h2>Hello ${name}</h2>
      <p>We've recieved a request to reset the password for your account associated with your email.
      You can reset your password by clicking the link below</p>
      <a href=https://url-shortner-frontend.vercel.app/verify/${token}> Reset Password</a>
      <p><b>Note:</b>The link expires 5 minutes from now</p>
      </div>`,
      };

      sender.sendMail(composeMail, (error) => {
        if (error) {
          console.log(error);
        } 
      });

      res.json({ statuscode: 200});
    
    } else {
      res.json({ statuscode: 400, message: "Email does not exist" });
    }
  } catch (error) {
    console.log(error);
    
  }
});

router.post("/verify/:token", async (req, res) => {
  try {
    let mail = await auth(req.params.token);
    
    if (mail) {
       let pass = await hashing(req.body.password);
      await users.updateOne({ email: mail }, { $set: { password: pass } });
      
      res.json({
        statuscode: 200,
        message: "password changed successfullly",
      });
    } else {
      res.json({
        message: "Token Expired",
      });
    }
  } catch (error) {
    console.log(error);
    
  }
});
router.post("/shortner",async(req,res)=>{
   try {
  
   shortUrl.short(req.body.longUrl, function (err, url) {
       console.log(err);
       console.log(url);
       res.json({
         statuscode:200,
          url:url
       })
    
     })
  

      
   
   } catch (error) {
     console.log(error)
   }
   
router.post('/save',async(req,res)=>{
  try {
      console.log(req.body)
      let save = await url({
        email:req.body.email,
        longurl:req.body.longurl,
        shorturl:req.body.shorturl
      })
      save.save((err, data) => {
        if (err) {
          console.log(err);
          res.json({ statuscode: 400});
        }else{
          res.json({
            statuscode: 200,
          });
        }})

    
 } catch (error) {
    console.log(error)
  }
})



})

router.post('/geturl',async(req,res)=>{
  try {
    
    let result =  await url.find({email:req.body.email})
    res.json(result)
  
  } catch (error) {
    console.log(error)
  }
})
router.post('/getuser',async(req,res)=>{
  try {
   
    let result = await users.findOne({email:req.body.email})
    res.json(result)
  } catch (error) {
    console.log(error)
  }
})


module.exports = router;
