const jwt = require('jsonwebtoken');

// middleware care verifica daca requestul are un token JWT valid in header
// daca da, adauga userId-ul decodat pe req.user si lasa requestul sa continue
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // token-ul trebuie trimis ca "Bearer <token>"
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: decoded.userId };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = { requireAuth };