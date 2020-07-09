const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const date = require("./date.js");

const app = express();
app.set('view engine','ejs');

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"))

mongoose.connect("mongodb://localhost:27017/toDoListDb",{ useNewUrlParser: true ,useUnifiedTopology: true});

const userSchema = new mongoose.Schema({
    email : String,
    password : String
});

const User = new mongoose.model("user",userSchema);

const itemsSchema = {
    name: String
}

const Item = mongoose.model("item",itemsSchema);

const item1 = new Item({
    name : "welcome to do your list"
});

const item2 = new Item({
    name : "Hit + button to add new item"
});

const item3 = new Item({
    name : "select the checkbox to delete an item"
});

const defaultItems = [item1,item2,item3];

const listSchema = {
    name:String,
    items:[itemsSchema]
}

const List = mongoose.model("list",listSchema);

app.get("/",(req,res) =>
{
    let day = date();
    Item.find({},(err,foundItems) => {
        if(foundItems.length === 0)
        {
            Item.insertMany(defaultItems,(err)=>
            {
               if(err)
                console.log(err)
               else
                console.log("successfully saved")
            });
            res.redirect("/");
        }
        else
        {
            res.render('list',{titleList:day, newListItem: foundItems});
        }
    })

});

app.get("/:customListName",(req,res) => {
    const listName = _.capitalize(req.params.customListName);

    List.findOne({name:listName},(err,found) => {
        if(!err){
            if(!found)
            {
                 const list = new List({
                    name:listName,
                    items:defaultItems
                });
                list.save();
                res.redirect("/" + listName);
            }
            else{
                res.render("list",{titleList:found.name, newListItem: found.items})
            }
       }

    })
})


app.post("/",(req,res) =>{
    let today = date();
    const listName = req.body.title;
    const item = new Item ({
        name : req.body.newItem
    })
    if(listName === today)
    {
        item.save()
        res.redirect("/");
    }
    else{
        List.findOne({name:listName},(err,found) => {
            found.items.push(item);
            found.save();
            res.redirect("/" + listName);
        })
    }

});

app.post("/delete",(req,res) => {
    const checkedItemId = req.body.id;
    const listName = req.body.listName;
    if(listName === date()){
        Item.findByIdAndRemove(checkedItemId,(err) => {
            if(!err){
                res.redirect("/")
            }
        });
    }
    else{
        List.findOneAndUpdate({name:listName},{$pull: {items:{_id:checkedItemId}}}, (err,foundList) =>{
            if(!err){
                console.log("successfully deleted");
                 res.redirect("/" + listName);
            }
        });
     }
});

app.post("/update",(req,res) => {
    console.log(req.body);
    if(req.body.list === date()){
        Item.findByIdAndUpdate(req.body.textId,{$set: {name:req.body.taskName}},(err) => {
            if(!err){
                res.redirect("/")
            }
        });
    }
    else
              {
                  List.findOne({name:req.body.list},(err,found) =>{
                     found.items.forEach((element) => {
                          console.log(element._id);
                          console.log(req.body.textId)
                          console.log(element._id === req.body.textId);
                          if(element._id === req.body.textId)
                          {
                              console.log("success");
                              element.name = req.body.taskName;
                          }
                     })
                  })
    }
})

app.listen(5000,()=> console.log("server started and running on port 5000"));