const teacherModel = require("../models/teacher.model");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const userModel = require("../models/user.model");
require("dotenv").config();

// In-memory storage for failed login attempts
const failedLoginAttempts = {};

// Lockout duration in milliseconds (2 minutes)
const LOCKOUT_DURATION = 2 * 60 * 1000;

// Teacher Signup
const signup = async (req, res) => {
  const { email, password, role } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Your Email is required" });
  }
  if (!password) {
    return res.status(400).json({ error: "Your Password is required" });
  }

  try {
    const teacher = await teacherModel.findOne({ email });
    if (teacher) {
      return res.status(409).json({ message: "teacher already exists" });
    } else {
      await teacherModel.create({
        email,
        password,
        role,
      });
      return res.status(200).json({ message: "teacher created successfully" });
    }
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: e.message });
  }
};

// teacher Login
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Your Email is required" });
  }

  if (!password) {
    return res.status(400).json({ error: "Your Password is required" });
  }

  try {
    const teacher = await teacherModel.findOne({ email });

    if (teacher) {
      // Check if the teacher is currently locked out
      const lastFailedAttempt = failedLoginAttempts[teacher.email];
      if (lastFailedAttempt && Date.now() - lastFailedAttempt < LOCKOUT_DURATION) {
        return res.status(401).json({ error: "Account locked. Try again later." });
      }

      if (teacher.password === password) {
        // Reset failed attempts upon successful login
        delete failedLoginAttempts[teacher.email];

        let token = jwt.sign(
          { teacherId: teacher._id, email: teacher.email },
          process.env.PRIVATEKEY
        );

        res.status(200).send({ message: "Login Successful", token, name: teacher.name });
      } else {
        // Increment failed attempts and store the timestamp
        failedLoginAttempts[teacher.email] = Date.now();
        res.status(401).send({ message: "Login Failed" });
      }
    } else {
      res.status(404).send("You are not a registered teacher");
    }
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

module.exports = {
    signup,
    login,
   
  };
  