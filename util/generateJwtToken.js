const jwt = require("jsonwebtoken")
const {
  jwt: { secret, options },
} = require("config");

module.exports = (payload) =>
  new Promise((resolve, reject) => {
    jwt.sign(payload, secret, options, (err, token) => {
      if (err) reject(err);
      resolve(token);
    });
  });
