const mongoose = require('mongoose');
const { Schema } = mongoose;

const productSchema = new Schema({
    title: {
        type: String
    },
    subTitle: {
        type: String
    },
    brand: {
        type: String
    },
    color: {
        type: String
    },
    price: {
        type: Number,
        required: true
    },
    description: {
        type: String
    },
    image: {
        type: String
    },
    cloudinaryId: {
        type: String
    },
    discount: {
        type: Number
    },
    size: {
        type: Number
    },
    gender: {
        type: String,
        enum: ['Male', 'Female']
    },
    CreatedAt: {
        type: Date
    },
    UpdatedAt: {
        type: Date
    }
}, { collection: 'product' })

productSchema.pre('save', function (next) {
    let product = this;
    product.CreatedAt = product.UpdatedAt = new Date();
    next()
})

const Product = mongoose.model(productSchema.options.collection, productSchema);

module.exports = Product;