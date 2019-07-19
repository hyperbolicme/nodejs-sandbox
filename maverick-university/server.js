const express = require("express");
const session = require("express-session");
const MongoClient = require("mongodb").MongoClient;
const ObjectID = require('mongodb').ObjectID;
const bodyParser = require("body-parser");
const uuid = require("uuid/v4");
const FileStore = require("session-file-store")(session);
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

const mongoAdmin = "akira";
const mongoAdminPass = "welcomehome";
const mongoUrl = `mongodb+srv://${mongoAdmin}:${mongoAdminPass}@clustermaverick-idrtx.mongodb.net/test?retryWrites=true&w=majority`;
const mongoDirectoryDb = "studentdb";
const mongoStudentCollection = "students";
const mongoCredsCollection = "usercreds";

passport.use(new LocalStrategy(
    {usernameField: "email"},
    function(email, password, done){
        console.log("Inside local strategy callback");
        MongoClient.connect(mongoUrl, 
            function (err, db) {
                // here is where you make a call to the database
                // to find the user based on their username or email address
                if (err){
                    console.log("Local strategy failed. Encountered db err.");
                    return done(err);
                }      

                // Connect
                var dbo = db.db(mongoDirectoryDb);

                // Query username and password
                let query = {username: email, password: password};
                console.log(`Query on collection ${mongoCredsCollection}: ${JSON.stringify(query)}`)
                let qresult = dbo.collection(mongoCredsCollection).find(query);
                qresult.toArray(function (err, result) {            
                    console.log(`Query result: ${JSON.stringify(result)}`);
                    if (err){
                        console.log("Local strategy failed.");
                        return done(err);
                    }      
                    if(result.length === 0){
                        console.log("Local strategy returns FALSE. No creds match.");
                        return done(null, false);
                    } 
                    console.log(`Local strategy returned true. ${JSON.stringify(result[0])}`);
                    return done(null, 
                        {id: result[0]._id, 
                            email: result[0].username, 
                            password: result[0].password});
    
                });
                db.close();
            });
}));

// tell passport how to serialize the user
passport.serializeUser( function(user, done) {
    console.log('Inside serializeUser callback. User id is saved to the session file store here')
    done(null, user.id);
});

// input - db url, collection name, query in json
// output - array or results.
//   queryDBCollection()

passport.deserializeUser( function(id, done) {
    console.log('Inside deserializeUser callback')
    console.log(`The user id passport saved in the session file store is: ${id}`)

    MongoClient.connect(mongoUrl, 
        function (err, db) {
            if (err) return done(err);
            
            // Connect
            var dbo = db.db(mongoDirectoryDb);

            // Query id in db
            let query = {_id: ObjectID(id) };
            console.log(`Query on collection ${mongoCredsCollection}: ${JSON.stringify(query)}`)
            let qresult = dbo.collection(mongoCredsCollection).find(query);
            qresult.toArray(function (err, result) {            
                console.log(`Query result: ${JSON.stringify(result)}`);
                if(err) return done(err);

                if(result.length === 0){
                    console.log("Local strategy returns FALSE. No creds match.");
                    return done(null, false);
                } 
                console.log(`Local strategy returned true. ${JSON.stringify(result[0])}`);
                return done(null, 
                    {id: result[0]._id, 
                        email: result[0].username, 
                        password: result[0].password});
            });
            db.close();
        });
    
});
  
// Create express server
const app = express();

// Initialize server middleware
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
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
var port = 3000;
app.listen(port, function() { console.log(`Listening on ${port}`)});

//// Routes and other functions ////
// Route / GET
app.get("/", function(req, resp){
    console.log(`Received request ${req.url}`);
    console.log("Inside the / callback function");
    console.log(req.sessionID);
    // let username = req.isAuthenticated() ? req.user.email : "";
    let username = ""; 
    if( req.isAuthenticated() ){
        console.log("Authenticated user..")
        username = req.user.email;
    }
    resp.render("index", {
        title: title,
        username: username
    });
});

