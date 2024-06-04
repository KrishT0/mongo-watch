const express = require("express");
const mongoose = require("mongoose");
const socketIo = require("socket.io");
const http = require("http");
require("dotenv").config();

// Connect to MongoDB using URI
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

// Create Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Define routes and middleware
app.use(express.json());

// Define a schema
const userSchema = new mongoose.Schema({
  teacher_id: Number,
  name: String,
  salary: Number,
  age: Number,
});

// Define a model
const User = mongoose.model("User", userSchema);

io.on("connection", (socket) => {
  console.log("Client connected");

  // mongo-watch
  let count = 0;
  const changeStream = User.watch();
  changeStream.on("change", (change) => {
    if (change.operationType === "insert") {
      const user = change.fullDocument;
      if (user.age >= 40) {
        count++;
        console.log(`Count: ${count}`);
        // Emit the count to the frontend
        socket.emit("count", count);
      }
    }
  });

  // Disconnect event
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// Create a new user
app.post("/users", async (req, res) => {
  const user = new User(req.body);
  await user.save();
  res.send(user);
});

// Get all users
app.get("/users", async (req, res) => {
  const users = await User.find();
  res.send(users);
});

// Start the server
const port = 3000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
