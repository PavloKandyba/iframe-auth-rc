const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// CORS setup
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', 'https://kandyba.rocket.chat');
  res.set('Access-Control-Allow-Credentials', 'true');
  next();
});

const baseURL = 'https://kandyba.rocket.chat';
const yourPersonalAccessToken = 'AlTHWmACFLK1wEKIZv7cDy6UZvHQiKYykwIIE4GNmA6';
const yourAdminUserID = '99jQmj4DPxsWeyL8v';

const generateRandomUsername = () => {
  return 'user' + Math.floor(Math.random() * 1000000000).toString(36).substring(0, 10);
};

const CHARACTERS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()-_+';

const generateRandomPassword = (length = 12) => {
  let password = '';
  for (let i = 0; i < length; i++) {
    password += CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
  }
  return password;
};

const generateRandomEmail = () => {
  return `useremail${Math.floor(Math.random() * 1000000000)}@example.com`;
};

const generateRandomName = () => {
  return `name${Math.floor(Math.random() * 1000)}`;
};

// Handle SSO request
app.post('/sso', async (req, res) => {
  // Check user session (replace with your own logic)
  const notLoggedIn = true;

  if (notLoggedIn) {
    return res.sendStatus(401);
  }

  try {
    const username = generateRandomUsername();
    const password = generateRandomPassword();
    const email = generateRandomEmail();
    const name = generateRandomName();

    // Create user
    await axios.post(
      `${baseURL}/api/v1/users.create`,
      { username, password, email, name },
      { headers: { 'X-Auth-Token': yourPersonalAccessToken, 'X-User-Id': yourAdminUserID } }
    );

    // Login with created credentials
    const loginResponse = await axios.post(`${baseURL}/api/v1/login`, { username, password });

    if (loginResponse.data.status === 'success') {
      const authToken = loginResponse.data.data.authToken;

      // Send login token to iframe via postMessage
      res.set('Content-Type', 'text/html');
      res.send(`<script>
        window.parent.postMessage({
          event: 'login-with-token',
          loginToken: '${authToken}'
        }, 'https://kandyba.rocket.chat'); // Rocket.Chat URL, adjust as needed
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
