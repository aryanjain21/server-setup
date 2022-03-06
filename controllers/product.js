const Product = require('../models/product');
const async = require('async');
const cloudinary = require('../utils/cloudinary');

module.exports = {
    addProduct: (req, res) => {
        async.waterfall([
            (nextCall) => {
                if (!req.body.title || !req.body.price || !req.body.description) {
                    return nextCall({
                        message: 'Please provide all fields.'
                    });
                }
                nextCall(null, req.body, req.file)
            },
            (body, file, nextCall) => {
                cloudinary.uploader.upload(file.path, (err, resp) => {
                    if (err) {
                        console.error('Cloudinary error', err);
                        return nextCall(err);
                    }
                    body.image = resp.secure_url;
                    body.cloudinaryId = resp.public_id;
                    nextCall(null, body)
                });
            },
            (body, nextCall) => {
                let product = new Product(body)
                product.save((err, data) => {
                    if (err) {
                        return nextCall(err)
                    }
                    nextCall(null, data)
                })
            }

        ], (err, response) => {
            if (err) {
                return res.status(400).json({
                    message: (err && err.message) || 'Oops! Failed to add product.'
                })
            }

            res.json({
                status: 200,
                message: "Product added successfully.",
                data: response
            });
        });
    },

    getAllProducts: (req, res) => {
        async.waterfall([
            (nextCall) => {
                let filter = req.body.filter;
                let applyFilter = {};
                let sort = {};
                let aggregateQuery = [];

                if (req.body.search) {
                    let regex = new RegExp(req.body.search, 'i')

                    let search = {
                        $or: [
                            {
                                'title': regex
                            },
                            {
                                'brand': regex
                            }
                        ]
                    }

                    aggregateQuery.push({
                        '$match': search
                    })
                }

                if (filter) {
                    if (filter.brands.length > 0) {
                        applyFilter.brand = { $in: filter.brands }
                    }

                    if (filter.gender.length > 0) {
                        applyFilter.gender = { $in: filter.gender }
                    }
                    aggregateQuery.push({
                        $match: {
                            $and: [applyFilter]
                        }
                    })
                }

                if (filter && filter.price) {
                    sort['price'] = parseInt(filter.price);
                } else {
                    sort = { created_at: 1 }
                }
                aggregateQuery.push({
                    $sort: sort
                })
                aggregateQuery.push({
                    $group: {
                        _id: null,
                        total_products: { $sum: 1 },
                        products: {
                            $push: {
                                "_id": "$_id",
                                "title": "$title",
                                "gender": "$gender",
                                "price": "$price",
                                "description": "$description",
                                "brand": "$brand",
                                "image": "$image",
                                "size": "$size",
                                "discount": "$discount",
                                "created_at": "$created_at",
                                "updated_at": "$updated_at"
                            }
                        }
                    }
                });
                nextCall(null, aggregateQuery)
            },
            (aggregateQuery, nextCall) => {
                Product.aggregate(aggregateQuery).exec((err, list) => {
                    if (err) {
                        return nextCall(err)
                    }
                    list = list && list.length > 0 ? list[0] : { total_products: 0, products: [] }
                    nextCall(null, list)
                })
            }
        ], (err, response) => {
            if (err) {
                return res.status(400).json({
                    message: (err && err.message) || 'Oops! Failed get products.'
                })
            }
            res.json({
                status: "success",
                message: 'Product list.',
                data: response
            })
        })
    },

    getProduct: (req, res) => {
        async.waterfall([
            (nextCall) => {
                Product.findById(req.body.productId, (err, product) => {
                    if (err) {
                        return nextCall(err)
                    }
                    // product.image = config.imgUrl + '/products/' + product.image;
                    nextCall(null, product)
                })
            }

        ], (err, response) => {
            if (err) {
                return res.status(400).json({
                    message: (err && err.message) || 'Oops! Failed get product detail.'
                })
            }
            res.json({
                status: 200,
                message: 'Product detail fetched successfully!.',
                data: response
            })
        })
    }
}