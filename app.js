var express=require("express");
var app=express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.static(__dirname+"/public"));

var bodyParser=require("body-parser");
app.use(bodyParser.urlencoded({extended:true}));
var mongoose = require("mongoose");
var methodOverride= require("method-override");
var flash=require("connect-flash");

//Routes Refactor
var campgroundRoutes=require("./routes/campground");
var commentRoutes=require("./routes/comments");
var authRoutes=require("./routes/auth");


//Authenication
var passport=require("passport");
var LocalStrategy=require("passport-local");
var passportLocalMongoose=require("passport-local-mongoose");
var User=require("./models/user");
app.use(require("express-session")({
    secret: "Rusty is the cutest doog in the world",
    resave: false,
    saveUninitialized: false
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method"));


passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


//Local Declarations

app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   res.locals.error=req.flash("error");
   res.locals.success=req.flash("success");
   next();
});
//mongoose.connect(process.env.DATABASEURL);
mongoose.connect("mongodb://localhost/yelp-camp", {useMongoClient: true});
//mongoose.connect("mongodb://tbt:password@ds053459.mlab.com:53459/tbt-yelpcamp");
//mongoose.Promise = global.Promise; 
//schema setup

// var Campground = require("./models/campground");
// var Comment = require("./models/comment");

var seedDB = require("./seeds");
//seedDB();
//Passport Config


app.use(campgroundRoutes);
app.use(commentRoutes);
app.use(authRoutes);




app.listen(process.env.PORT, process.env.IP, function(){
    console.log("The YelpCamp Server has Started!!!");
});
