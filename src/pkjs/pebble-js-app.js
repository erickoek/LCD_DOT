var mConfig = {};
var updateInProgress = false;

Pebble.addEventListener("ready", function(e) {
	console.log("LCD_DOT is ready");
  updateWeather();
  loadLocalData();
  returnConfigToPebble();
});

Pebble.addEventListener('appmessage', function(e) {
    console.log("Request data..."); 
    updateWeather();
});

Pebble.addEventListener("showConfiguration", function(e) {
	Pebble.openURL(mConfig.configureUrl);
});

Pebble.addEventListener("webviewclosed", function(e) {
    if (e.response) {
      var config = JSON.parse(e.response);
      saveLocalData(config);
      returnConfigToPebble();
    }
  });

function saveLocalData(config) {

  console.log("loadLocalData() " + JSON.stringify(config));

  localStorage.setItem("blink", parseInt(config.blink));  
  localStorage.setItem("invert", parseInt(config.invert)); 
  localStorage.setItem("bluetoothvibe", parseInt(config.bluetoothvibe)); 
  localStorage.setItem("hourlyvibe", parseInt(config.hourlyvibe)); 

  
  loadLocalData();

}
function loadLocalData() {
  
	mConfig.blink = parseInt(localStorage.getItem("blink"));
	mConfig.invert = parseInt(localStorage.getItem("invert"));
	mConfig.bluetoothvibe = parseInt(localStorage.getItem("bluetoothvibe"));
	mConfig.hourlyvibe = parseInt(localStorage.getItem("hourlyvibe"));
	
	mConfig.configureUrl = "https://www.koekfamily.nl/LCD_DOT/LCD_DOT.html";
	
	if(isNaN(mConfig.blink)) {
		mConfig.blink = 1;
	}
	if(isNaN(mConfig.invert)) {
		mConfig.invert = 0;
	}
	if(isNaN(mConfig.bluetoothvibe)) {
		mConfig.bluetoothvibe = 1;
	}
	if(isNaN(mConfig.hourlyvibe)) {
		mConfig.hourlyvibe = 0;
	}   
	 

  console.log("loadLocalData() " + JSON.stringify(mConfig));
}
function returnConfigToPebble() {
  console.log("Configuration window returned: " + JSON.stringify(mConfig));
  Pebble.sendAppMessage({
    "blink":parseInt(mConfig.blink), 
    "invert":parseInt(mConfig.invert), 
    "bluetoothvibe":parseInt(mConfig.bluetoothvibe), 
    "hourlyvibe":parseInt(mConfig.hourlyvibe),
    });    
}

function updateWeather() {
    if (!updateInProgress) {
        updateInProgress = true;
        var locationOptions = { maximumAge:60000, timeout:15000 };
        navigator.geolocation.getCurrentPosition(locationSuccess, locationError, locationOptions);
    }
    else {
        console.log("Not starting a new request. Another one is in progress...");
    }
}

function locationSuccess(pos) {
    var coordinates = pos.coords;
    console.log("Got coordinates: " + JSON.stringify(coordinates));
    fetchWeather(coordinates.latitude, coordinates.longitude);
}

function locationError(err) {
    console.warn('Location error (' + err.code + '): ' + err.message);
    console.log("Location error");  
    Pebble.sendAppMessage({"KEY_REQUEST":0, "KEY_CONDITION": 1,"KEY_TEMPERATURE": 200});
    updateInProgress = false;
}

var OWM_ICONS = {
    // see http://openweathermap.org/weather-conditions for details
    // day icons
    "01d": 0, // sun
    "02d": 3, // cloud and sun
    "03d": 1, // cloud
    "04d": 2, // clouds
    "09d": 6, // rain drops
    "10d": 5, // rain drops
    "11d": 8, // lightning
    "13d": 7, // snow flake
    "50d": 4, // mist
    // night icons
    "01n": 0,
    "02n": 3,
    "03n": 1,
    "04n": 2,
    "09n": 6,
    "10n": 5,
    "11n": 8,
    "13n": 7,
    "50n": 4
};

function parseIconOpenWeatherMap(icon) {
    return OWM_ICONS[icon];
}

function fetchWeather(latitude, longitude) {
    console.log(latitude + " " + longitude);
    var response;
    var req = new XMLHttpRequest();
    req.open('GET', "http://api.openweathermap.org/data/2.5/weather?" +
        "lat=" + latitude + "&lon=" + longitude + "&cnt=1&appid=e1bb0121e6613061eccb789a4283fb0a", true);
    req.onload = function(e) {
        if (req.readyState == 4) {
            if(req.status == 200) {
                console.log(req.responseText);
                response = JSON.parse(req.responseText);
                var temperature, condition;
                if (response) {
                    var tempResult = response.main.temp;
                    if (response.sys.country === "US") {
                        // Convert temperature to Fahrenheit if user is within the US
                        temperature = Math.round(((tempResult - 273.15) * 1.8) + 32);
                    }
                    else {
                        // Otherwise, convert temperature to Celsius
                        temperature = Math.round(tempResult - 273.15);
                    }		 
                    //condition = response.weather[0].icon;
                    condition = parseIconOpenWeatherMap(response.weather[0].icon);


                    console.log("Temperature: " + temperature);
                  Pebble.sendAppMessage({"KEY_TEMPERATURE": temperature});
                    updateInProgress = false;
                  
                   console.log(" Condition: " + condition);
                  Pebble.sendAppMessage({"KEY_CONDITION": condition});
                    updateInProgress = false;
                }
            } else {
                //console.log("Error");
                updateInProgress = false;
                console.log("HTTP error");
                  Pebble.sendAppMessage({"KEY_REQUEST":0, "KEY_CONDITION": 1,"KEY_TEMPERATURE": 200});
            }
        }
    };
    req.send(null);
}