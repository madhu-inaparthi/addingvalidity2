const express = require('express');
const { resolve } = require('path');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = require('./config/db');
const User = require('./models/User');

const app = express();
const port = 3012;

connectDB().catch(err => {
  console.error('MongoDB connection error:', err);
  console.log('Continuing with in-memory user storage...');
});

const inMemoryUsers = [
  {
    email: 'user@example.com',
    password: '$2b$10$6Bnl2T.0iEKS9wdHvBH8.uXQA2Qsj9NUBnuwXKgXQX.GW.l.O4WPC'
  },
  {
    email: 'admin@example.com',
    password: '$2b$10$6Bnl2T.0iEKS9wdHvBH8.uXQA2Qsj9NUBnuwXKgXQX.GW.l.O4WPC'
  }
];

app.use(express.static('static'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.sendFile(resolve(__dirname, 'pages/index.html'));
});

app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }

  try {
    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = new User({
        email,
        password: hashedPassword
      });

      await newUser.save();

      return res.status(201).json({
        success: true,
        message: 'User registered successfully'
      });
    } catch (dbError) {
      console.error('MongoDB error, using in-memory storage:', dbError);

      const existingUser = inMemoryUsers.find(user => user.email === email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = {
        email,
        password: hashedPassword
      };

      inMemoryUsers.push(newUser);

      return res.status(201).json({
        success: true,
        message: 'User registered successfully (in-memory)'
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating user'
    });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }

  try {
    try {
      const user = await User.findOne({ email });

      if (!user) {
        const inMemoryUser = inMemoryUsers.find(u => u.email === email);
        if (!inMemoryUser) {
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }

        const isMatch = await bcrypt.compare(password, inMemoryUser.password);

        if (isMatch) {
          return res.status(200).json({
            success: true,
            message: 'Login successful (in-memory)'
          });
        } else {
          return res.status(401).json({
            success: false,
            message: 'Invalid password'
          });
        }
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (isMatch) {
        return res.status(200).json({
          success: true,
          message: 'Login successful'
        });
      } else {
        return res.status(401).json({
          success: false,
          message: 'Invalid password'
        });
      }
    } catch (dbError) {
      console.error('MongoDB error, using in-memory storage:', dbError);

      const user = inMemoryUsers.find(u => u.email === email);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (isMatch) {
        return res.status(200).json({
          success: true,
          message: 'Login successful (in-memory)'
        });
      } else {
        return res.status(401).json({
          success: false,
          message: 'Invalid password'
        });
      }
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
