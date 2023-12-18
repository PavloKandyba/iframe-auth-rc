const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// CORS in case you need
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', 'http://localhost:3000'); // Rocket.Chat URL, adjust as needed
  res.set('Access-Control-Allow-Credentials', 'true');

  next();
});

const baseURL = 'http://localhost:3000'; // Rocket.Chat base URL, adjust as needed
const yourPersonalAccessToken = '<YOUR_PERSONAL_ACCESS_TOKEN>'; // Replace with your actual token
const yourAdminUserID = '<YOUR_ADMIN_USER_ID>'; // Replace with your admin user ID

const generateRandomUsername = () => {
  // Implement logic to generate random usernames (e.g., using Math.random() and string manipulation)
  return 'guest_user_' + Math.floor(Math.random() * 1000000); // Replace with actual implementation
};

const generateRandomPassword = () => {
  // Implement logic to generate secure random passwords (e.g., using libraries like password-hash)
  return 'random_password_123!'; // Replace with actual implementation
};

// Handle SSO request
app.post('/sso', async (req, res) => {
  // Check user session (replace with your own logic)
  const notLoggedIn = true;

  if (notLoggedIn) {
    return res.sendStatus(401);
  }

  // Attempt creating user (if needed)
  try {
    const username = generateRandomUsername();
    const password = generateRandomPassword();

    await axios.post(`${baseURL}/api/v1/users.create`, {
      username,
      password,
    }, {
      headers: {
        'X-Auth-Token': yourPersonalAccessToken,
        'X-User-Id': yourAdminUserID,
      },
    });

    // Login with created credentials
    const loginResponse = await axios.post(`${baseURL}/api/v1/login`, {
      username,
      password,
    });

    if (loginResponse.data.status === 'success') {
      const authToken = loginResponse.data.data.authToken;

      // Send login token to iframe via postMessage
      res.set('Content-Type', 'text/html');
      res.send(`<script>
        window.parent.postMessage({
          event: 'login-with-token',
          loginToken: '${authToken}'
        }, 'http://localhost:3000'); // Rocket.Chat URL, adjust as needed
      </script>`);
    } else {
      return res.sendStatus(500);
    }
  } catch (error) {
    console.error(error);
    return res.sendStatus(500);
  }
});

app.listen(3030, () => {
  console.log('Example app listening on port 3030!');
});
