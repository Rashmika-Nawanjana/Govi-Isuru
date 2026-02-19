
const mongoose = require('mongoose');
const User = require('./server/models/User');
const dotenv = require('dotenv');

dotenv.config({ path: './server/.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/govi-isuru'; // Fallback if env not loaded correctly

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('Connected to DB');
        const user = await User.findOne({ username: 'rashmika2' });
        if (user) {
            console.log('User found:', user.username);
            console.log('Credits:', user.credits);
            console.log('Daily Limit:', user.dailyLimit);
            console.log('Last Credit Reset:', user.lastCreditReset);
        } else {
            console.log('User rashmika2 not found');
            // List all users to be sure
            const users = await User.find({}).limit(5);
            console.log('Sample users:', users.map(u => u.username));
        }
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
