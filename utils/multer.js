const path = require('path');
const multer = require('multer');

module.exports = multer ({
    storage: multer.diskStorage({}),
    fileFilter: function(req, file, callback) {
        let ext = path.extname(file.originalname);
        if(ext !== '.jpg' && ext !== '.png' && ext !== '.jpeg' && ext !== '.webp') {
            callback(new Error('File type not supported'), false);
            return;
        }
        callback(null, true);
    }
});