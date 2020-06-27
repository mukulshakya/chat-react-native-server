const express = require("express");
const app = express();
const server = require("http").createServer(app);
const bcrypt = require("bcrypt");
const winston = require("winston");
const expressWinston = require("express-winston");
process.env["NODE_CONFIG_DIR"] = __dirname + "/config";
const config = require("config");

const reqBodyValidator = require("./middleware/requestBodyValidator");
const generateJwtToken = require("./util/generateJwtToken");
const User = require("./models/user");
const auth = require("./middleware/auth");

const port = process.env.PORT || 8000;

app.use(require("cors")());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  expressWinston.logger({
    transports: [new winston.transports.Console()],
    format: winston.format.combine(
      // winston.format.colorize(),
      winston.format.json()
    ),
    requestWhitelist: ["query", "body", "headers"],
    bodyBlacklist: ["password", "confirmPassword"],
    responseWhitelist: ["body"],
    meta: true,
    expressFormat: true,
  })
);

app.use((req, res, next) => {
  Object.assign(res, require("./util/responseSender"));
  next();
});

app.get("/", async (req, res) => {
  return res.success({}, "Server running on 8080");
});

app.post("/register", reqBodyValidator("register"), async (req, res) => {
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

app.post("/login", reqBodyValidator("login"), async (req, res) => {
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

app.get("/profile", auth, async (req, res) => {
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

// Error handler
app.use(async (error, req, res, next) => {
  return res.error(error);
});

server.listen(port, () => console.log("Server running on " + port));

require("./models")(config);
