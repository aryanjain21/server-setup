require('dotenv').config();

module.exports = {
    port: process.env.PORT,
    mongoUrl: process.env.DB_URL,
    secret: process.env.SECRET,
    stripe: process.env.STRIPE_SECRET
}