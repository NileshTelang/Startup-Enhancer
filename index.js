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
const { url } = require('inspector');


const app = express();

app.use(express.static("public"));

app.set('view engine', 'ejs');

//views
app.set('views', path.join(__dirname, './views'));

//bodyParser use
app.use(bodyParser.urlencoded({ extended: true }));

//express access public dir
app.use(express.static(path.join(__dirname, 'public')));


function isLoggedIn(req,res,next){
  req.user ? next() : res.sendStatus(401);
}


app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.MONGODB_URI); //localhost ain't working => 127.0.0.1
const db = mongoose.connection;
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String
});



userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("users", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});



passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "https://startup-enhancer.onrender.com/auth/google/home",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
  async (request , accessToken, refreshToken, profile, done)=> {
    console.log(profile);
    done(null,profile);
    const user = await User.findOne({googleId: profile.id});
    if(user){
      console.log("Google Id LoggedIn");
    }else{
      const newuser = await User.create({googleId : profile.id});
      user.save();
      if(newuser){
        console.log("Profile Created");
      }else{
        console.log("err bro work hard");
      }
    }
  }
));

// startups
// create an schema
var startupSchema = new mongoose.Schema({
  email: String,
  title: String,
  description: String,
  technologies: String,
  category: String,
  img: String,
});

var sups = mongoose.model('startups', startupSchema);

app.get("/", function (req, res) {
  res.render("opening");
});

app.get("/home", isLoggedIn,async (req, res) => {
  const docs = await sups.find({});
  res.render("home", { startups: docs });

});


app.get("/contributors",isLoggedIn, function (req, res) {
  res.render("contributors");
});


app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile","email"] })
);

app.get("/auth/google/home",
  passport.authenticate('google', { failureRedirect: "opening" }),
  async (req, res) => {
    const docs = await sups.find({});
    res.render("home", { startups: docs });
  });

app.get("/startup",isLoggedIn, async (req, res) => {
  const docs = await sups.find({});
  res.render("startup", { startups: docs });

});





app.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) {
      console.log(err);
    } else {
      req.session.destroy();
      console.log("Session LOgged Out")
    }
  });
  res.redirect("/");
});

app.post("/register", function (req, res) {

  User.register({ username: req.body.username }, req.body.password, function (err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/home");
      });
    }
  });

});


app.post("/opening", function (req, res) {

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/home");
      });
    }
  });

});

app.get("/submit",isLoggedIn, function (req, res) {
  res.render("submit");
})

app.post("/submit", async (req, res) => {


  const email = req.body.email;
  const title = req.body.sTitle;
  const description = req.body.description;
  const technologies = req.body.technologies;
  const category = req.body.category;
  const img = req.body.image;


  var data = {
    "email": email,
    "title": title,
    "description": description,
    "technologies": technologies,
    "category": category,
    "img": img,
  }

  db.collection('startups').insertOne(data, async (err, collection) => {
    if (err) {
      throw err;
    } else {
      console.log("Record Inserted Successfully!!")
      const docs = await sups.find({});
      res.render("home", { startups: docs });
    }

  });

});


app.get("/register", function (req, res) {
  res.render("register");
});

//contactContent
app.get("/contact", function (req, res) {
  res.render("contact");
});


// hr-finance-buiseness

app.get("/hrcon",isLoggedIn, function (req, res) {
  res.render("hrcon");
});

app.get("/buisness",isLoggedIn, function (req, res) {
  res.render("buisness");
});


app.get("/finance",isLoggedIn, function (req, res) {
  res.render("finance");
});


//listen method
app.listen(process.env.PORT || 4131, function () {
  console.log("Server started on port 4131");
});
