const {
  Schema,
  model,
  SchemaTypes: { ObjectId },
} = require("mongoose");

const likeSchema = new Schema(
  {
    userId: { type: ObjectId, ref: "users", required: true },
    postId: { type: ObjectId, ref: "posts", required: true },
  },
  { timestamps: true }
);

module.exports = model("likes", likeSchema);
