const express = require('express');
const router = express.Router();
const upload = require('../utils/multer');
const UserController = require('../controllers/user');
const ProductController = require('../controllers/product');
const CartController = require('../controllers/cart');
const WishlistController = require('../controllers/wishlist');
const PaymentController = require('../controllers/payment');
const authenticated = require('../middleware/authenticated');
const isUserPresent = require('../middleware/isUsePresent');

router.all('*/api/*', authenticated, isUserPresent)
router.post('/v1/auth/signup', UserController.signup);
router.post('/v1/auth/login', UserController.login);
router.put('/api/change-password', UserController.changePassword);
router.post('/v1/api/add-address', UserController.addAddress);
router.get('/v1/api/get-address', UserController.getAllAddress);
router.put('/v1/api/update-address', UserController.updateAddress);
router.post('/v1/api/delete-address', UserController.deleteAddress);
router.post('/add-product', upload.single('image'), ProductController.addProduct);
router.post('/auth/get-all-product', ProductController.getAllProducts);
router.post('/auth/get-product', ProductController.getProduct);

router.post('/api/add-to-cart', CartController.addToCart);
router.get('/api/get-user-cart',CartController.getUserCart);
router.post('/api/remove-from-cart',CartController.removeProduct);
router.post('/api/empty-cart',CartController.emptyCart);
router.post('/api/update-qty',CartController.updateProductQty);
router.post('/api/move-to-wishlist',CartController.moveToWishlist);


router.post('/api/add-to-wishlist', WishlistController.addToWishlist);
router.get('/api/get-wishlist',WishlistController.getWishlist);
router.post('/api/remove-from-wishlist', WishlistController.removeFromWishlist);
router.post('/api/move-to-cart', WishlistController.moveToCart);

router.post('/api/payment', PaymentController.payment);
router.post('/api/order', PaymentController.getOrderDetail);

module.exports = router;