app.get("/search-result", function (req, resp) {
    resp.redirect("/");
});
// Route /search-result POST
app.post("/search-result", 
    function (req, resp) {
        console.log(`Received request ${req.url}`);
        // let username = req.isAuthenticated() ? req.user.email : "";
        let username = "";
        if( req.isAuthenticated() ){
            username = req.user.email;
        } else {
            resp.render("search-result", {
                title: title,
                queryResult: {},
                username: ""
            });
            return;
        }

        console.log(req.body);
        MongoClient.connect(mongoUrl, 
            function (err, db) {
                if (err) throw err;
                var dbo = db.db(mongoDirectoryDb);

                // Get filter from req object using only non empty values
                // entered by user
                let query = {};
                // id is read as text
                if (req.body.id !== "")
                    query.student_id = parseInt(req.body.id);
                // Use regex. "i" is case insensitive search
                if (req.body.name !== "") 
                    query.name = { $regex: `${req.body.name}`, $options: "i" }; 
                if (req.body.course !== "")
                    query.course = { $regex: `${req.body.course}`, $options: "i" };                
                console.log(`Query is ${JSON.stringify(query)}`); 

                // Query collection and sort by student ID. Convert to array
                let qresult = dbo.collection(mongoStudentCollection).find(query);
                let qresultSorted = qresult.sort({ student_id: 1 });
                qresultSorted.toArray(function (err, result) {            
                    console.log(result);
                    
                    resp.render("search-result", {
                        title: title,
                        queryResult: result,
                        username: username
                    });
                    if (err) throw err;
                });
                db.close();
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
    resp.render("login", {"title": title, "username": req.isAuthenticated() ? req.user.email : ""});
});

app.post('/login', 
   passport.authenticate('local', 
       { successRedirect: '/',
         failureRedirect: '/login' }));

/* Default error page 401 
*/         
// app.post('/login', 
//     passport.authenticate('local'), 
//     function(req, resp) { 
//         resp.redirect("/");
//     }
// );


/* Using a custom authentication callback. 
   gives access to req and resp
   user's responsibility to call req.login() 
*/
// app.post("/login", function (req, resp, next) {
//     console.log(`Received request POST ${req.url}`);
//     console.log("Inside the /login POST callback function");
//     console.log(req.sessionID);
//     console.log(JSON.stringify(req.body));
//     if (req.body.email === "" || req.body.password === ""){
//         return resp.redirect("/login");
//     }

//     passport.authenticate("local", function(err, user, info) {
//         console.log("Inside passport.authenticate() callback");
//         console.log(`req.session.passport: ${JSON.stringify(req.session.passport)}`);
//         console.log(`req.user: ${JSON.stringify(req.user)}`);
//         req.login(user, function(err) {
//             console.log('Inside req.login() callback');
//             if(err) {return next(err);}
//             if(!user){ return resp.redirect("/login");}
//             console.log(`req.session.passport: ${JSON.stringify(req.session.passport)}`);
//             console.log(`req.user: ${JSON.stringify(req.user)}`);
//             console.log(`User ${req.user.email} authenticated & logged in!`);
//             return resp.redirect("/login2");
//         })
//     })(req, resp, next);
// });

// // Route to render home page with right url after login
// app.get("/login2", function(req, resp){
//     resp.redirect("/");
// })


// Route /logout GET
app.get("/logout", function(req, resp){
    console.log(`Received request GET ${req.url}`);
    console.log("Inside the /logout GET callback function");
    console.log(req.sessionID);
    console.log(JSON.stringify(req.body));
    req.logout();
    console.log("logged out");
    // resp.render("logout", {title: title});
    resp.redirect( "/logout2");    
})

// Route to render home page  with right url after logout
app.get("/logout2", function(req, resp){
    // resp.render("index", {title: title, username: ""});
    resp.redirect("/");
})


