const mongoose = require('mongoose');
const { Schema } = mongoose;

const orderSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId
    },
    orderId:{
        type: String
    },
    products: [{
       _id: {
            type: Schema.Types.ObjectId,
            ref: 'product'
        },
        title: {
            type: String
        },
        price: {
            type: Number,
        },
        image: {
            type: String
        },
        brand: {
            type: String
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
    },
    shippingAddress:{
        type: Object
    },
    CreatedAt: {
        type: Date
    },
}, { collection: 'order' })

const Order = mongoose.model(orderSchema.options.collection, orderSchema);

module.exports = Order;