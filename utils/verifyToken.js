import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Токен отсутствует.' });
  
    jwt.verify(token, 'your_secret_key', (err, decoded) => {
      if (err) return res.status(403).json({ message: 'Неверный токен.' });
      req.userId = decoded.id;
      next();
    });
  };
  