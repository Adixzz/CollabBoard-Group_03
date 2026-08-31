const jwt = require('jsonwebtoken');
const SECRET_KEY = "collab_board_super_secret_key";

const protect = (req, res, next) => {
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ message: "Access denied. Please log in." });
    }

    try {
        const verified = jwt.verify(token.replace("Bearer ", ""), SECRET_KEY);
        
        req.user = verified; 
        
        next(); 
    } catch (error) {
        res.status(400).json({ message: "Invalid token" });
    }
};

module.exports = protect;