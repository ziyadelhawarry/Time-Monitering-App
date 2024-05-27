const ensureEmployer = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'employer') {
        return next();
    }
    res.status(403).send('Forbidden');
};

module.exports = {
    ensureEmployer,
};
