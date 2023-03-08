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
app.set('views', path.join(__dirname, './Views'));

//bodyParser use
app.use(bodyParser.urlencoded({ extended: true }));

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
const db = mongoose.connection;
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String
});



userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
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
  function (accessToken, refreshToken, profile, cb) {
    console.log(profile);

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
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

app.get("/",function(req,res){
  res.render("opening");
});

app.get("/home", async (req, res) => {
  const docs = await sups.find({});
  res.render("home",{startups : docs });

});

app.get("/contributors",function(req,res){
  res.render("contributors");
});


app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] })
);

app.get("/auth/google/home",
  passport.authenticate('google', { failureRedirect: "/opening" }),
  function (req, res) {
    // Successful authentication, redirect to secrets.
    res.render("home");
  });

  app.get("/startup", async (req, res) => {
    const docs = await sups.find({});
    res.render("startup",{startups : docs });
  
  });





app.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) {
      console.log(err);
    } else {
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

app.get("/submit", function (req, res) {
  res.render("submit");
})

app.post("/submit", async (req, res)=> {


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
      res.render("home",{startups : docs });
    }

  });

});


//contactContent
app.get("/contact", function (req, res) {
  res.render("contact");
});

// hr-finance-buiseness

app.get("/hr", function (req, res) {
  res.render("hr");
});

app.get("/buisness", function (req, res) {
  res.render("buisness");
});


app.get("/finance", function (req, res) {
  res.render("finance");
});


//listen method
app.listen(process.env.PORT || 4131, function () {
  console.log("Server started on port 4131");
});
