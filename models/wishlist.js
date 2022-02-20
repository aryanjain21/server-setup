const mongoose = require('mongoose');
const { Schema } = mongoose;

const wishlistSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId
    },
    products: [{
       _id: {
            type: Schema.Types.ObjectId,
            ref: 'product'
        }
    }]
}, { collection: 'wishlist' })

const Wishlist = mongoose.model(wishlistSchema.options.collection, wishlistSchema);

module.exports = Wishlist;