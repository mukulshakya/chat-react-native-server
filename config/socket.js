const User = require("../models/user");
const Message = require("../models/message");

let users = {};
module.exports = (server) => {
  const io = require("socket.io")(server);

  io.on("connection", (socket) => {
    console.log(
      `Socket server up on ${process.env.PORT || 8000} | id - ${socket.id}`
    );

    socket.on("join", ({ senderId }) => {
      console.log("joined");
      users[senderId] = socket.id;
      socket.senderId = senderId;

      User.findById(senderId).then((user) => {
        socket.sender = user;
        const { username } = user;
        io.emit("online", { message: `${username} joined!`, userId: senderId });
      });
      console.log({ users });
    });

    socket.on("disconnected", () => {
      console.log("disconnect");
      console.log({ users });
      const index = Object.values(users).indexOf(socket.id);
      const key = Object.keys(users)[index];
      delete users[key];

      console.log({ users });

      io.emit("offline", { userId: key });
    });

    socket.on("send_message", async ({ message, receiverId }) => {
      const {
        senderId,
        sender: { username },
      } = socket;

      const newMsg = await new Message({
        senderId,
        receiverId,
        message,
      }).save();

      socket.to(users[receiverId]).emit("receive_message", {
        username,
        message,
        senderId,
        receiverId,
        msgData: newMsg,
      });
    });
  });
};
