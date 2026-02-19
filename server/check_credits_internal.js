
const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from logic: try server/.env first, then root .env
// We are running from server/ directory
dotenv.config({ path: path.resolve(__dirname, '.env') });
if (!process.env.MONGO_URI) {
    console.log('Trying root .env...');
    dotenv.config({ path: path.resolve(__dirname, '../.env') });
}

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/govi-isuru';
console.log('Using MONGO_URI:', MONGO_URI);

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
            const users = await User.find({}).limit(5);
            console.log('Sample users:', users.map(u => u.username));
        }
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
