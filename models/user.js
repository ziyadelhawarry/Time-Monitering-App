const bcrypt = require('bcrypt');
const users = [];

async function registerUser(username, password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = { username, password: hashedPassword };
    users.push(user);
    return user;
}

async function authenticateUser(username, password) {
    const user = users.find(user => user.username === username);
    if (user && await bcrypt.compare(password, user.password)) {
        return user;
    }
    return null;
}

module.exports = {
    registerUser,
    authenticateUser,
    users
};
