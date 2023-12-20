import express from 'express';
import request from 'request-promise-native';
import faker from 'faker';

const app = express(); // Create an express app

const rocketChatServer = 'https://kandyba.rocket.chat';
const rocketChatAdminUserId = '99jQmj4DPxsWeyL8v';
const rocketChatAdminAuthToken = 'AlTHWmACFLK1wEKIZv7cDy6UZvHQiKYykwIIE4GNmA6';

// CORS middleware
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', 'https://kandyba.rocket.chat'); // Replace with your Rocket.Chat URL
  res.set('Access-Control-Allow-Credentials', 'true');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE'); // Add the HTTP methods you need
  res.set('Access-Control-Allow-Headers', 'Content-Type'); // Add the headers you need

  next();
});

// Global error handler middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).send({ message: 'Internal Server Error' });
});

export async function fetchUser(username) {
  try {
    const rocketChatUser = await request({
      url: `${rocketChatServer}/api/v1/users.info`,
      method: 'GET',
      qs: {
        username: username,
      },
      headers: {
        'X-Auth-Token': rocketChatAdminAuthToken,
        'X-User-Id': rocketChatAdminUserId,
      },
    });
    return rocketChatUser;
  } catch (err) {
    console.error('Error in fetchUser:', err);
    throw err;
  }
}

export async function loginUser(email, password) {
  try {
    const response = await request({
      url: `${rocketChatServer}/api/v1/login`,
      method: 'POST',
      json: {
        user: email,
        password: password,
      },
    });
    return response;
  } catch (err) {
    console.error('Error in loginUser:', err);
    throw err;
  }
}

export async function createUser() {
  try {
    const name = faker.name.findName();
    const email = faker.internet.email();
    const password = faker.internet.password();
    const username = faker.internet.userName();

    const rocketChatUser = await request({
      url: `${rocketChatServer}/api/v1/users.create`,
      method: 'POST',
      json: {
        name,
        email,
        password,
        username,
        verified: true,
      },
      headers: {
        'X-Auth-Token': rocketChatAdminAuthToken,
        'X-User-Id': rocketChatAdminUserId,
      },
    });
    return rocketChatUser;
  } catch (err) {
    console.error('Error in createUser:', err);
    throw err;
  }
}

export async function createOrLoginUser() {
  try {
    const username = faker.internet.userName();
    const name = faker.name.findName();
    const email = faker.internet.email();
    const password = faker.internet.password();

    const user = await fetchUser(username);
    // Perform login
    return await loginUser(email, password);
  } catch (ex) {
    if (ex.statusCode === 400) {
      // User does not exist, creating user
      const user = await createUser();
      // Perform login
      return await loginUser(user.email, user.password);
    } else {
      console.error('Error in createOrLoginUser:', ex);
      throw ex;
    }
  }
}

// Creating API’s
/// login route
app.post('/login', async (req, res, next) => {
  try {
    // Assuming you still want to store the user in the session
    req.session.user = await createOrLoginUser();

    // Accessing the user from the session
    const user = req.session.user;

    user.rocketchatAuthToken = response.data.authToken;
    user.rocketchatUserId = response.data.userId;
    await user.save(); // Saving the rocket.chat auth token and userId in the database
    res.send({ message: 'User Created Successfully' });
  } catch (ex) {
    console.error('Error in /login route:', ex);
    next(ex);
  }
});

// This method will be called by Rocket.chat to fetch the login token
app.get('/auth_get', (req, res) => {
  if (req.session.user && req.session.user.rocketchatAuthToken) {
    res.send({ loginToken: req.session.user.rocketchatAuthToken });
    return;
  } else {
    res.status(401).json({ message: 'User not logged in' });
    return;
  }
});

// This method will be called by Rocket.chat to fetch the login token
// and is used as a fallback
app.get('/chat_iframe', (req, res) => {
  const rocketChatServer = 'https://kandyba.rocket.chat';
  if (req.session.user && req.session.user.rocketchatAuthToken) {
    // We are sending a script tag to the front-end with the RocketChat Auth Token that will be used to authenticate the user
    return res.send(`<script>
      window.parent.postMessage({
        event: 'login-with-token',
        loginToken: '${req.session.user.rocketchatAuthToken}'
      }, '${rocketChatServer}');
    </script>`);
  } else {
    return res.status(401).send('User not logged in');
  }
});

const PORT = 3030;
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
