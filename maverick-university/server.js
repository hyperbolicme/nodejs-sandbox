const express = require("express");
const MongoClient = require("mongodb").MongoClient;

// Initialize Express
const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));

const title = "Maverick University directory";

// Route /search-result
app.post("/search-result", function(req, resp) {
    console.log(`Received request ${req.url}`);

    let url = "mongodb://localhost:27017/";
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        var dbo = db.db("studentdb");
        var query = { }; // no filter

        dbo.collection("students").find(query).toArray(function (err, result) {
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

// app.post("/", function (req, resp) {

// }

var port = 3001;
app.listen(port, function() { console.log(`Listening on ${port}`)});