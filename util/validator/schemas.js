const { Validator } = require("./validator");

module.exports = {
  username: () => new Validator("username").min(3).max(20).required(),
  email: () => new Validator("email").email().required(),
  password: () => new Validator("password").min(8).max(20).required(),
};
