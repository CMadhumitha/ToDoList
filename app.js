//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

require('dotenv').config();

// const date = require(__dirname + "/date.js");

mongoose.set('strictQuery', true);

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

mongoose.connect(process.env.ATLAS_URL,{
  useNewUrlParser: true,
  useUnifiedTopology: true
});

//creating Schema
const itemsSchema = {
  name: String
};

//Creating Mogoose Model
const Item = mongoose.model("Item",itemsSchema);

//Creating Documents
const item1 = new Item({
  name:"Welcome to your todolist!"
});

const item2 = new Item({
  name:"Hit the + button to add a new item."
});

const item3 = new Item({
  name:"<-- Hit this to delete an item."
});

//creating arr and inserting 
const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

// const day = date.getDate(); 
  Item.find({}, function(err, foundItems){
    if(foundItems.length === 0){
      Item.insertMany(defaultItems, function(err){
        if(err){
          console.log(err);
        } else {
          console.log("Successfully saved default items to DB.");
        }
      });
      res.redirect("/");
      } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
  
    }
  });
});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);
  
  if(customListName === "Favicon.ico"){
    return;
  }
  List.findOne({name: customListName}, function(err, foundList) {
    if(!err){
      if(!foundList){
        // create New List
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save(function(err) {

          if(!err){

            res.redirect("/" + customListName);

          }
        });
        // list.save();
        // res.redirect("/" + customListName);
      } else {
        // Show Existing List
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items} )
      }
    }
  });
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName === "Today"){
    // item.save();
    item.save().then(function(_) {

      res.redirect("/");
  
    }).catch(function(err) {
  
      console.log(err);
  
    });
    // res.redirect("/");
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
    
  
});

app.post("/delete", function(req, res) {
  const checkedboxItem = req.body.checkbox;
  const listName = req.body.listName;
  console.log(listName);

  if (listName === "Today") {
      Item.findByIdAndRemove(checkedboxItem, function(err) {
          if (!err) {
              console.log("Successfully deleted checked item.");
              res.redirect("/");
          }
      });
  } else {
      List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedboxItem } } }, function(err, foundList) {
          if (!err) {
              res.redirect("/" + listName);
          }
      });
  }
});

app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started succesfully");
}); 
