const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected for seeding'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const seedUsers = async () => {
  try {
    await User.deleteMany({});

    const hashedPassword = await bcrypt.hash('password123', 10);

    const users = [
      {
        email: 'user@example.com',
        password: hashedPassword
      },
      {
        email: 'admin@example.com',
        password: hashedPassword
      }
    ];

    await User.insertMany(users);

    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedUsers();
