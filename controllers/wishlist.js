const async = require('async');
const Wishlist = require('../models/wishlist');
const Product = require('../models/product');
const Cart = require('../models/cart');
const { response } = require('express');

module.exports = {
    addToWishlist: (req, res) => {
        async.waterfall([
            (nextCall) => {
                if (!req.body.productId) {
                    return nextCall({
                        message: 'Product id is required.'
                    });
                }
                nextCall(null, req.body);
            },
            (body, nextCall) => {
                Product.findById(body.productId, (err, product) => {
                    if (err) {
                        return nextCall(err);
                    }
                    nextCall(null, product);
                });
            },
            (product, nextCall) => {
                Wishlist.findOne({ userId: req.user._id }, (err, wishlist) => {
                    if (err) {
                        return nextCall(err);
                    }
                    nextCall(null, wishlist, product);
                });
            },
            (wishlist, product, nextCall) => {
                if (wishlist) {
                    if (wishlist.products.some(item => item._id.toString() == product._id)) {
                        return nextCall({
                            message: 'Product already exist in wishlist.'
                        });
                    }

                    wishlist.products.push({
                        _id: product._id
                    });

                    Wishlist.findByIdAndUpdate(
                        wishlist._id,
                        { products: wishlist.products },
                        { new: true },
                        (err, updatedWishlist) => {
                            if (err) {
                                return nextCall(err)
                            }
                            nextCall(null, updatedWishlist);
                        }
                    );
                } else {
                    let wishProduct = {
                        _id: product._id
                    }
                    let newWishlist = new Wishlist({
                        userId: req.user._id,
                        products: wishProduct
                    });
                    newWishlist.save((err, wishlist) => {
                        if (err) {
                            return nextCall(err);
                        }
                        nextCall(null, wishlist);
                    });
                }
            }
        ], (error, response) => {
            if (error) {
                return res.status(400).json({
                    message: (error && error.message) || 'Oops! Failed to add to wishlist.'
                });
            }
            res.json({
                status: 200,
                message: 'Added to wishlish!!',
                data: response
            })
        });
    },

    getWishlist: (req, res) => {
        async.waterfall([
            (nextCall) => {
                Wishlist.findOne({userId: req.user._id}).populate('products._id').exec((err, wishlist) => {
                    if(err) {
                        return nextCall(err);
                    }
                    nextCall(null, wishlist);
                });
            }
        ], (error, response) => {
            if(error) {
                return res.status(400).json({
                    message: (error && error.message) || 'Oops ! Failed to fetch wishlist.'
                });
            }

            res.json({
                status: 200,
                message: 'Fetch wishlist successfull!',
                data: response
            });
        })
    },

    removeFromWishlist: (req, res) => {
        async.waterfall([
            (nextCall) => {
                Wishlist.findOne({userId: req.user._id}, (err, wishlist) => {
                    if(err) {
                        return nextCall(err);
                    }
                    nextCall(null, req.body, wishlist);
                });
            },
            (body, wishlist, nextCall) => {
                let updatedProduct = wishlist.products.filter(item => item._id != body.productId);
                Wishlist.findByIdAndUpdate(
                    wishlist._id,
                    {products: updatedProduct},
                    {new: true},
                    (err, updatedWishlist) => {
                        if(err) {
                            return nextCall(err);
                        }
                        nextCall(null, updatedWishlist);
                    }
                );
            }
        ], (error, response) => {
            if(error) {
                return res.status(400).json({
                    message: (error && error.message) || 'Oops ! Failed to remove wishlist.'
                });
            }

            res.json({
                status: 200,
                message: 'Removed from wishlist.',
                data: response
            });
        });
    },

    moveToCart: (req, res) => {
        async.waterfall([
            (nextCall) => {
                if(!req.body.productId) {
                    return nextCall({
                        message: 'Product id is required.'
                    });
                }
                nextCall(null, req.body);
            },
            (body, nextCall) => {
                Product.findById(body.productId, (err, product) => {
                    if(err) {
                        return nextCall(err);
                    }
                    nextCall(null, product);
                });
            },
            (product, nextCall) => {
                Cart.findOne({userId: req.user._id}, (err, cart) => {
                    if(err) {
                        return nextCall(err);
                    };
                    nextCall(null, product, cart);
                });
            },
            (product, cart, nextCall) => {
                let productInCart = cart ? cart.products.some(item => item._id == product._id) : false;
                if(!productInCart) {
                    if(cart) {
                        cart.products.push({
                            _id: product._id,
                            qty: 1
                        });
                        let cartValue = parseInt(cart.cartValue) + parseInt(product.price);
                        Cart.findByIdAndUpdate(
                            cart._id,
                            {
                                products: cart.products,
                                productInCart: cart.products.length,
                                cartValue: cartValue
                            },
                            (err, updatedCart) => {
                                if (err) {
                                    return nextCall(err);
                                }
                                nextCall(null, product);
                            }
                        );
                    } else {
                        let newCart = new Cart({
                            userId: req.user._id,
                            products: [{
                                _id: product._id,
                                qty: 1
                            }],
                            productInCart: 1,
                            cartValue: product.price
                        });

                        newCart.save((err, userCart) => {
                            if (err) {
                                return nextCall(err)
                            }
                            nextCall(null, product)
                        })
                    }
                } else {
                    nextCall(null, product);
                }
            }
        ], (error, response) => {
            if (error) {
                return res.status(400).json({
                    message: (error && error.message) || 'Oops ! Failed to move to cart.'
                });
            }

            res.json({
                status: 200,
                message: 'Move to cart successfully!',
                data: response
            })
        });
    }
}