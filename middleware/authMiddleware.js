const ensureAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    res.redirect('/users/login');
};

module.exports = {
    ensureAuthenticated,
};
