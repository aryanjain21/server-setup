const mongoose = require('mongoose');
const Product = require('./product');
const { Schema } = mongoose;

const cartSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId
    },
    products: [{
       _id: {
            type: Schema.Types.ObjectId,
            ref: 'product'
        },
        qty:{
            type: Number
        }
    }],
    productInCart: {
        type: Number
    },
    cartValue: {
        type: Number
    }
}, { collection: 'cart' })

const Cart = mongoose.model(cartSchema.options.collection, cartSchema);

module.exports = Cart;