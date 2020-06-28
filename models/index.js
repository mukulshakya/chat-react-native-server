const mongoose = require("mongoose");

module.exports = async ({ db: { url, options } }) => {
  try {
    connectionUri = process.env.NODE_ENV === "production" ? url.production : url.local;
    await mongoose.connect(connectionUri, options);
    console.log("Mongoose connection success");
  } catch (e) {
    console.log("Mongoose connection error", e.message);
  }
};
