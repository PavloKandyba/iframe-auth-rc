const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// CORS setup
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', 'https://kandyba.rocket.chat'); // Adjust to your Rocket.Chat URL
  res.set('Access-Control-Allow-Credentials', 'true');
  next();
});

const baseURL = 'https://kandyba.rocket.chat'; // Adjust to your Rocket.Chat URL
const yourPersonalAccessToken = 'AlTHWmACFLK1wEKIZv7cDy6UZvHQiKYykwIIE4GNmA6'; // Replace with your actual token
const yourAdminUserID = '99jQmj4DPxsWeyL8v'; // Replace with your actual admin user ID

const generateRandomUsername = () => {
  // Change username length as needed
  return 'user' + Math.floor(Math.random() * 1000000000).toString(36).substring(0, 8);
};

const CHARACTERS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()-_+';

const generateRandomPassword = (length = 12) => {
  let password = '';
  for (let i = 0; i < length; i++) {
    password += CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
  }
  return password;
};

// Change email domain as needed
const generateRandomEmail = () => {
  return `useremail${Math.floor(Math.random() * 1000000000)}@example.com`;
};

const generateRandomName = () => {
  // Change name length as needed
  return `name${Math.floor(Math.random() * 1000)}`;
};

// Redirect to /home on root access
app.get('/', (req, res) => {
  res.redirect('/home');
});

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
          }, 'https://kandyba.rocket.chat'); // Adjust to your Rocket.Chat URL
        </script>`;

        // Combine the script with home.html content and send as response
        res.sendFile(path.join(__dirname, 'home.html'), { additional: { script } });

      } else {
        const errorMessage = loginResponse.data.error;
        console.error(`Login failed: ${errorMessage}`);

        // Return specific error code based on error type (optional)
        if (errorMessage === 'Username or password is incorrect') {
          return res.status(401).send('Invalid username or password');
        } else {
          return res.sendStatus(500);
        }
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
