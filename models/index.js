const mongoose = require("mongoose");

module.exports = async ({ db: { url, options } }) => {
  try {
    await mongoose.connect(url, options);
    console.log("Mongoose connection success");
  } catch (e) {
    console.log("Mongoose connection error", e.message);
  }
};
