const express = require("express");
const session = require("express-session");
const MongoClient = require("mongodb").MongoClient;
const ObjectID = require('mongodb').ObjectID;
const bodyParser = require("body-parser");
const uuid = require("uuid/v4");
const FileStore = require("session-file-store")(session);
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const url = require("url");


const mongoAdmin = "akira";
const mongoAdminPass = "welcomehome";
const mongoUrl = `mongodb+srv://${mongoAdmin}:${mongoAdminPass}@clustermaverick-idrtx.mongodb.net/test?retryWrites=true&w=majority`;
// const mongoUrl = `mongodb://localhost:27017`;
const mongoDirectoryDb = "studentdb";
const mongoUserDirectoryCollection = "fa_testdata_users";
// const mongoDirectoryNormCollection = "fa_testdata_denormalized";
const mongoDirectoryNormCollection = "fa_testdata_denormalized2";
const mongoCredsCollection = "usercreds";

var nReturned = 0;
var executionTimeMillis = 0;

// Mongodb querying logic is mostly common except
// the call back in .toArray() / what you do with result.
function queryDb(dbname, collectionName, query, callback) {
    MongoClient.connect(mongoUrl,
        function (err, db) {
            // call the database to find the user based on their username or email address
            if (err) {
                console.log("Mongo connect failed. Encountered db err.");
                return (err);
            }

            // Connect
            var dbo = db.db(dbname);

            // Query username and password
            console.log(`Query on collection ${collectionName}: ${JSON.stringify(query)}`)
            let qresult, stats;

            if (0 && collectionName === mongoDirectoryNormCollection) {
                console.log("Querying by aggregate. ");
                qresult = dbo.collection(collectionName).aggregate([
                    { $match: query }
                ]);
                // stats = dbo.collection(collectionName).explain().aggregate([
                //     { $unwind: "$all_circuits" },
                //     { $match: query }
                // ]);
            }
            else {
                qresult = dbo.collection(collectionName).find(query);
                stats = dbo.collection(collectionName).find(query);
                stats.explain(function (err, executionStats) {
                    nReturned = executionStats.executionStats.nReturned;
                    executionTimeMillis = executionStats.executionStats.executionTimeMillis;
                    console.log(`[STATS] Query ${JSON.stringify(query)} returned ${nReturned} in ${executionTimeMillis} ms.`);
                });
            }
            // pass the intended callback to result.
            qresult.toArray(callback);
            // db.close();

            // "executionStats"
            // qresult = dbo.collection(collectionName).find(query);
            // stats.explain(function (err, executionStats) {
            //     nReturned = executionStats.executionStats.nReturned;
            //     executionTimeMillis = executionStats.executionStats.executionTimeMillis;
            //     console.log(`[STATS] Query ${JSON.stringify(query)} returned ${nReturned} in ${executionTimeMillis} ms.`);
            // });

        });
};


// Configure LocalStrategy to define how user verification is done.
passport.use(new LocalStrategy(
    { usernameField: "email" },
    function (email, password, done) {
        console.log("Inside local strategy callback");
        let query = { username: email, password: password };
        queryDb(mongoDirectoryDb,
            mongoCredsCollection,
            query,
            function (err, result) {
                console.log(`Query result: ${JSON.stringify(result)}`);
                if (err) {
                    console.log("Local strategy failed.");
                    return done(err);
                }
                if (result.length === 0) {
                    console.log("Local strategy returns FALSE. No creds match.");
                    return done(null, false);
                }
                console.log(`Local strategy returned true. ${JSON.stringify(result[0])}`);
                return done(null,
                    {
                        id: result[0]._id,
                        email: result[0].username,
                        password: result[0].password
                    });
            });
    }));

// tell passport how to serialize and deserialize the user
passport.serializeUser(function (user, done) {
    console.log('Inside serializeUser callback. User id is saved to the session file store here')
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    console.log('Inside deserializeUser callback')
    console.log(`The user id passport saved in the session file store is: ${id}`)

    // Query id in db
    let query = { _id: ObjectID(id) };
    queryDb(mongoDirectoryDb,
        mongoCredsCollection,
        query,
        function (err, result) {
            console.log(`Query result: ${JSON.stringify(result)}`);
            if (err) return done(err);

            if (result.length === 0) {
                console.log("Local strategy returns FALSE. No creds match.");
                return done(null, false);
            }
            console.log(`Local strategy returned true. ${JSON.stringify(result[0])}`);
            return done(null,
                {
                    id: result[0]._id,
                    email: result[0].username,
                    password: result[0].password
                });
        });
});

// Create express server
const app = express();

// Initialize server middleware
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    genid: function (req) {
        console.log("Inside session middleware");
        console.log(req.sessionID);
        return uuid();
    },
    store: new FileStore(),
    secret: "tv cat",
    resave: false,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

const title = "Maverick University directory";

// Start server
const port = 3000;
app.listen(port, function () { console.log(`Listening on ${port}`) });

//// Routes and other functions ////
// Route / GET
app.get("/", function (req, resp) {
    console.log(`Received request ${req.url}`);
    console.log("Inside the / callback function");
    console.log(req.sessionID);
    let username = req.isAuthenticated() ? req.user.email : "";

    if (username != "") {
        resp.render("Directory")
    }
    else {
        resp.render("index_mat", {
            title: title,
            username: username
        });
    }

});

// Route /search-result GET and POST
app.get("/search-result", function (req, resp) {
    resp.redirect("/");
});



