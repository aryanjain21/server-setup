const mongoose = require('mongoose');
const { Schema } = mongoose;

const addressSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId
    },
    name: {
        type: String
    },
    street: {
        type: String,
        required: true,
    },
    landmark: {
        type: String
    },
    mobileNumber: {
        type: Number,
        required: true
    },
    city: {
        type: String,
        required: true,
    },
    state: {
        type: String,
        required: true,
    },
    pincode: {
        type: String,
        required: true,
    },
    country: {
        type: String,
        required: true,
    },
    selectedAddress: {
        type: Boolean,
        default: false
    },
    CreatedAt: {
        type: Date
    },
    UpdatedAt: {
        type: Date
    }
}, { collection: 'address' })

addressSchema.pre('save', function (next) {
    let address = this;
    address.CreatedAt = address.UpdatedAt = new Date();
    next()
})

const Address = mongoose.model(addressSchema.options.collection, addressSchema);

module.exports = Address;