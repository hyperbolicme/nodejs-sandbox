const express = require("express");
const session = require("express-session");
const MongoClient = require("mongodb").MongoClient;
const bodyParser = require("body-parser");
const uuid = require("uuid/v4");
const FileStore = require("session-file-store")(session);

// Create express server
const app = express();

// Initialize server middleware
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(session({
    genid: function (req) {
            console.log("---------");
            console.log("Inside session middleware");
            console.log(req.sessionID);
            return uuid();
        },
    store: new FileStore(),
    secret: "tv cat",
    resave: false,
    saveUninitialized: true
}));

const title = "Maverick University directory";


// Route /search-result-qa POST
app.post("/search-result-qa", function(req, resp) {
    console.log(`Received request ${req.url}`);

    let url = "mongodb://localhost:27017/";
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        var dbo = db.db("studentdb");
        var query = { }; // no filter

        dbo.collection("students").find(query).sort({student_id: 1}).toArray(function (err, result) {
            resp.render("search-result", { 
                                    title: title, 
                                    queryResult: result
                                });
            if (err) throw err;
        });
        db.close();
    });
});

// Route /session-qa GET
app.get("/session-qa", function (req, resp) {
    console.log(`Received request ${req.url}`);

    console.log("Inside the homepage callback function");
    console.log(req.sessionID);
    resp.send("Trying out sessions");
});

// Route /login-qa GET and POST
app.get("/login-qa", function (req, resp) {
    console.log(`Received request GET ${req.url}`);

    console.log("Inside the /login-qa GET callback function");
    console.log(req.sessionID);
    console.log("Enter login credentials..."); 
    resp.render("login", {"title": title});
});

app.post("/login-qa", function (req, resp) {
    console.log(`Received request POST ${req.url}`);

    console.log("Inside the /login-qa POST callback function");
    console.log(req.body);
    resp.end("You will be logged in soon.");
});


// Route /search-result POST
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

// Route / GET
app.get("/", function(req, resp){
    resp.render("index", {
        title: title
    });

});

var port = 3001;
app.listen(port, function() { console.log(`Listening on ${port}`)});