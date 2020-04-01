const fs = require('fs');
const sharp = require('sharp');

const { User, Post, PostPhoto, Like, Comment } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const responseHander = require('../utils/responseHander');
const requestHandler = require('../utils/requestHandler');

module.exports.createPost = asyncHandler(async (req, res, next) => {
  const { username } = req.user;
  const files = req.files || [];
  const { content } = req.body;

  if (!(files.length !== 0 || content)) {
    return next(new ErrorResponse('missing parameters', 400));
  }

  const newPost = await Post.create({ createdBy: username });

  if (files.length !== 0) {
    const photoDests = [];

    files.forEach(file => {
      const uniqueName = `${Date.now()}-${Math.random().toFixed(3)}.jpg`;
      sharp(file.buffer)
        .resize(1080)
        .jpeg()
        .toFile(`./static/posts/${uniqueName}`);

      photoDests.push(`posts/${uniqueName}`);
    });

    // set photos along with response
    newPost.dataValues.photos = await PostPhoto.bulkCreate(
      photoDests.map(photoDest => ({ postId: newPost.id, photo: photoDest })),
    );
  }

  if (content) {
    newPost.content = content;
  }

  await newPost.save();

  res.status(201).json({
    status: 'success',
    data: responseHander.processPost(newPost),
  });
});

module.exports.updatePost = asyncHandler(async (req, res, next) => {
  const { removePhotos, content } = req.body;
  const { post } = req;
  const files = req.files || [];

  // must have at least one of data to update
  if (!(removePhotos || content || files.length !== 0)) {
    return next(new ErrorResponse('missing parameters', 400));
  }

  if (content) {
    post.content = content;
  }
  await post.validate();

  if (removePhotos) {
    // filter to get only owner photo
    const filteredPhotos = removePhotos
      .split(',')
      .map(removeId => {
        return post.photos.find(photo => photo.id === parseInt(removeId, 10));
      })
      .filter(photo => photo);

    if (filteredPhotos.length !== 0) {
      await PostPhoto.destroy({
        where: { id: filteredPhotos.map(photo => photo.id) },
      });

      filteredPhotos.forEach(photo => {
        fs.unlink(`./static/${photo.photo}`, err => {
          if (err) console.log(err);
        });
      });

      post.dataValues.photos = post.photos.filter(photo => {
        return filteredPhotos.indexOf(photo) === -1;
      });
    }
  }

  if (files.length !== 0) {
    const photoDests = [];

    files.forEach(file => {
      const uniqueName = `${Date.now()}-${Math.random().toFixed(3)}.jpg`;
      sharp(file.buffer)
        .resize(1080)
        .jpeg()
        .toFile(`./static/posts/${uniqueName}`);

      photoDests.push(`posts/${uniqueName}`);
    });

    const newPhotos = await PostPhoto.bulkCreate(
      photoDests.map(photoDest => ({ postId: post.id, photo: photoDest })),
    );

    post.dataValues.photos.push(...newPhotos);
  }

  await post.save();

  res.status(200).json({
    status: 'success',
    data: responseHander.processPost(post),
  });
});

module.exports.deletePost = asyncHandler(async (req, res, next) => {
  const { post } = req;

  await post.destroy();

  res.status(200).json({
    status: 'success',
    data: 'deleted',
  });
});

module.exports.like = asyncHandler(async (req, res, next) => {
  const { postId } = req.params;
  const { username } = req.user;

  const post = await Post.findByPk(postId);
  if (!post) {
    return next(new ErrorResponse('post not found', 404));
  }

  const like = await Like.findOne({ where: { liker: username, postId } });

  if (like) {
    await like.destroy();
    await post.increment({ like: -1 }, { where: { id: postId } });
    return res.status(200).json({
      status: 'success',
      data: 'unliked',
    });
  }

  await Like.create({ liker: username, postId: postId });
  await post.increment({ like: 1 }, { where: { id: postId } });
  res.status(200).json({
    status: 'success',
    data: 'liked',
  });
});

module.exports.getLikes = asyncHandler(async (req, res, next) => {
  const { postId } = req.params;
  const { from, limit } = requestHandler.range(req, [20, 200]);

  const users = await Like.findAll({
    where: { postId: postId },
    offset: from,
    limit: limit,
    order: ['createdAt'],
    include: { model: User, attributes: ['fullName'] },
  });

  res.status(200).json({
    status: 'success',
    data: users,
  });
});

module.exports.createComment = asyncHandler(async (req, res, next) => {
  const { postId } = req.params;
  const { username } = req.user;
  const { content } = req.body;

  if (!content) {
    return next(new ErrorResponse('missing parameters', 400));
  }

  const post = await Post.count({ where: { id: postId } });
  if (!post) {
    return next(new ErrorResponse('post not found', 404));
  }

  const newComment = await Comment.create({
    commenter: username,
    postId: parseInt(postId, 10),
    content: content,
  });

  res.status(201).json({
    status: 'success',
    data: newComment,
  });
});

module.exports.getComments = asyncHandler(async (req, res, next) => {
  const { postId } = req.params;
  const { from, limit } = requestHandler.range(req, [20, 50]);

  // id represent createAt
  const comments = await Comment.findAll({
    where: { postId },
    offset: from,
    limit: limit,
    order: ['id'],
    include: { model: User, attributes: ['fullName'] },
  });

  res.status(200).json({
    status: 'success',
    data: comments,
  });
});

module.exports.getPost = asyncHandler(async (req, res, next) => {
  const { postId } = req.params;

  const post = await Post.findOne({
    where: { id: postId },
    include: { model: PostPhoto, as: 'photos' },
  });

  if (!post) {
    return next(new ErrorResponse('post not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: responseHander.processPost(post),
  });
});
