const async = require('async');
const User = require('../models/user');
const Address = require('../models/address');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { decrypt, encrypt } = require('../utils/encDecr');

module.exports = {
    signup: (req, res) => {
        async.waterfall([
            (nextCall) => {
                req.body.email = req.body.email.toLowerCase();
                nextCall(null, req.body)
            },
            (body, nextCall) => {
                User.findOne({ email: body.email }, (err, user) => {
                    if (err) {
                        return nextCall(err);
                    } else if (user) {
                        return nextCall({
                            message: 'User already exist.'
                        });
                    } else {
                        nextCall(null, body);
                    }
                });
            },
            (body, nextCall) => {
                const user = new User(body);
                user.save((err, user) => {
                    if (err) {
                        return nextCall(err);
                    }
                    nextCall(null);
                });
            }
        ], (err, resp) => {
            if (err) {
                return res.status(400).json({
                    message: (err && err.message) || 'Oops!! failed to create user'
                });
            }
            return res.json({
                status: 200,
                message: 'User created successfully'
            });
        });
    },

    login: async (req, res) => {
        async.waterfall([
            (nextCall) => {
                req.body.email = req.body.email.toLowerCase();
                nextCall(null, req.body);
            },
            (body, nextCall) => {
                User.findOne({ email: body.email }, (err, user) => {
                    if (err) {
                        return nextCall(err);
                    } else if (!user) {
                        return nextCall({
                            message: 'User does not exist'
                        });
                    } else {
                        let checkPassword = decrypt(req.body.password, user.password);
                        if (checkPassword) {
                            nextCall(null, user);
                        } else {
                            return nextCall({
                                message: 'Email/Password is incorrect'
                            });
                        }
                    }
                });
            },
            (user, nextCall) => {
                let payload = {
                    _id: user._id,
                    email: user.email
                }
                let token = jwt.sign(payload, config.secret, {
                    expiresIn: 24 * 60 * 60 * 2
                });
                user = user.toJSON();
                user.token = token;
                delete user.password;
                nextCall(null, user);
            }
        ], (err, resp) => {
            if (err) {
                return res.status(400).json({
                    message: (err && err.message) || 'Oops!! failed to login'
                });
            }
            return res.json({
                status: 200,
                message: 'Login successful!',
                data: resp
            });
        });
    },

    changePassword: (req, res) => {
        async.waterfall([
            (nextCall) => {
                if (!req.body.password || !req.body.newPassword) {
                    return nextCall({
                        message: 'Please enter all the fields'
                    });
                }
                nextCall(null, req.body);
            },
            (body, nextCall) => {
                User.findById(req.user._id, (err, user) => {
                    if (err) {
                        return nextCall(err);
                    }
                    nextCall(null, user, body)
                });
            },
            (user, body, nextCall) => {
                let matchPassword = decrypt(body.password, user.password);
                if (matchPassword) {
                    let newPassword = encrypt(body.newPassword);
                    User.findByIdAndUpdate(user._id, { password: newPassword }, (err, updatedUser) => {
                        if (err) {
                            return nextCall(err);
                        }
                        nextCall(null, null);
                    });
                } else {
                    nextCall({
                        message: "Password doesn't match. Please enter correct old password!"
                    });
                }
            }
        ], (err, resp) => {
            if (err) {
                return res.status(400).json({
                    message: (err && err.message) || 'Oops!! failed to change password'
                });
            }
            return res.json({
                status: 200,
                message: 'Password changed successfully!'
            });
        });
    },

    addAddress: (req, res) => {
        async.waterfall([
            (nextCall) => {
                if (!req.body.street || !req.body.mobileNumber || !req.body.city || !req.body.state || !req.body.pincode || !req.body.country) {
                    return nextCall({
                        message: 'Please provide all the required fields...'
                    });
                }
                nextCall(null, req.body);
            },
            (body, nextCall) => {
                let address = new Address({
                    userId: req.user._id,
                    street: body.street,
                    landmark: body.landmark,
                    mobileNumber: body.mobileNumber,
                    city: body.city,
                    state: body.state,
                    pincode: body.pincode,
                    country: body.country
                });
                address.save((err, newAddress) => {
                    if (err) {
                        return nextCall(err);
                    }
                    nextCall(null, newAddress);
                })
            }
        ], (err, resp) => {
            if (err) {
                return res.status(400).json({
                    message: (err && err.message) || 'Oops!! failed to add new address'
                });
            }
            return res.json({
                status: 200,
                message: 'Added address successfully!'
            });
        });
    },

    getAllAddress: (req, res) => {
        async.waterfall([
            (nextCall) => {
                Address.find({ userId: req.user._id }).sort({ CreatedAt: -1 }).exec((err, addressList) => {
                    if (err) {
                        return nextCall(err);
                    }
                    nextCall(null, addressList);
                });
            }
        ], (err, resp) => {
            if (err) {
                return res.status(0).json({
                    message: (err && err.message) || 'Oops!! failed to get address'
                });
            }
            return res.json({
                status: 200,
                message: 'Get address successfully!',
                data: resp
            });
        });
    },

    updateAddress: (req, res) => {
        async.waterfall([
            (nextCall) => {
                if (!req.body.addressId) {
                    return nextCall({
                        message: "Address update failed."
                    });
                }
                nextCall(null, req.body)
            },
            (body, nextCall) => {
                Address.findByIdAndUpdate(
                    body.addressId,
                    {
                        name: body.name,
                        street: body.street,
                        landmark: body.landmark,
                        mobileNumber: body.mobileNumber,
                        city: body.city,
                        state: body.state,
                        pincode: body.pincode,
                        country: body.country
                    },
                    { new: true },
                    (err, updatedAddress) => {
                        if (err) {
                            return nextCall(err);
                        }
                        nextCall(null, updatedAddress);
                    }
                )
            }
        ], (err, resp) => {
            if (err) {
                return res.status(400).json({
                    message: (err && err.message) || 'Oops!! failed to get address'
                });
            }
            return res.json({
                status: 200,
                message: 'Get address successfully!',
                data: resp
            });
        });
    },

    deleteAddress: (req, res) => {
        async.waterfall([
            (nextCall) => {
                Address.findByIdAndDelete({_id: req.body.addressId}, (err, address) => {
                    if(err) {
                        return nextCall(err)
                    } else if(!address) {
                        nextCall({
                            message: 'Address does not exist...'
                        });
                    } else {
                        nextCall(null, null);
                    }
                });
            }
        ], (err, resp) => {
            if (err) {
                return res.status(400).json({
                    message: (err && err.message) || 'Oops!! failed to delete address'
                });
            }
            return res.json({
                status: 200,
                message: 'Address deleted successfully!'
            });
        });
    }
}