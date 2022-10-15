const User = require('../models/user');
const Cart = require('../models/cart');
const Address = require('../models/address');
const Order = require('../models/order');
const async = require('async')
const config = require('../config');
const stripe = require('stripe')(config.stripe);
const { v4: uuidv4 } = require('uuid');
const short = require('short-uuid');

let _self = {
    payment: (req, res) => {
        async.waterfall([
            (nextCall) => {
                User.findById(req.user._id, (err, user) => {
                    if (err) {
                        return nextCall(err)
                    }
                    nextCall(null, req.body, user)
                })
            },
            (body, user, nextCall) => {
                Address.findOne({ selectedAddress: true }, (err, address) => {
                    if (err) {
                        return nextCall(err)
                    } else if (address) {
                        nextCall(null, body, user, address)
                    } else {
                        nextCall({
                            message: 'Something went wrong!!'
                        });
                    }
                });
            },
            (body, user, address, nextCall) => {
                if (user.stripeId) {
                    nextCall(null, body, user, address)
                } else {
                    stripe.customers.create({
                        email: user.email,
                        source: body.id,
                    }).then(customer => {
                        User.findByIdAndUpdate(user._id, { stripeId: customer.id }, { new: true }, (err, updatedUser) => {
                            if (err) {
                                return nextCall(err)
                            }
                            nextCall(null, body, updatedUser, address)
                        });
                    }).catch(error => {
                        return nextCall(error)
                    });
                }
            },
            (body, user, address, nextCall) => {
                console.log('body.token.card.country', address)
                stripe.paymentIntents.create(
                    {
                        payment_method: body.id,
                        amount: parseInt(body.amount) * 100,
                        currency: 'INR',
                        confirm: true,
                        // customer: user.stripeId,
                        shipping: {
                            name: user.fullName,
                            address: {
                                line1: address.street,
                                line2: address.landmark,
                                city: address.city,
                                state: address.state,
                                country: address.country
                            }
                        },
                    }, { idempotencyKey: uuidv4() }
                ).then(res => {
                    console.log('Payment', res)
                    // nextCall(null, res);
                    nextCall(null, body, user, address)
                }).catch(error => {
                    console.log('error>>>', error)
                    return nextCall(error);
                });
            },
            (body, user, address, nextCall) => {
                Cart.findOne({ user_id: user._id }, (err, cart) => {
                    if (err) {
                        return nextCall(err)
                    }
                    nextCall(null, cart, user, address)
                })
            },
            (cart, user, address, nextCall) => {
                let order = new Order({
                    orderId: short.generate(),
                    userId: user._id,
                    products: cart.products,
                    shippingAddress: address,
                    productInCart: cart.productInCart,
                    cartValue: cart.cartValue
                })

                order.save((err, orderInfo) => {
                    if (err) {
                        return nextCall(err)
                    }
                    console.log('order info', orderInfo);
                    _self.emptyCart(cart._id)
                    nextCall(null, orderInfo)
                });
            }


        ], (err, response) => {
            console.log('Payment response', response)
            if (err) {
                return res.status(400).json({
                    success: false,
                    message: (err && err.message) || 'Oops! Failed to place order'
                })
            }
            res.json({
                success: true,
                status: 'success',
                message: 'Order placed successfully',
                data: response
            });
        });
    },

    /**
     * Api to place user's order.
     * @param {address} 
     */
    // placeOrder: (user, address) => {
    //   async.waterfall([
    //     // (nextCall) => {
    //     //   if (!req.body.address_id) {
    //     //     return nextCall({
    //     //       message: 'Address id is required.'
    //     //     })
    //     //   }
    //     //   nextCall(null, req.body)
    //     // },
    //     (nextCall) => {
    //       Cart.findOne({ user_id: user._id }, (err, cart) => {
    //         if (err) {
    //           return nextCall(err)
    //         }
    //         nextCall(null, cart)
    //       })
    //     },
    //     // (body, cart, nextCall) => {
    //     //   Address.findById(body.address_id, (err, address) => {
    //     //     if (err) {
    //     //       return nextCall(err)
    //     //     }
    //     //     nextCall(null, cart, address)
    //     //   })
    //     // },
    //     (cart, nextCall) => {
    //       let order = new Order({
    //         order_id: uuidv4(),
    //         user_id: user._id,
    //         products: cart.products,
    //         shipping_address: address,
    //         products_in_cart: cart.products_in_cart,
    //         total_cart_value: cart.total_cart_value
    //       })

    //       order.save((err, orderInfo) => {
    //         if (err) {
    //           console.log("err", err)
    //           return nextCall(err)
    //         }
    //         nextCall(null, null)
    //       })
    //     }

    //   ], (err, response) => {
    //     // if (err) {
    //     //   return res.status(400).json({
    //     //     message: (err && err.message) || 'Oops! Failed to place order.'
    //     //   })
    //     // }
    //     // res.json({
    //     //   status: 'success',
    //     //   message: 'Order placed successfully.',
    //     //   data: response
    //     // })
    //   })
    // },

    /**
     * Api to get list of user's order.
    */
    //   getUserAllOrders: (req, res) => {
    //     async.waterfall([
    //       (nextCall) => {
    //         Order.find({ user_id: req.user._id }).sort({created_at:-1}).lean().exec((err, orders) => {
    //           if (err) {
    //             return nextCall(err)
    //           } 
    //           nextCall(null, orders)
    //         })
    //       },
    //       (orders,nextCall)=>{
    //         orders.map(order=>{
    //           order.created_at = moment(order.created_at).format("dddd, MMMM Do YYYY")
    //         })
    //         nextCall(null, orders)
    //       }
    //     ], (err, response) => {
    //       if (err) {
    //         return res.status(400).json({
    //           message: (err && err.message) || 'Oops! Failed to get order list.'
    //         })
    //       }
    //       res.json({
    //         status: "success",
    //         message: "Order's list.",
    //         data: response
    //       })
    //     })
    //   },

    /**
     * Api to get a specific order detail.
     * @param {order_id} req  
    */
    getOrderDetail: (req, res) => {
        async.waterfall([
            (nextCall) => {
                if (!req.body.orderId) {
                    return nextCall({
                        message: 'Order id is required.'
                    })
                }
                nextCall(null, req.body)
            },
            (body, nextCall) => {
                Order.find({ user_id: req.user._id }).sort({created_at:-1}).lean().exec((err, orders) => {
                    if (err) {
                    return nextCall(err)
                    } 
                    nextCall(null, body, orders)
                })
            },
            (body, orders, nextCall) => {
                const orderData = orders.filter(order => order.orderId == body.orderId);
                
                Order.findById(orderData[0]._id).populate('products._id').exec((err, order) => {
                    if (err) {
                        return nextCall(err)
                    }
                    order = order.toJSON();
                    console.log('123456', order);
                    // order.created_at = moment(order.created_at).format("dddd, MMMM Do YYYY")
                    // order.products.map(product => {
                    //     product.image = config.imgUrl + '/products/' + product.image;
                    // })
                    nextCall(null, order)
                })
            },

        ], (err, response) => {
            if (err) {
                return res.status(400).json({
                    message: (err && err.message) || 'Oops! Failed to get order detail.'
                })
            }

            res.json({
                status: 200,
                message: 'Order detail fetched successfully!',
                data: response
            })
        })
    },

    emptyCart: (cart_id) => {
        Cart.findByIdAndUpdate(cart_id, { products: [], productInCart: 0, cartValue: 0 }, { new: true }, (err, updatedCart) => { })
    }
}

module.exports = _self