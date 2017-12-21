var Campground=require("../models/campground")
var Comment=require("../models/comment")
//all the middleware goes here
var middlewareObj={};

middlewareObj.checkOwnership=function(req,res,next){
     if(req.isAuthenticated()){
          Campground.findById(req.params.id).populate("comments").exec( function(err,foundCampground){
            if(err){
                 req.flash("error","Item not found!");
               res.redirect("back");                
            }else{
                if (foundCampground.author.id.equals(req.user._id)){         //Special Monogoose Compare
                  next();
                   //res.render("campgroundedit",{campground:foundCampground});
                } else {
                     req.flash("error","You don't have permisison!");
                   res.redirect("back");
                  //res.send("You do not have permission");
                }
            }
        });
     }else{
          req.flash("error","You must be logged in");
          res.redirect("back");
     }
};//End of checkOwnership

middlewareObj.checkCommentOwnership=function(req,res,next){
  if(req.isAuthenticated()){
          Comment.findById(req.params.comment_id, function(err,foundComment){
            if(err){
                  req.flash("error","Item not found!");
               res.redirect("back");                
            }else{
                if (foundComment.author.id.equals(req.user._id)){  //Special Monogoose Compare
                  next();
                   //res.render("campgroundedit",{campground:foundCampground});
                } else {
                      req.flash("error","You don't have permisison!");
                   res.redirect("back");
                  //res.send("You do not have permission");
                }
            }
        });
     }else{
          req.flash("error","You must be logged in");
          res.redirect("back");
     }
};//End of checkCommentOwnership


middlewareObj.isLoggedIn=function(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error","You must be logged in");
    res.redirect("/login");
};//End of isLoggedIn



module.exports=middlewareObj;


// //Old functions



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