const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// CORS setup
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', 'https://kandyba.rocket.chat');
  res.set('Access-Control-Allow-Credentials', 'true');
  next();
});

// Constants
const baseURL = 'https://kandyba.rocket.chat';
const yourPersonalAccessToken = 'AlTHWmACFLK1wEKIZv7cDy6UZvHQiKYykwIIE4GNmA6';
const yourAdminUserID = '99jQmj4DPxsWeyL8v';

// Helper functions
const generateRandomUsername = () => 'user' + Math.floor(Math.random() * 1000000000).toString(36).substring(0, 8);
const generateRandomPassword = (length = 12) => {
  let password = '';
  const CHARACTERS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()-_+';
  for (let i = 0; i < length; i++) {
    password += CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
  }
  return password;
};
const generateRandomEmail = () => `useremail${Math.floor(Math.random() * 1000000000)}@example.com`;
const generateRandomName = () => `name${Math.floor(Math.random() * 1000)}`;

// Handle the /home request
app.get('/home', async (req, res) => {
  try {
    const username = generateRandomUsername();
    const password = generateRandomPassword();
    const email = generateRandomEmail();
    const name = generateRandomName();

    // Create user
    const userCreationResponse = await axios.post(
      `${baseURL}/api/v1/users.create`,
      { username, password, email, name },
      { headers: { 'X-Auth-Token': yourPersonalAccessToken, 'X-User-Id': yourAdminUserID } }
    );

    if (userCreationResponse.data.success) {
      // Login with created credentials
      const loginResponse = await axios.post(`${baseURL}/api/v1/login`, { username, password });

      if (loginResponse.data.status === 'success') {
        const authToken = loginResponse.data.data.authToken;

        // Send login token via postMessage
        const script = `<script>
          window.parent.postMessage({
            event: 'login-with-token',
            loginToken: '${authToken}'
          }, 'https://kandyba.rocket.chat');
        </script>`;

        // Combine the script with home.html content and send as response
        res.sendFile(path.join(__dirname, 'home.html'), { additional: { script } });

      } else {
        const errorMessage = loginResponse.data.error;
        console.error(`Login failed: ${errorMessage}`);
        return res.sendStatus(500);
      }
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
