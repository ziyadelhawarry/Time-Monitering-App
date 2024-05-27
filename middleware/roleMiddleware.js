module.exports = function(requiredRole) {
    return function(req, res, next) {
        if (!req.session || !req.session.user) {
            return res.status(403).send('Forbidden');
        }
        if (req.session.user.role !== requiredRole) {
            console.log(`Access denied for role: ${req.session.user.role}`);
            return res.status(403).send('Forbidden');
        }
        next();
    };
};
