const express = require("express");
const session = require("express-session");
const MongoClient = require("mongodb").MongoClient;
const bodyParser = require("body-parser");
const uuid = require("uuid/v4");
const FileStore = require("session-file-store")(session);
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

const users = [
  {id: '2f24vvg', email: 'test@test.com', password: 'password'}
];

passport.use(new LocalStrategy(
    {usernameField: "email"},
    function(email, password, done){
        console.log("Inside local strategy callback");
        // TBD
        // here is where you make a call to the database
        // to find the user based on their username or email address
        // for now, we'll just pretend we found that it was users[0]
        const user = users[0];
        if(email === user.email && password === user.password) {
            console.log("local strategy returned true");
            return done(null, user);
        }
    }
));

// tell passport how to serialize the user
passport.serializeUser((user, done) => {
    console.log('Inside serializeUser callback. User id is saved to the session file store here')
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    console.log('Inside deserializeUser callback')
    console.log(`The user id passport saved in the session file store is: ${id}`)
    const user = users[0].id === id ? users[0] : false; 
    done(null, user);
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

// Route /search-result POST
app.post("/search-result", function (req, resp) {
    console.log(`Received request ${req.url}`);
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
    resp.render("login", {"title": title});
});

app.post("/login", function (req, resp, next) {
    console.log(`Received request POST ${req.url}`);
    console.log("Inside the /login POST callback function");
    console.log(req.sessionID);
    console.log(JSON.stringify(req.body));

    passport.authenticate("local", function(err, user, info) {
        console.log("Inside passport.authenticate() callback");
        console.log(`req.session.passport: ${JSON.stringify(req.session.passport)}`);
        console.log(`req.user: ${JSON.stringify(req.user)}`);
        req.login(user, function(err) {
            console.log('Inside req.login() callback');
            console.log(`req.session.passport: ${JSON.stringify(req.session.passport)}`);
            console.log(`req.user: ${JSON.stringify(req.user)}`);
            console.log(`User ${req.user.email} authenticated & logged in!`);
            return resp.redirect("/login2");

        })
    })(req, resp, next);
});

// Route to render home page with right url after login
app.get("/login2", function(req, resp){
    resp.redirect("/");
})


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


// Route /page-requires-auth GET 
app.get("/page-requires-auth", function(req, resp, err){
    console.log("Inside /page-requires-auth GET callback");
    console.log(`User authenticated? ${req.isAuthenticated()}`);
    if(req.isAuthenticated()) {
        resp.send("Page that needs auth.");
    } else {
        console.log("Auth failed");
        resp.redirect("/");
    }
         
});

