
var express=require("express");
var router=express.Router();
var passport=require("passport");
var Campground=require("../models/campground")
var Comment=require("../models/comment")
var middleware=require("../middleware")   //index.js is assumed

//==============================================
//Comment Routes
//==============================================
//New Comment


router.get ("/campgrounds/:id/comments/new", middleware.isLoggedIn,function(req,res){
    Campground.findById(req.params.id, function (err, campground){
        if(err){
             console.log(err);
        }else {
            res.render("newcomment",{campground:campground});
        }
    });
});


///Create Comment

router.post ("/campgrounds/:id/comments", middleware.isLoggedIn,function(req,res){
    // lookup campground using id
    //console.log(req.params.id);
    
    Campground.findById(req.params.id, function (err, campground){
        if(err){
            console.log(err);
            res.redirect("/campgrounds");
        }else {
            //create new comment
            Comment.create(req.body.comment, function(err,comment){
             if(err){
                  req.flash("error","Something went wrong!");
                console.log(err);
            }else {
                //add user and id to comment
              comment.author.id=req.user._id;
              comment.author.username=req.user.username;
              comment.save();
               
                campground.comments.push(comment);
                campground.save();
                 req.flash("success","Successfully created comment!");
                res.redirect("/campgrounds/"+campground._id);
            }
        });
    }
  });
});




//__________________________________________________________


// EDIT COMMENT ROUTE
router.get ("/campgrounds/:id/comments/:comment_id/edit",  middleware.checkCommentOwnership, function(req,res){
    Comment.findById(req.params.comment_id, function(err, foundComment){
        if(err){
            res.redirect("back");
        } else{
            res.render("commentedit",{campground_id:req.params.id,comment:foundComment});          
        }
        });
});


// UPDATE COMMENT ROUTE

router.put ("/campgrounds/:id/comments/:comment_id", middleware.checkCommentOwnership,function(req,res){

      Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedCampground){
        if (err){
            res.redirect("back");
        } else {
          res.redirect("/campgrounds/"+req.params.id);
        }
            
      });
      });
      

//Destroy - Delete


router.delete ("/campgrounds/:id/comments/:comment_id",  middleware.checkCommentOwnership, function(req,res){
    
         Comment.findByIdAndRemove(req.params.comment_id, function(err,data ){
             if(err){
            //console.log(err);
            console.log("Error with campground destroy");
                 res.redirect("/campgrounds/"+req.params.id);
            } else {
                 req.flash("success","Comment deleted");
                 res.redirect("/campgrounds/"+req.params.id);
            }
        });
});


//-------------------------------------------------------------------------------
//middleware goes here
//-------------------------------------------------------------------------------


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