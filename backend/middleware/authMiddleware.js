const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'collab_board_super_secret_key';

const protect = (req, res, next) => {
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    return res.status(401).json({ message: 'Access denied. Please log in.' });
  }

  try {
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : authHeader;

    const verified = jwt.verify(token, SECRET_KEY);
    req.user = {
      id: verified.id || verified._id,
      username: verified.username,
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = protect;