const mongoose = require('mongoose');
const { Schema } = mongoose;
const { encrypt } = require('../utils/encDecr');

const userSchema = new Schema({
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        maxlength: 16
    },
    CreatedAt: {
        type: Date
    },
    UpdatedAt: {
        type: Date
    }
}, { collection: 'user' })

userSchema.pre('save', function (next) {
    let user = this;
    user.password = encrypt(user.password);
    user.CreatedAt = user.UpdatedAt = new Date();
    next()
})

const User = mongoose.model(userSchema.options.collection, userSchema);

module.exports = User;