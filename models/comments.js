const {
  Schema,
  model,
  SchemaTypes: { ObjectId },
} = require("mongoose");

const commentSchema = new Schema(
  {
    userId: { type: ObjectId, ref: "users", required: true },
    postId: { type: ObjectId, ref: "posts", required: true },
    comment: { type: String, trim: true, required: true },
  },
  { timestamps: true }
);

module.exports = model("comments", commentSchema);
