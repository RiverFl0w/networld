const express = require('express');

const commentController = require('../controllers/commentController');

const validateMiddleware = require('../middlewares/validateMiddleware');
const ownerMiddleware = require('../middlewares/ownerMiddleware');
const checkerMiddleware = require('../middlewares/checkerMiddleware');
const finderMiddleware = require('../middlewares/finderMiddleware');

const router = express.Router({ mergeParams: true });

router.use(express.json());
router.use(express.urlencoded({ extended: false }));

// create comment
router.post(
  '/',
  validateMiddleware.authorize,
  finderMiddleware.findPost,
  checkerMiddleware.checkPostStatusPermission,
  commentController.createComment,
);

// update comment
router.patch(
  '/:commentId(\\d+)',
  validateMiddleware.authorize,
  finderMiddleware.findPost,
  checkerMiddleware.checkPostExist,
  checkerMiddleware.checkPostStatusPermission,
  finderMiddleware.findComment,
  checkerMiddleware.checkCommentExist,
  ownerMiddleware.ownerComment,
  commentController.updateComment,
);

// delete comment
router.delete(
  '/:commentId(\\d+)',
  validateMiddleware.authorize,
  finderMiddleware.findPost,
  checkerMiddleware.checkPostExist,
  checkerMiddleware.checkPostStatusPermission,
  finderMiddleware.findComment,
  checkerMiddleware.checkCommentExist,
  ownerMiddleware.ownerComment,
  commentController.deleteComment,
);

// get post comment
router.get(
  '/',
  validateMiddleware.identify,
  finderMiddleware.findPost,
  checkerMiddleware.checkPostExist,
  checkerMiddleware.checkPostStatusPermission,
  commentController.getPostComments,
);

// reply comment
router.post(
  '/:commentId(\\d+)/reply',
  validateMiddleware.authorize,
  finderMiddleware.findPost,
  checkerMiddleware.checkPostExist,
  checkerMiddleware.checkPostStatusPermission,
  finderMiddleware.findComment,
  checkerMiddleware.checkCommentExist,
  commentController.replyComment,
);

// get reply comment
router.get(
  '/:commentId(\\d+)/replies',
  validateMiddleware.identify,
  finderMiddleware.findPost,
  checkerMiddleware.checkPostExist,
  checkerMiddleware.checkPostStatusPermission,
  finderMiddleware.findComment,
  checkerMiddleware.checkCommentExist,
  commentController.getReplyComments,
);

// like comment
router.get(
  '/:commentId(\\d+)/like',
  validateMiddleware.authorize,
  finderMiddleware.findPost,
  checkerMiddleware.checkPostExist,
  checkerMiddleware.checkPostStatusPermission,
  finderMiddleware.findComment,
  checkerMiddleware.checkCommentExist,
  commentController.likeComment,
);

// get comment likes
router.get(
  '/:commentId(\\d+)/likes',
  validateMiddleware.identify,
  finderMiddleware.findPost,
  checkerMiddleware.checkPostExist,
  checkerMiddleware.checkPostStatusPermission,
  finderMiddleware.findComment,
  checkerMiddleware.checkCommentExist,
  commentController.getCommentLikes,
);

module.exports = router;
