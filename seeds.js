var mongoose = require("mongoose");
var Campground = require("./models/campground");
var Comment = require("./models/comment");



//  var campgrounds =[
//         {name:"Salmon Creek",image:"https://farm5.staticflickr.com/4420/37403014592_c5f5d37906.jpg",description:"TTTTT"},
//         {name:"Granite Hill",image:"https://farm4.staticflickr.com/3211/3062207412_03acc28b80.jpg",description:"TTTTT"},
//          {name:"Salmon Creek",image:"https://farm5.staticflickr.com/4420/37403014592_c5f5d37906.jpg",description:"TTTTT"},
//         {name:"Granite Hill",image:"https://farm4.staticflickr.com/3211/3062207412_03acc28b80.jpg",description:"TTTTT"},
//          {name:"Salmon Creek",image:"https://farm5.staticflickr.com/4420/37403014592_c5f5d37906.jpg",description:"TTTTT"},
//         {name:"Granite Hill",image:"https://farm4.staticflickr.com/3211/3062207412_03acc28b80.jpg",description:"TTTTT"},
//          {name:"Salmon Creek",image:"https://farm5.staticflickr.com/4420/37403014592_c5f5d37906.jpg",description:"TTTTT"},
//         {name:"Granite Hill",image:"https://farm4.staticflickr.com/3211/3062207412_03acc28b80.jpg",description:"TTTTT"},
//          {name:"Salmon Creek",image:"https://farm5.staticflickr.com/4420/37403014592_c5f5d37906.jpg",description:"TTTTT"},
//         {name:"Granite Hill",image:"https://farm4.staticflickr.com/3211/3062207412_03acc28b80.jpg",description:"TTTTT"},
//         {name:"Mountain Goat's Rest",image:"https://farm4.staticflickr.com/3805/9667057875_90f0a0d00a.jpg",description:"TTTTT"}
//         ];



var data = [
      {name:"Salmon Creek",image:"https://farm5.staticflickr.com/4420/37403014592_c5f5d37906.jpg", description:"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum"},
      {name:"Granite Hill",image:"https://farm4.staticflickr.com/3211/3062207412_03acc28b80.jpg", description:"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum"},
      {name:"Salmon Creek",image:"https://farm5.staticflickr.com/4420/37403014592_c5f5d37906.jpg", description:"Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum"}
    ];


function seedDB(){
    Campground.remove({}, function(err){
    if(err){
        console.log(err);
    } 

        console.log("removed all camgrounds");
//         data.forEach(function(seed){
//         Campground.create(seed,function(err, campground){
//         if(err){
//             console.log(err);
//         }else{
//             console.log("added a campground");
//             Comment.create(
//                 {
//                     text:"This place is great",
//                     author:"Henry"
//                 }, function(err, comment){
//                     if(err){
//                         console.log(err);
//                     } else {
//                     campground.comments.push(comment);
//                     campground.save();
//                     console.log("created new comment");
//                     }
                    
//                 });
//             }
//         });
//   });
});
//add a few comments
}






module.exports=seedDB;