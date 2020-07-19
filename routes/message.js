const express = require("express");
const router = new express.Router();
const {
  Types: { ObjectId },
} = require("mongoose");
const Message = require("../models/message");
const auth = require("../middleware/auth");

const msgMatchQuery = (req) => {
  const receiverId = ObjectId(req.params.receiverId);
  const senderId = ObjectId(req.user._id);
  return {
    $or: [
      { receiverId: receiverId, senderId: senderId },
      { receiverId: senderId, senderId: receiverId },
    ],
  };
};

router
  .route("/messages/:receiverId")
  .post(auth, async (req, res) => {
    try {
      const receiverId = ObjectId(req.params.receiverId);
      const senderId = ObjectId(req.user._id);

      const message = await new Message({
        senderId,
        receiverId,
        message: req.body.message,
      }).save();

      return res.success(message, "Message saved successfully");
    } catch (error) {
      return res.error(error);
    }
  })
  .get(auth, async (req, res) => {
    try {
      const { page } = req.query;
      const senderId = ObjectId(req.user._id);

      const query = { ...msgMatchQuery(req) };
      const userProjection = { _id: 1, username: 1, email: 1, profileImg: 1 };

      const messages = await Message.aggregate([
        { $match: query },
        {
          $lookup: {
            from: "users",
            localField: "senderId",
            foreignField: "_id",
            as: "sender",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "receiverId",
            foreignField: "_id",
            as: "receiver",
          },
        },
        { $unwind: "$sender" },
        { $unwind: "$receiver" },
        {
          $project: {
            isCurrentUserSender: {
              $cond: {
                if: { $eq: ["$senderId", senderId] },
                then: true,
                else: false,
              },
            },
            message: 1,
            createdAt: 1,
            sender: userProjection,
            receiver: userProjection,
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: page ? (parseInt(page) - 1) * 50 : 0 },
        { $limit: 50 },
      ]);

      const unseenMsgCount = await Message.find({
        seen: false,
        ...query,
      }).countDocuments();

      return res.success({ messages: messages.reverse(), unseenMsgCount });
    } catch (error) {
      return res.error(error);
    }
  })
  .patch(auth, async (req, res) => {
    try {
      const seenUntilMsgId = ObjectId(req.body.seenUntilMsgId);
      const seenUntilMsg = await Message.findById(seenUntilMsgId);

      const updateReadStatusToSeen = await Message.updateMany(
        {
          createdAt: { $lte: seenUntilMsg.createdAt },
          ...msgMatchQuery(req),
        },
        { seen: true }
      );

      return res.success(updateReadStatusToSeen, "Message saved successfully");
    } catch (error) {
      return res.error(error);
    }
  });

// router.route("/personal/chats").get(auth, async (req, res) => {
//   try {
//     const ownerId = ObjectId(req.user.id);

//     const chats = await Message.aggregate([
//       {
//         $match: {
//           $or: [{ senderId: ownerId }, { receiverId: ownerId }],
//         },
//       },
//       {
//         $project: {
//           message: 1,
//           owner: {
//             $cond: {
//               if: { $eq: ["$senderId", ownerId] },
//               then: "$senderId",
//               else: "$receiverId",
//             },
//           },
//           otherUser: {
//             $cond: {
//               if: { $ne: ["$senderId", ownerId] },
//               then: "$senderId",
//               else: "$receiverId",
//             },
//           },
//         },
//       },
//       { $group: { _id: "$otherUser" } },
//       {
//         $lookup: {
//           from: "users",
//           localField: "_id",
//           foreignField: "_id",
//           as: "user",
//         },
//       },
//       { $unwind: "$user" },
//       {
//         $project: {
//           _id: "$user._id",
//           firstName: "$user.firstName",
//           lastName: "$user.lastName",
//           email: "$user.email",
//           mobile: "$user.mobile",
//         },
//       },
//     ]);

//     return res.ok(chats);
//   } catch (error) {
//     return res.error(error);
//   }
// });

module.exports = router;
