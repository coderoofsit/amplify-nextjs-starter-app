const express = require("express");
const { signup, login } = require("../controller/teacherController");
const { teacherAuth } = require("../middleware/teacherAuth");
const app = express.Router();

app.post("/signup", signup);

app.post("/login", login);

module.exports = app;
