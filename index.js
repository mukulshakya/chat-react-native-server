const express = require("express");
const app = express();
const server = require("http").createServer(app);
const winston = require("winston");
const expressWinston = require("express-winston");
process.env["NODE_CONFIG_DIR"] = __dirname + "/config";
const config = require("config");

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
  const fullUrl = req.protocol + "://" + req.get("host") + req.originalUrl;
  return res.success(fullUrl, "Server running on " + port);
});

// Routes
app.use(require("./routes/user"));
app.use(require("./routes/message"));
app.use(require("./routes/post"));

// Error handler
app.use(async (error, req, res, next) => {
  return res.error(error);
});

server.listen(port, () => console.log("Server running on " + port));

require("./models")(config);
require("./config/socket")(server);
