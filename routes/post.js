const express = require("express");
const router = new express.Router();
const Post = require("../models/post");
const auth = require("../middleware/auth");

router
  .route("/posts")
  .post(auth, async (req, res) => {
    try {
      const { _id: userId } = req.user;
      const post = await new Post({ userId, ...req.body }).save();
      return res.success(post, "Post uploaded successfully");
    } catch (e) {
      console.log({ e });
      return res.error(e);
    }
  })
  .get(auth, async (req, res) => {
    try {
      const { userId, offset, limit } = req.query;
      const query = {};
      if (userId) query.userId = userId;
      const posts = await Post.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        {
          $lookup: {
            from: "likes",
            localField: "_id",
            foreignField: "postId",
            as: "likes",
          },
        },
        {
          $project: {
            user: { _id: 1, username: 1, profileImg: 1 },
            image: 1,
            caption: 1,
            fullImageResponse: 1,
            createdAt: 1,
            noOfLikes: {
              $cond: {
                if: { $isArray: "$likes" },
                then: { $size: "$likes" },
                else: 0,
              },
            },
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: offset ? parseInt(offset) : 0 },
        { $limit: limit ? parseInt(limit) : 8 },
      ]);

      const totalPosts = await Post.find().countDocuments();
      return res.success({ posts, totalPosts });
    } catch (e) {
      console.log({ e });
      return res.error(e);
    }
  });

module.exports = router;
