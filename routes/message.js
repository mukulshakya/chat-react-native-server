const express = require("express");
const router = new express.Router();
const {
  Types: { ObjectId },
} = require("mongoose");
const Message = require("../models/message");
const auth = require("../middleware/auth");

// router.route("/:receiverId").get(auth, async (req, res) => {
//   try {
//     const { page } = req.query;
//     const receiverId = ObjectId(req.params.receiverId);
//     const senderId = ObjectId(req.user.id);

//     const messages = await Message.aggregate([
//       {
//         $match: {
//           $or: [
//             { receiverId: receiverId, senderId: senderId },
//             { receiverId: senderId, senderId: receiverId },
//           ],
//         },
//       },
//       {
//         $lookup: {
//           from: "users",
//           localField: "senderId",
//           foreignField: "_id",
//           as: "sender",
//         },
//       },
//       {
//         $lookup: {
//           from: "users",
//           localField: "receiverId",
//           foreignField: "_id",
//           as: "receiver",
//         },
//       },
//       { $unwind: "$sender" },
//       { $unwind: "$receiver" },
//       {
//         $project: {
//           message: 1,
//           createdAt: 1,
//           sender: { _id: 1, firstName: 1, lastName: 1, email: 1, mobile: 1 },
//           receiver: { _id: 1, firstName: 1, lastName: 1, email: 1, mobile: 1 },
//         },
//       },
//       { $sort: { createdAt: -1 } },
//       { $skip: page ? parseInt(page) - 1 * 100 : 0 },
//       { $limit: 50 },
//     ]);

//     return res.ok(messages.reverse());
//   } catch (error) {
//     return res.error(error);
//   }
// });

router.route("/personal/chats").get(auth, async (req, res) => {
  try {
    const ownerId = ObjectId(req.user.id);

    const chats = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: ownerId }, { receiverId: ownerId }],
        },
      },
      {
        $project: {
          message: 1,
          owner: {
            $cond: {
              if: { $eq: ["$senderId", ownerId] },
              then: "$senderId",
              else: "$receiverId",
            },
          },
          otherUser: {
            $cond: {
              if: { $ne: ["$senderId", ownerId] },
              then: "$senderId",
              else: "$receiverId",
            },
          },
        },
      },
      { $group: { _id: "$otherUser" } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: "$user._id",
          firstName: "$user.firstName",
          lastName: "$user.lastName",
          email: "$user.email",
          mobile: "$user.mobile",
        },
      },
    ]);

    return res.ok(chats);
  } catch (error) {
    return res.error(error);
  }
});

module.exports = router;
