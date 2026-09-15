const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_IMAGE_SIZE_BYTES,
  },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error("Only jpg, jpeg, png, and webp files are allowed"));
    }
    return cb(null, true);
  },
});

function uploadBufferToCloudinary(fileBuffer, folder = "bitebook-restaurants") {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (err, result) => {
        if (err) return reject(err);
        return resolve(result);
      },
    );

    stream.end(fileBuffer);
  });
}

module.exports = {
  upload,
  uploadBufferToCloudinary,
};
