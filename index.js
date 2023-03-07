//jshint esversion:6

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

mongoose.connect("mongodb://127.0.0.1:27017/fTeamDB"); //localhost ain't working => 127.0.0.1

const userSchema = new mongoose.Schema ({
  email : String,
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

passport.deserializeUser((id, done) => {
  User.findById(id).then((user) => done(null, user))
});



passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:4131/auth/google/home",
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

app.get("/auth/google/home",
  passport.authenticate('google', { failureRedirect: "/opening" }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.render("home");
  });

app.get("/register", function(req, res){
  res.render("register");
});

app.get("/startup", function(req, res){
  User.find({"secret": {$ne: null}}, function(err, foundUsers){
    if (err){
      console.log(err);
    } else {
      if (foundUsers) {
        res.render("startup", {usersWithSecrets: foundUsers});
      }
    }
  });
});

app.get("/home", async (req, res) => {
  try {
    const founduser = await User.find({});
    res.render("home");
  } catch (err) {
    console.log(err);
  }
});


app.get("/logout", function(req, res){
  req.logout(function(err){
    if(err){
      console.log(err);
    }else{
      console.log("Session LOgged Out")
    }
  });
  res.redirect("/");
});

app.post("/register", function(req, res){

  User.register({username: req.body.username}, req.body.password, function(err, user){
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/home");
      });
    }
  });

});


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



//contactContent
app.get("/contact", function(req, res){
  res.render("contact");
});

// hr-finance-buiseness

app.get("/hr",function(req,res){
  res.render("hr");
});

app.get("/buisness",function(req,res){
  res.render("buisness");
});


app.get("/finance",function(req,res){
  res.render("finance");
});


//listen method
app.listen(process.env.PORT || 4131 , function() {
  console.log("Server started on port 4131");
});
