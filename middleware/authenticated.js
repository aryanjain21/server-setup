const jwt = require('jsonwebtoken');
const config = require('../config');

module.exports = (req, res, next) => {
    let token = req.headers ? req.headers['token'] : '';
    jwt.verify(token, config.secret, (err, tok) => {
        if(err) {
            return res.status(401).json({
                message: err.message
            });
        } else if(tok && tok._id) {
            req.user = tok;
            next();
        } else {
            return res.status(401).json({
                message: 'Something went wrong...'
            });
        }
    });
}