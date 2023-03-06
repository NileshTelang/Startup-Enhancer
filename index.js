
require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const path = require("path");
const _ = require("lodash");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');


const app = express();

app.use(express.static("public"));

app.set('view engine', 'ejs');

//views
app.set('views', path.join(__dirname, './Views'));

//bodyParser use
app.use(bodyParser.urlencoded({extended: true}));

//express access public dir
app.use(express.static(path.join(__dirname, 'public')));



app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1:27017/userDB"); //localhost ain't working => 127.0.0.1

const userSchema = new mongoose.Schema ({
  email: String,
  password: String,
  googleId: String,
  sTitle: String,
  // sImage: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:4131/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req, res){
  res.render("home");
});

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);

app.get("/auth/google/startups",
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.render("home");
  });

app.get("/register", function(req, res){
  res.sendFile(__dirname+"/register.html");
});

app.get("/startup", function(req, res){
  User.find({"sTitle": {$ne: null}}, function(err, foundUsers){
    if (err){
      console.log(err);
    } else {
      if (foundUsers) {
        res.render("startup", {usersWithSecrets: foundUsers});
      }
    }
  });
});

// app.get("/submit", function(req, res){
//   if (req.isAuthenticated()){
//     res.render("submit");
//   } else {
//     res.redirect("/login");
//   }
// });

// app.post("/submit", function(req, res){
//   const submittedTitle = req.body.sTitle;
//   const submittedImage = req.body.sImage;

// // Once the user is authenticated and their session gets saved, their user details are saved to req.user.
// // console.log(req.user.id);

//   User.findById(req.user.id, function(err, foundUser){
//     if (err) {
//       console.log(err);
//     } else {
//       if (foundUser) {
//         foundUser.sTitle = submittedTitle;
//         foundUser.sImage = submittedImage;
//         foundUser.save(function(){
//           res.redirect("/startup");
//         });
//       }
//     }
//   });
// });

// app.get("/logout", function(req, res){
//   req.logout(function(err){
//     if(err){
//       console.log(err);
//     }else{
//       console.log("Session LOgged Out")
//     }
//   });
//   res.redirect("/");
// });

// app.post("/register", function(req, res){

//   User.register({username: req.body.username}, req.body.password, function(err, user){
//     if (err) {
//       console.log(err);
//       res.redirect("/register");
//     } else {
//       passport.authenticate("local")(req, res, function(){
//         res.redirect("/secrets");
//       });
//     }
//   });

// });

app.post("/opening", function(req, res){

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/home");
      });
    }
  });

});





















// //mainpageabout
// app.get("/about",function(req,res){
//   res.sendFile(__dirname+"/about.html");
// });



// // startups

// homeStartingContent = "roronoa";

// let posts = [];



// app.get("/startups", function(req, res){
//   res.render("startup", {
//     startingContent: homeStartingContent,
//     posts: posts
//     });
// });


// app.post("/startup", function(req, res){
//   const post = {
//     title: req.body.postTitle,
//     content: req.body.postBody

//   };

//   posts.push(post);

//   res.sendFile(__dirname+"/index.html");

// });













// app.get("/startup/:sTitle", function(req, res){
//   const requestedTitle = _.lowerCase(req.params.sTitle);

//   posts.forEach(function(post){
//     const storedTitle = _.lowerCase(post.title);

//     if (storedTitle === requestedTitle) {
//       res.render("post", {
//         title: post.title,
//         content: post.content
//       });
//     }
//   });

// });















//contactContent
app.get("/contact", function(req, res){
  res.sendFile(__dirname+"contact.html");
});

// hr-finance-buiseness

app.get("/hr",function(req,res){
  res.sendFile(__dirname+"/hr.html");
});

app.get("/buiseness",function(req,res){
  res.sendFile(__dirname+"/buiseness.html");
});


app.get("/finance",function(req,res){
  res.sendFile(__dirname+"/finance.html");
});


//listen method
app.listen(process.env.PORT || 4131 , function() {
  console.log("Server started on port 4131");
});
