const {
  Schema,
  model,
  SchemaTypes: { ObjectId },
} = require("mongoose");

const postSchema = new Schema(
  {
    userId: { type: ObjectId, ref: "users" },
    image: { type: String, required: true },
    caption: { type: String, trim: true },
    fullImageResponse: String,
  },
  { timestamps: true }
);

module.exports = model("posts", postSchema);
