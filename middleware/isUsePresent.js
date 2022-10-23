const User = require('../models/user');

module.exports = (req, res, next) => {
    if(!req.user && !req.user._id){
        return res.status(400).json({
            message :'Invalid user...'
        });
    }

    User.findById(req.user._id, (err, user) => {
        if(err) {
            return res.status(500).json({
                message :'Server error...'
            });
        }
        if(!user) {
            return res.status(400).json({
                message: 'User dose not exist'
            });
        } else {
            next();
        }
    });
}