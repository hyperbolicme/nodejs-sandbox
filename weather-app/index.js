
const request = require("request");
const argv = require("yargs").argv;

let city = argv.c || "kochi";
let apikey = "679080ff0adfce04d2b096725233d0b0";
let url = "http://api.openweathermap.org/data/2.5/weather?q=" + 
                                        city + "&appid=" + apikey;

// console.log(url);

request(url, function(err, response, body) {
    if(err){
        console.log("error:", err );
    } else {
        // console.log(body);
        // console.log("response:", response);
        
        // Get json object
        result = JSON.parse(body);
        let temp = result.main.temp - 273.15; // Kelvin to Celsius
        console.log("it is " + temp + " deg C in " + result.name);
    }
});
