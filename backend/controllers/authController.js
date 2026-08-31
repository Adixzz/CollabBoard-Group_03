const jwt = require('jsonwebtoken');

let users = []; 

const SECRET_KEY = "collab_board_super_secret_key";

const register = (req, res) => {
    const { username, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
    }
    
    if (users.find(u => u.username === username)) {
        return res.status(400).json({ message: "User already exists" });
    }

    const newUser = { id: Date.now(), username, password };
    users.push(newUser);
    
    res.status(201).json({ message: "User registered successfully", user: { id: newUser.id, username } });
};

const login = (req, res) => {
    const { username, password } = req.body;
    
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
    
    res.status(200).json({ message: "Login successful", token });
};

module.exports = { register, login };