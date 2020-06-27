const jwt = require("jsonwebtoken");
const {
  jwt: { secret },
} = require("config");
const User = require("../models/user");

module.exports = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.id);
    if (!user) return res.unAuth({}, "Unable to authenticate");

    req.token = token;
    req.user = user;
    next();
  } catch (e) {
    res.unAuth({}, "Unable to authenticate");
  }
};
