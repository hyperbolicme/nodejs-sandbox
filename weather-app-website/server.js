const express = require('express');
const bodyParser = require("body-parser");
const request = require("request");

const app = express();

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');


app.get('/', function (req, res) { 
    res.render( "index", { weather: null, error: null } );
});

app.post('/', function (req, res) {
    console.log(req.body.city); 

    let city = req.body.city;
    let apikey = "679080ff0adfce04d2b096725233d0b0";
    let url = "http://api.openweathermap.org/data/2.5/weather?q=" +
        city + "&appid=" + apikey;

    request(url, function (err, response, body) {
        if (err) {
            console.log("error:", err);
        } else {
            // Get json object
            let weather = JSON.parse(body);
            if (weather.main == undefined) {
                res.render("index", { weather: null, error: "Error. Please try again later." });
            }
            let temp = (weather.main.temp - 273.15).toFixed(2); // Kelvin to Celsius
            let weatherText = "It is " + temp + " deg C in " + weather.name;
            console.log(weatherText);
            res.render("index", {weather: weatherText, error: null});
        }
    });

});

const port = 3000;
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