app.post("/search-result",
    function (req, resp) {
        console.log(`Received request ${req.url}`);
        // let username = req.isAuthenticated() ? req.user.email : "";
        let username = "";
        if (req.isAuthenticated()) {
            username = req.user.email;
        } else {
            resp.render("search-result_mat", {
                title: title,
                queryResult: {},
                username: ""
            });
            return;
        }

        console.log(`Received ${JSON.stringify(req.body)} from client.`);


        // Get filter from req object using only non empty values
        // entered by user
        // Use regex. "i" is case insensitive search
        let query = {};

        req.body.ul_friend_name !== "" ?
            query["display_name"] = { $regex: `${req.body.ul_friend_name}`, $options: "i" } : {};
        req.body.ul_email !== "" ?
            query["email_id"] = { $regex: `${req.body.ul_email}`, $options: "i" } : {};
        req.body.ul_location !== "" ?
            query["display_city"] = { $regex: `${req.body.ul_location}`, $options: "i" } : {};
        req.body.ul_location_lat !== "" ?
            query["latitude"] = { $regex: `${req.body.ul_location_lat}`, $options: "i" } : {};
        req.body.ul_location_lng !== "" ?
            query["longitude"] = { $regex: `${req.body.ul_location_lng}`, $options: "i" } : {};
        req.body.ul_designation !== "" ?
            query["current_designation"] = { $regex: `${req.body.ul_designation}`, $options: "i" } : {};
        req.body.city_ids !== "" ?
            query["city_id"] = { $regex: `${req.body.city_ids}`, $options: "i" } : {};
        req.body.ul_inst_name !== "" ?
            query["institution_name"] = { $regex: `${req.body.ul_inst_name}`, $options: "i" } : {};
        req.body.ul_sector !== "" ?
            query["industry_type_id"] = { $regex: `${req.body.ul_sector}`, $options: "i" } : {};

        if (req.body.specialization_list !== undefined && req.body.specialization_list.length !== 0) {
            // let x = {}, y = {};
            // x["specialization_id"] = { $in: req.body.specialization_list };
            // y["circuit_id_merged"] = x;
            // query["all_circuits"] = y;

            let specialization_list_regex = [];
            for (let i = 0; i < req.body.specialization_list.length; i++) {
                specialization_list_regex[i] = (new RegExp(req.body.specialization_list[i]));
            }

            console.log(`Spec regex list: ${specialization_list_regex} `)
            // query["all_circuits"] = { "circuit_id_merged": { "specialization_id": { $in: specialization_list_regex } } };
            query["specialization_id"] = { $in: specialization_list_regex } ;

        };

        if (req.body.batch_list !== undefined && req.body.batch_list.length !== 0) {
            let batch_list_regex = [];
            for (let i = 0; i < req.body.batch_list.length; i++) {
                batch_list_regex[i] = (new RegExp(req.body.batch_list[i])); 
            }

            console.log(`Batch regex list: ${batch_list_regex} `);
            // query["all_circuits"] = { "circuit_id_merged": { "batch": { $in: batch_list_regex } } };
            // query["all_circuits.circuit_id_merged.batch"] = { $in: batch_list_regex } ;
            // query["batch"] = { $in: batch_list_regex } ;
            query["batch"] = { $in: batch_list_regex } ;
        }

        console.log(`Query is ${JSON.stringify(query)}`);

        queryDb(mongoDirectoryDb,
            mongoDirectoryNormCollection,
            query,
            function (err, result) {
                if (err) {
                    throw err;
                    resp.end();
                }
                console.log(`Found ${result.length} entries.`);

                resp.render("search-result_mat", {
                    title: title,
                    queryResult: result,
                    username: username,
                    timeDiff: executionTimeMillis
                });
            });
 

    });

// Route /session GET
app.get("/session", function (req, resp) {
    console.log(`Received request ${req.url}`);
    console.log("Inside the /session callback function");
    console.log(req.sessionID);
    resp.send("Trying out sessions");
});

// Route /login GET and POST
app.get("/login", function (req, resp) {
    console.log(`Received request GET ${req.url}`);
    console.log("Inside the /login GET callback function");
    console.log(req.sessionID);
    console.log("Enter login credentials...");
    resp.render("login_mat", { "title": title, "username": req.isAuthenticated() ? req.user.email : "" });
});

app.post('/login',
    passport.authenticate('local',
        {
            successRedirect: '/login2',
            failureRedirect: '/login'
        }));

// Route to render home page with right url after login
app.get("/login2", function (req, resp) {
    resp.redirect("/");
})


// Route /logout GET
app.get("/logout", function (req, resp) {
    console.log(`Received request GET ${req.url}`);
    console.log("Inside the /logout GET callback function");
    console.log(req.sessionID);
    console.log(JSON.stringify(req.body));
    req.logout();
    console.log("logged out");
    resp.redirect("/logout2");
})

// Route to render home page  with right url after logout
app.get("/logout2", function (req, resp) {
    resp.redirect("/");
})

// Route /user?id=<id> to show user details
// app.get("/user/:id", function(req, resp){
app.get("/user", function (req, resp) {

    console.log(`id = ${req.query.id}`);

    queryDb(mongoDirectoryDb,
        mongoUserDirectoryCollection,
        { "user_id": parseInt(req.query.id) },
        function (err, result) {
            console.log(result);
            resp.render("user_profile_view_mat", {
                title: title,
                username: req.isAuthenticated() ? req.user.email : "",
                user_profile: result[0]
            });
        });

});
