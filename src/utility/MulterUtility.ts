import multer from "multer"
import path from "path";

const imageStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.join(__dirname, "..", "images"));
    },
    filename: function(req, file, cb) {
        // Create a Windows-friendly filename using timestamp
        const timestamp = Date.now(); // Get timestamp in milliseconds
        const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_'); // Remove special characters
        cb(null, `${timestamp}_${cleanFileName}`);
    }
});
export const images = multer({storage : imageStorage}).array('images', 10)

// // File filter to allow only images
// const fileFilter = (req, file, cb) => {
//     // Accept images only
//     if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
//         req.fileValidationError = 'Only image files are allowed!';
//         return cb(new Error('Only image files are allowed!'), false);
//     }
//     cb(null, true);
// };