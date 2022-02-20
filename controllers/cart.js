const async = require('async');
const Cart = require('../models/cart');
const Product = require('../models/product');
const Wishlist = require('../models/wishlist');

module.exports = {
    addToCart: (req, res) => {
        async.waterfall([
            (nextCall) => {
                if (!req.body.productId) {
                    return nextCall({
                        message: "Product not available."
                    });
                }
                nextCall(null, req.body)
            },
            (body, nextCall) => {
                Cart.findOne({ userId: req.user._id }, (err, cart) => {
                    if (err) {
                        return nextCall(err);
                    }
                    nextCall(null, body, cart)
                });
            },
            (body, cart, nextCall) => {
                Product.findById(body.productId, (err, product) => {
                    if (err) {
                        return nextCall(err)
                    }
                    nextCall(null, body, cart, product)
                });
            },
            (body, cart, product, nextCall) => {
                if (cart) {
                    if (cart.products.some((item) => item.id === body.productId)) {
                        return nextCall({
                            message: "Product already exist in cart."
                        });
                    }
                    cart.products.push({
                        _id: product._id,
                        quantity: 1
                    });
                    let totalCartValue = parseInt(cart.cartValue) + parseInt(product.price);

                    Cart.findByIdAndUpdate(
                        cart._id,
                        {
                            products: cart.products,
                            productInCart: cart.products.length,
                            cartValue: totalCartValue
                        },
                        { new: true },
                        (err, updatedCart) => {
                            if (err) {
                                return nextCall(err)
                            }
                            // updatedCart.products.map(item => {
                            //     item.image = config.imgUrl + '/products/' + item.image;
                            // })
                            nextCall(null, updatedCart)
                        }
                    )
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
                        nextCall(null, userCart)
                    });
                }
            }
        ], (error, response) => {
            if (error) {
                return res.status(400).json({
                    message: (error && error.message) || 'Oops! Failed to add product in cart.'
                })
            }
            res.json({
                status: 200,
                message: 'Product added to cart.',
                data: response
            });
        });
    },

    removeProduct: (req, res) => {
        async.waterfall([
            (nextCall) => {
                if (!req.body.productId) {
                    return nextCall({
                        message: "Product id is required."
                    });
                }
                nextCall(null, req.body)
            },
            (body, nextCall) => {
                Cart.findOne({ userId: req.user._id }).populate('products._id').exec((err, cart) => {
                    if (err) {
                        return nextCall(err)
                    }
                    nextCall(null, body, cart)
                });
            },
            (body, cart, nextCall) => {
                let updatedProducts = cart.products.filter(item => item._id._id != body.productId);
                let productInCart = updatedProducts.length;
                let cartValue = 0;
                updatedProducts.map(item => {
                    cartValue += (item._id.price * item.qty)
                });

                Cart.findByIdAndUpdate(
                    cart._id,
                    {
                        products: updatedProducts,
                        productInCart: productInCart,
                        cartValue: cartValue
                    },
                    { new: true },
                    (err, updatedCart) => {
                        if (err) {
                            return nextCall(err)
                        }
                        nextCall(null, updatedCart)
                    }
                )
            }
        ], (error, response) => {
            if (error) {
                return res.status(400).json({
                    message: (error && error.message) || 'Oops! Failed to add product in cart.'
                })
            }
            res.json({
                status: 200,
                message: 'Product removed from cart.',
                data: response
            });
        });
    },

    emptyCart: (req, res) => {
        async.waterfall([
            (nextCall) => {
                Cart.findOneAndUpdate(
                    { userId: req.user._id },
                    {
                        products: [],
                        productInCart: 0,
                        cartValue: 0
                    },
                    { new: true },
                    (err, updatedCart) => {
                        if (err) {
                            return nextCall(err)
                        }
                        nextCall(null, updatedCart)
                    }
                )
            }
        ], (error, response) => {
            if (error) {
                return res.status(400).json({
                    message: (error && error.message) || 'Oops! Failed to empty cart.'
                });
            }
            res.json({
                status: 200,
                message: 'Cart emptied successfully.',
                data: response
            });
        });
    },

    getUserCart: (req, res) => {
        async.waterfall([
            (nextCall) => {
                Cart.findOne({ userId: req.user._id }).populate('products._id').exec((err, cart) => {
                    if (err) {
                        return nextCall(err)
                    }
                    nextCall(null, cart)
                });
            }
        ], (error, response) => {
            if (error) {
                return res.status(400).json({
                    message: (error && error.message) || 'Oops! Failed to empty cart.'
                });
            }
            res.json({
                status: 200,
                message: 'Cart fetched successfully.',
                data: response
            });
        });
    },

    updateProductQty: (req, res) => {
        async.waterfall([
            (nextCall) => {
                if (!req.body.productId || !req.body.qty) {
                    return nextCall({
                        message: "Product id or quantity is required."
                    });
                }
                nextCall(null, req.body)
            },
            (body, nextCall) => {
                Cart.findOne({ userId: req.user._id }).populate('products._id').exec((err, cart) => {
                    if (err) {
                        return nextCall(err)
                    }
                    nextCall(null, body, cart)
                });
            },
            (body, cart, nextCall) => {
                let updatedProducts = cart.products.map(item => {
                    if (item._id._id == body.productId) {
                        item.qty = body.qty;
                    }
                    return item;
                });
                let cartValue = 0;
                updatedProducts.map(item => {
                    cartValue += (parseInt(item._id.price) * parseInt(item.qty));
                });
                Cart.findByIdAndUpdate(
                    cart._id,
                    {
                        products: updatedProducts,
                        productInCart: updatedProducts.length,
                        cartValue: cartValue
                    },
                    { new: true },
                    (err, updatedCart) => {
                        if (err) {
                            return nextCall(err)
                        }
                        nextCall(null, updatedCart)
                    }
                )
            }
        ], (error, response) => {
            if (error) {
                return res.status(400).json({
                    message: (error && error.message) || 'Oops! Failed to empty cart.'
                });
            }
            res.json({
                status: 200,
                message: 'Quantity updated successfully.',
                data: response
            });
        })
    },

    moveToWishlist: (req, res) => {
        async.waterfall([
            (nextCall) => {
                if (!req.body.productId) {
                    return nextCall({
                        message: "Product id  is required."
                    });
                }
                nextCall(null, req.body);
            },
            (body, nextCall) => {
                Wishlist.findOne({ userId: req.user._id }, (err, wishlist) => {
                    if (err) {
                        return nextCall(err);
                    }
                    nextCall(null, body, wishlist);
                });
            },
            (body, wishlist, nextCall) => {
                let isExist = wishlist ? wishlist.products.some(item => item._id == body.productId) : false;
                if (!isExist) {
                    if (wishlist) {
                        Product.findById(body.productId, (err, product) => {
                            if (err) {
                                return nextCall(err);
                            }
                            wishlist.products.push({
                                _id: product._id,
                            });
                            nextCall(null, body, wishlist);
                        });
                    } else {
                        Product.findById(body.productId, (err, product) => {
                            if (err) {
                                return nextCall(err);
                            }
                            let products = {
                                _id: product._id
                            }
                            let newWishlist = new Wishlist({
                                userId: req.user._id,
                                products: products
                            });

                            newWishlist.save((err, data) => {
                                if (err) {
                                    return nextCall(err);
                                }
                                nextCall(null, body, null);
                            });
                        });
                    }
                } else {
                    nextCall(null, body, wishlist);
                }
            },
            (body, wishlist, nextCall) => {
                if (wishlist) {
                    Wishlist.findByIdAndUpdate(wishlist._id, { products: wishlist.products }, (err, updatedWishlist) => {
                        if (err) {
                            return nextCall(err);
                        }
                        nextCall(null, body);
                    })
                } else {
                    nextCall(null, body);
                }

            },
            (body, nextCall) => {
                Cart.findOne({ userId: req.user._id }).populate('products._id').exec((err, cart) => {
                    if (err) {
                        return nextCall(err);
                    }
                    nextCall(null, body, cart);
                });
            },
            (body, cart, nextCall) => {
                let updatedProducts = cart.products.filter(item => item._id._id != body.productId)
                let cartValue = 0;
                updatedProducts.map(item => {
                    cartValue += (parseInt(item._id.price) * parseInt(item.qty));
                });
                Cart.findByIdAndUpdate(
                    cart._id,
                    {
                        products: updatedProducts,
                        cartValue: cartValue,
                        productInCart: updatedProducts.length
                    },
                    { new: true },
                    (err, updatedCart) => {
                        if (err) {
                            return nextCall(err);
                        }
                        nextCall(null, updatedCart);
                    })
            }
        ], (err, response) => {
            if (err) {
                return res.status(400).json({
                    message: (err && err.message) || 'Oops! Failed to move product to wishlist.'
                });
            }

            res.json({
                status: 200,
                message: 'Moved to wishlist successfully.',
                data: response
            });
        });
    }
}