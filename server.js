// App constants
var PORT = process.env.PORT || 3000;

// App imports
var express = require("express");
var app = express();
var DiningMenu = require("./menu-object.js");
var bodyParser = require('body-parser');
var User = require("./User");
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var clock = require('date-events')();
var Email = require('email-templates');

// Use JSON enabled body parser to get data from requests
app.use(bodyParser.json());

// Use public as root when serving static folders
app.use(express.static('./public/'));

// Connect to the databse
mongoose.connect('mongodb://heroku_fgct8gvq:inpuu1fh5rbi2spf21pm6pont3@ds231377.mlab.com:31377/heroku_fgct8gvq');

/**
 * Listen for requests at the defined port. 
*/
app.listen(PORT, function() {
    console.log(`food-notify started on port ${PORT}!`);
});

/**
 * Serve our Angular SPA when the user visits the website.
 */
app.get("/", function(req, res) {
    res.sendFile("index.html");
});

// Every day at 7am, execute code
clock.on('7:00', function(date) {
    // Convert date to DineOnCampus friendly format
    var dateString = dateObj.getFullYear() + "-";
    dateString += (dateObj.getMonth() + 1) + "-";
    dateString += dateObj.getDate();

    // Get menu from DineOnCampus API
    new DiningMenu(dateString).fetchMenuFromInternet(function(data) {
        var found = [];

        // Convert data into search friendly format
        var items = [];
        var periods = [];
        for (var period of data.periods) {
            for (var category of period.categories) {
                items.push(menu[period.name][category.name])
                periods.push(period.name);
            }
        }
        
        // Get all users
        User.find({}, function(err, users) {
            // Go through each user
            users.forEach(function(user) {
                // Go through user favorites
                for (var favorite of user.favorites) {
                    // For each menu item
                    for (var i = 0; i < items.length; i++) {
                        // If a favorite is on the menu
                        if (favorite == items[i])
                            found.push({"name": favorite, "period": periods[i]});
                    }
                }

                var email = new Email({
                    message: {
                        from: 'notify@food-notify.com'
                    },
                    // uncomment below to send emails in development/test env:
                    // send: true
                    transport: {
                        jsonTransport: true
                    }
                });

                // Send email with found items
                email
                    .send({
                            template: 'favorite',
                            message: {
                                to: user.email
                            },
                            locals: {
                                items: found,
                                name: user.name
                            }
                    });
            });
        });
    });
});

/**
 * Register users.
 */
app.post("/create-user", function(req, res) {
    // Create user from data
    var user = new User();
    user.email = req.body.email;
    user.password = User.generateHash(req.body.password);
    user.save();

    // Send user back to application
    res.send(user);
});

/**
 * Log users in.
 */
app.post('/login', function(req, res) {
    // Get login information
    var email = req.body.email;
    var passwordAttempt = req.body.password;
    
    // Search user by email
    User.findOne({email: email}, function(err, user) {
        if (err) console.err(err);

        if (user) {
            // Compare passwords
            bcrypt.compare(passwordAttempt, user.password, function(err, result) {
                if (result)
                    res.send(user);
                else
                    res.send("Incorrect password.");
            });
        }
        else {
            res.send("User not found.");
        }
    });
});

/**
 * Add an item to user's favorites.
 */
app.post("/favorite", function(req, res) {
    // Get information
    var email = req.body.email;
    var item = req.body.item;

    // Get user by email
    User.findOne({email: email}, function(err, user) {
        if (err) console.err(err);

        if (user) {
            // Add item to user favorites
            user.favorites.push(item);
            user.save();

            res.send(user.favorites);
        }
    });
});

/**
 * Remove an item from user's favorites.
 */
app.post("/unfavorite", function(req, res) {
    // Get information
    var email = req.body.email;
    var item = req.body.item;

    // Get user by email
    User.findOne({email: email}, function(err, user) {
        if (err) console.err(err);

        if (user) {
            // Remove item from user favorites
            user.favorites.splice(user.favorites.indexOf(item), 1);
            user.save();

            res.send(user.favorites);
        }
    });
});

/**
 * Gets menu data from DineOnCampus at date.
 */
app.post("/menu", function(req, res) {
    // Get date from request
    var dateObj = new Date(req.body.date);

    // Convert date to DineOnCampus friendly format
    var dateString = dateObj.getFullYear() + "-";
    dateString += (dateObj.getMonth() + 1) + "-";
    dateString += dateObj.getDate();

    // Get menu from DineOnCampus API
    new DiningMenu(dateString).fetchMenuFromInternet(function(data) {
        res.send(data);
    });
});