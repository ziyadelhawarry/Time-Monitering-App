const role = (roles) => (req, res, next) => {
    try {
      if (!roles.includes(req.user.role)) {
        return res.status(403).send({ error: 'Access denied.' });
      }
      next();
    } catch (error) {
      res.status(500).send({ error: 'Internal Server Error.' });
    }
  };
  
  module.exports = role;
  