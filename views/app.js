const express = require("express");
const body_parser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(body_parser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://madoo88:c0MGeICwXVO6pLPt@cluster0.k8mvscp.mongodb.net/todolistDB", { useNewUrlParser: true, useUnifiedTopology: true });

const taskSchema = {
  name: String
};

const Task = mongoose.model("Task", taskSchema);

const taskOne = new Task({
  name: "Read Quran"
});
const taskTwo = new Task({
  name: "Learn Web Dev"
});
const taskThree = new Task({
  name: "Learn AI/ML"
});
const taskFour = new Task({
  name: "Workout"
});

const defaultTasks = [taskOne, taskTwo, taskThree, taskFour];

const listSchema = {
  name: String,
  tasks: [taskSchema]
};

const List = mongoose.model("List", listSchema);
let day = date();

app.get("/", function (req, res) {
  Task.find({}).
    then((result) => {
      if (result.length === 0) {
        Task.insertMany(defaultTasks);
        res.redirect("/");
      }
      res.render("list", { listTitle: day, newtasks: result });
    })
    .catch((error) => { console.log(error) });
});


app.post("/", function (req, res) {
  const newtask = req.body.newtask;
  const listName = req.body.listType;

  const task = new Task({ name: newtask });

  if (listName === day) {
    task.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName })
      .then((foundList) => {
        foundList.tasks.push(task);
        foundList.save();
        res.redirect("/" + listName);
      })
      .catch((error) => {
        console.log(error);
      })
  }
});

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }
  ).then((result) => {
    if (!result) {
      const list = new List({
        name: customListName,
        tasks: defaultTasks
      });
      list.save();
      res.redirect("/" + customListName);
    } else {
      res.render("list", { listTitle: result.name, newtasks: result.tasks });
    }
  }).catch((error) => {
    console.log(error);
  })

});


app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === day) {
    Task.findByIdAndRemove(checkedItemId).then((result) => {
      console.log("Removed item: \n" + result);
    }).catch((error) => {
      console.log(error);
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate({ name: listName }, { $pull: { tasks: { _id: checkedItemId } } })
      .then((result) => {
        console.log("Deleted item: \n" + result);
        res.redirect("/" + listName);
      })
      .catch((error) => {
        console.log(error);
      })
  }
})


app.listen(3000, function () {
  console.log("Server running on port 3000");
});
