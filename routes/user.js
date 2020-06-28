const express = require("express");
const router = new express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/user");
const auth = require("../middleware/auth");
const generateJwtToken = require("../util/generateJwtToken");
const reqBodyValidator = require("../middleware/requestBodyValidator");

router
  .route("/register")
  .post(reqBodyValidator("register"), async (req, res) => {
    try {
      const { email, password } = req.body;
      const alreadyRegistered = await User.findOne({ email });
      if (alreadyRegistered) return res.error({}, "Email already registered");

      const hashedPassword = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
      const user = await new User({
        ...req.body,
        password: hashedPassword,
      }).save();
      const token = await generateJwtToken({ id: user._id });
      return res.success(
        { token: "Bearer " + token, user },
        "User registered successfully"
      );
    } catch (e) {
      console.log({ e });
      return res.error(e);
    }
  });

router.route("/login").post(reqBodyValidator("login"), async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.error({}, "Email not found");

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) return res.error({}, "Incorrect password");

    const token = await generateJwtToken({ id: user._id });
    return res.success({ token: "Bearer " + token, user }, "Login success");
  } catch (e) {
    console.log(e);
    return res.error(e);
  }
});

router.route("/profile").get(auth, async (req, res) => {
  try {
    const { _id: userId } = req.user;
    const user = await User.findById(userId);
    if (!user) return res.error({}, "User not found");
    return res.success(user);
  } catch (e) {
    console.log(e);
    return res.error(e);
  }
});

router.route("/users").get(auth, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } });
    res.success(users);
  } catch (e) {
    console.log(e);
    return res.error(e);
  }
});

module.exports = router;
