const express = require('express');
const cookieParser = require('cookie-parser');
const multer = require('multer');

const userController = require('../controllers/userController');

const validateMiddleware = require('../middlewares/validateMiddleware');

const ErrorResponse = require('../utils/errorResponse');

const route = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, callback) => {
    if (/image/.test(file.mimetype)) {
      return callback(null, true);
    }
    callback(new ErrorResponse('invalid filetype', 400));
  },
});

route.use(express.json());
route.use(express.urlencoded({ extended: false }));
route.use(cookieParser());

route.get('/:username', userController.getUser);
route.patch(
  '/info/',
  upload.single('avatar'),
  validateMiddleware.validateAccessToken,
  userController.updateUser,
);
route.patch(
  '/password',
  validateMiddleware.validateAccessToken,
  userController.updatePassword,
);

module.exports = route;
