const {
  Schema,
  model,
  SchemaTypes: { ObjectId },
} = require("mongoose");

const objectIdRequired = {
  type: ObjectId,
  ref: "users",
  required: true,
};

const messageSchema = new Schema(
  {
    senderId: objectIdRequired,
    receiverId: objectIdRequired,
    message: {
      type: String,
      validate: [
        function (value) {
          return value.trim();
        },
        "Message should not be empty",
      ],
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = model("messages", messageSchema);
