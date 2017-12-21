
var express=require("express");
var router=express.Router();
var Campground=require("../models/campground")
var Comments=require("../models/comment")
var passport=require("passport");
var User=require("../models/user")
var middleware=require("../middleware")   //index.js is assumed


///+++++++++++++++++++++++++++++++++++++++++++++++
//Auth Routes

//================================================================
//Authenication Route
//============================================================
//show 
router.get("/register", function(req,res){
    res.render("register");
});


//handling user sign up

router.post("/register", function(req,res){
    
    //creates a user in the database but encodes the password.
    
    User.register(new User({username: req.body.username}), req.body.password ,function(err,user){
        if(err){
         //  req.flash("error",err.message);
         //  console.log(err.message);
           res.redirect("register");
         //  console.log(error);
        }
        passport.authenticate("local")(req,res,function(){
             req.flash("success","Welcome to YelpCamp "+req.body.username);
            res.redirect("/campgrounds")        ;
        });
        });
});
    


//================================================================
//Login Route
//============================================================
//show 

//render login
router.get("/login", function(req,res){
    res.render("login");
});

///login logic

router.post("/login",passport.authenticate("local",{
    successRedirect:"/campgrounds",
    failureRedirect:"/login"}), function(req,res){
});


///Logout

router.get("/logout", function(req,res){
    req.logout();
    req.flash("success","Logged you out!");
    res.redirect("/campgrounds");
});


///Middleware

// function isLoggedIn(req,res,next){
//     if(req.isAuthenticated()){
//         return next();
//     }
//     res.redirect("/login");
// }

module.exports =router;