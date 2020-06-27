const { Schema, model } = require("mongoose");

const UserSchema = new Schema(
  {
    username: {
      type: String,
      lowercase: true,
      trim: true,
      unique: true,
      required: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      unique: true,
      required: true,
    },
    password: { type: String, trim: true, required: true },
    profileImg: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = model("users", UserSchema);
