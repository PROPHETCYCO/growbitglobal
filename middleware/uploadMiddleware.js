import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
        return cb(new Error("Only image files are allowed"), false);
    }
    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 1 * 1024 * 1024 }, // 1MB limit
});

export default upload;