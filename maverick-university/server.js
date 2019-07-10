const express = require("express");
const MongoClient = require("mongodb").MongoClient;
const bodyParser = require("body-parser");

// Initialize Express
const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));

const title = "Maverick University directory";

// Route /search-result-qa
app.post("/search-result-qa", function(req, resp) {
    console.log(`Received request ${req.url}`);

    let url = "mongodb://localhost:27017/";
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        var dbo = db.db("studentdb");
        var query = { }; // no filter

        dbo.collection("students").find(query).sort({student_id: 1}).toArray(function (err, result) {
        // dbo.collection("students").find(query).sort({ name: 1 }).toArray(function (err, result) {
            resp.render("search-result", { 
                                    title: title, 
                                    queryResult: result
                                });
            if (err) throw err;
        });
        db.close();
    });
});

// Route /search-result
app.post("/search-result", function (req, resp) {
    console.log(`Received request ${req.url}`);

    let url = "mongodb://localhost:27017/";
    console.log(req.body);
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        var dbo = db.db("studentdb");
        
        // Get filter from req object using only non empty values
        // entered by user
        var query = {};
        if (req.body.id !== "")
            query.student_id = parseInt(req.body.id);
        if (req.body.name !== "") 
            query.name = { $regex: `${req.body.name}`, $options: "i" }; 
        if (req.body.course !== "")
            query.course = { $regex: `${req.body.course}`, $options: "i" };
        
        console.log("Query is " + JSON.stringify(query));
        dbo.collection("students").find(query).sort({ student_id: 1 }).toArray(function (err, result) {            
            console.log(result);
            
            resp.render("search-result", {
                title: title,
                queryResult: result
            });
            if (err) throw err;
        });
        db.close();
    });
});


app.get("/", function(req, resp){
    resp.render("index", {
        title: title
    });

});

var port = 3001;
app.listen(port, function() { console.log(`Listening on ${port}`)});