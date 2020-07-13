const express = require("express");
const router = new express.Router();
const bcrypt = require("bcrypt");
const {
  Types: { ObjectId },
} = require("mongoose");
const User = require("../models/user");
const Message = require("../models/message");
const auth = require("../middleware/auth");
const generateJwtToken = require("../util/generateJwtToken");
const reqBodyValidator = require("../middleware/requestBodyValidator");

router
  .route("/register")
  .post(reqBodyValidator("register"), async (req, res) => {
    try {
      const { email, password } = req.body;
      const alreadyRegistered = await User.findOne({ email });
      if (alreadyRegistered) return res.error({}, "Email already registered");

      const hashedPassword = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
      const user = await new User({
        ...req.body,
        password: hashedPassword,
      }).save();
      const token = await generateJwtToken({ id: user._id });
      return res.success(
        { token: "Bearer " + token, user },
        "User registered successfully"
      );
    } catch (e) {
      console.log({ e });
      return res.error(e);
    }
  });

router.route("/login").post(reqBodyValidator("login"), async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.error({}, "Email not found");

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) return res.error({}, "Incorrect password");

    const token = await generateJwtToken({ id: user._id });
    return res.success({ token: "Bearer " + token, user }, "Login success");
  } catch (e) {
    console.log(e);
    return res.error(e);
  }
});

router.route("/profile").get(auth, async (req, res) => {
  try {
    const { _id: userId } = req.user;
    const user = await User.findById(userId);
    if (!user) return res.error({}, "User not found");
    return res.success(user);
  } catch (e) {
    console.log(e);
    return res.error(e);
  }
});

router.route("/users").get(auth, async (req, res) => {
  try {
    const userId = ObjectId(req.user._id);
    const andQuery = [
      {
        $or: [
          {
            $and: [
              { $eq: ["$senderId", "$$userId"] },
              { $eq: ["$receiverId", userId] },
            ],
          },
          {
            $and: [
              { $eq: ["$senderId", userId] },
              { $eq: ["$receiverId", "$$userId"] },
            ],
          },
        ],
      },
    ];

    const users = await User.aggregate([
      { $match: { _id: { $ne: userId } } },
      {
        $lookup: {
          from: "messages",
          let: { userId: "$_id" },
          pipeline: [
            { $match: { $expr: { $and: andQuery } } },
            { $sort: { createdAt: -1 } },
            { $project: { message: 1, createdAt: 1 } },
            {
              $group: {
                _id: null,
                lastMessage: { $first: "$message" },
                createdAt: { $first: "$createdAt" },
              },
            },
          ],
          as: "lastMessage",
        },
      },
      {
        $lookup: {
          from: "messages",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $and: [{ $eq: ["$seen", false] }, ...andQuery] },
              },
            },
            { $project: { message: 1 } },
            { $group: { _id: null, count: { $sum: 1 } } },
          ],
          as: "unseenMsgCount",
        },
      },
      { $unwind: { path: "$lastMessage", preserveNullAndEmptyArrays: true } },
      {
        $unwind: { path: "$unseenMsgCount", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          username: 1,
          email: 1,
          profileImg: 1,
          lastMessage: {
            $cond: {
              if: { $ne: ["$lastMessage", null] },
              then: "$lastMessage.lastMessage",
              else: "",
            },
          },
          lastMessageDate: {
            $cond: {
              if: { $ne: ["$lastMessage", null] },
              then: "$lastMessage.createdAt",
              else: null,
            },
          },
          unseenMsgCount: {
            $cond: {
              if: { $ne: ["$unseenMsgCount", null] },
              then: "$unseenMsgCount.count",
              else: 0,
            },
          },
        },
      },
      { $sort: { lastMessageDate: -1 } },
    ]);

    return res.success(users);
  } catch (e) {
    console.log(e);
    return res.error(e);
  }
});

module.exports = router;
