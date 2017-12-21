
var express=require("express");
var router=express.Router();
var Campground=require("../models/campground")
var passport=require("passport");
var Comment=require("../models/comment")
var middleware=require("../middleware")   //index.js is assumed

//++++++++++++++++++++++++++++++++++++
//Routes
//++++++++++++++++++++++++++++++++++++




// INDEX
router.get ("/",function(req,res){
    res.render("landing");
});




router.get ("/campgrounds",function(req,res){
    //Get all  campgrounds from db
    Campground.find({},function(err,allCampgrounds){
          if(err){
        console.log(err);
    }else {
         res.render("campgrounds",{campgrounds:allCampgrounds, currentUser:req.user});
   }
    });
});


//Create

router.post ("/campgrounds",middleware.isLoggedIn,function(req,res){
    var name = req.body.name;
    var price = req.body.price;
    var image = req.body.image;
    var description = req.body.description;
    var author={
        id:req.user._id,
        username:req.user.username
    }
    var newCampground={name:name,price:price,image:image,description:description,author:author};
//    campgrounds.push(newCampground);
//save tp db

Campground.create(newCampground,
    function(err, ret){
   if(err){
        console.log(err);
   }else {
       res.redirect("/campgrounds");
   }
});
});


// New Route isLoggedIn

router.get ("/campgrounds/new", middleware.isLoggedIn,function(req,res){
res.render("new");
});



//show
router.get ("/campgrounds/:id",function(req,res){
    Campground.findById(req.params.id).populate("comments").exec( function(err,foundCampground){
        if(err){
        console.log(err);
   }else {
      // console.log(foundCampground);
     res.render("show",{campground:foundCampground});
   }
});
});


// EDIT CAMPGROUND ROUTE
router.get ("/campgrounds/:id/edit", middleware.checkOwnership,function(req,res){
    Campground.findById(req.params.id).populate("comments").exec( function(err,foundCampground){
        if(err){
             req.flash("error","Problem with request");
        };
        res.render("campgroundedit",{campground:foundCampground});
    });
});


// UPDATE CAMPGROUND ROUTE

router.put ("/campgrounds/:id", middleware.checkOwnership,function(req,res){
     Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground){
      
      
   if(err){
         res.redirect("/campgrounds");
   }else {
       res.redirect("/campgrounds/"+req.params.id);
   }
     }); 
});
   

//Destroy - Delete


router.delete ("/campgrounds/:id",  middleware.checkOwnership,function(req,res){
    
         Campground.findByIdAndRemove(req.params.id, function(err,data ){
             if(err){
            //console.log(err);
            console.log("Error with campground destroy");
                res.redirect("/campgrounds");
            } else {
                res.redirect("/campgrounds");
            }
        });
});


// //-------------------------------------------------------------------------------
// //middleware goes here
// //-------------------------------------------------------------------------------


// function isLoggedIn(req,res,next){
//     if(req.isAuthenticated()){
//         return next();
//     }
//     res.redirect("/login");
// }//End of isLoggedIn


// function checkCommentOwnership(req,res,next){
//   if(req.isAuthenticated()){
//           Comment.findById(req.params.comment_id, function(err,foundComment){
//             if(err){
//               res.redirect("back");                
//             }else{
//                 if (foundComment.author.id.equals(req.user._id)){  //Special Monogoose Compare
//                   next();
//                   //res.render("campgroundedit",{campground:foundCampground});
//                 } else {
//                   res.redirect("back");
//                   //res.send("You do not have permission");
//                 }
//             }
//         });
//      }else{
//           res.redirect("back");
//      }
// }//End of checkCommentOwnership


// function checkOwnership(req,res,next){
//      if(req.isAuthenticated()){
//           Campground.findById(req.params.id).populate("comments").exec( function(err,foundCampground){
//             if(err){
//               res.redirect("back");                
//             }else{
//                 if (foundCampground.author.id.equals(req.user._id)){         //Special Monogoose Compare
//                   next();
//                   //res.render("campgroundedit",{campground:foundCampground});
//                 } else {
//                   res.redirect("back");
//                   //res.send("You do not have permission");
//                 }
//             }
//         });
//      }else{
//           res.redirect("back");
//      }
// }//End of checkOwnership





module.exports =router;