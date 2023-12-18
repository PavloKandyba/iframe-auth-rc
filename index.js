var express = require('express');
var bodyParser = require('body-parser');
var axios = require('axios');
var fs = require('fs');

var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// CORS in case you need
app.use((req, res, next) => {
    res.set('Access-Control-Allow-Origin', 'http://localhost:3000'); // this is the rocket.chat URL
    res.set('Access-Control-Allow-Credentials', 'true');

    next();
});

// this is the endpoint configured as API URL
app.post('/sso', function (req, res) {
    // add your own app logic here to validate user session (check cookies, headers, etc)

    // if the user is not already logged in on your system, respond with a 401 status
    var notLoggedIn = true;
    if (notLoggedIn) {
        return res.sendStatus(401);
    }

    // you can save the token on your database as well, if so just return it
    // MongoDB - services.iframe.token
    var savedToken = null;
    if (savedToken) {
        return res.json({
            token: savedToken
        });
    }

    // if don't have the user created on rocket.chat end yet, you can now create it
    var currentUsername = null;
    if (!currentUsername) {
        // Generate random credentials
        var randomUsername = 'user' + Math.floor(Math.random() * 1000);
        var randomPassword = 'pass' + Math.floor(Math.random() * 1000);

        // Use admin's personal access token and user ID for API call
        var adminAuthToken = 'your_admin_personal_access_token';
        var adminUserId = 'your_admin_user_id';

        axios.post('http://localhost:3000/api/v1/users.create', {
            username: randomUsername,
            password: randomPassword,
        }, {
            headers: {
                'X-Auth-Token': adminAuthToken,
                'X-User-Id': adminUserId,
            }
        }).then(function (response) {
            // after creation, log the user in to get the `authToken`
            if (response.data.success) {
                return axios.post('http://localhost:3000/api/v1/login', {
                    username: randomUsername,
                    password: randomPassword
                });
            }
        }).then(function (response) {
            if (response.data.status === 'success') {
                // since this endpoint is loaded within the iframe, we need to communicate back to rocket.chat using `postMessage` API
                res.set('Content-Type', 'text/html');
                res.send(`<script>
                    window.parent.postMessage({
                        event: 'login-with-token',
                        loginToken: '${response.data.data.authToken}'
                    }, 'http://localhost:3000'); // rocket.chat's URL
                </script>`);
            }
        }).catch(function (error) {
            res.sendStatus(401);
        });
    } else {
        // otherwise, create a rocket.chat session using rocket.chat's API
        axios.post('http://localhost:3000/api/v1/login', {
            username: 'username-set-previously',
            password: 'password-set-previously'
        }).then(function (response) {
            if (response.data.status === 'success') {
                // since this endpoint is loaded within the iframe, we need to communicate back to rocket.chat using `postMessage` API
                res.set('Content-Type', 'text/html');
                res.send(`<script>
                    window.parent.postMessage({
                        event: 'login-with-token',
                        loginToken: '${response.data.data.authToken}'
                    }, 'http://localhost:3000'); // rocket.chat's URL
                </script>`);
            }
        }).catch(function () {
            res.sendStatus(401);
        });
    }
});

app.listen(3030, function () {
    console.log('Example app listening on port 3030!');
});
