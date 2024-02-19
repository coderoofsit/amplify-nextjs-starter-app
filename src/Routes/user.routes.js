const express = require("express");
require("dotenv").config();
const {
  signup,
  login,
  resendOTP,
  verifySignupOTP,
  verifyLoginOTP,
  getUserProfileByToken,
  editUserProfile,
  getAllAds,
  getCourses,
  getAllQuizzes,
  getAllFeaturedCourses,
  getAllPlans,
  getAllStuff,
  uploadProfilePic,
  sendFeedback,
  getFeedback,
  getFeedbackById,
  createPaymentIntent,
  getSyllabus,
  getResult,
  saveFcmToken,
  addMarks,
  getMarks,
  getUserRanks,
  getLeaderboard,
  saveUserAttempt,
  getSavedAttempts,
  getactiveCourse,
  getPaymentDetails,
  getPurchasedPlanById,
  getAllPosters,
  getCoursesById,
  deleteUser,
  getallnotifications
} = require("../controller/userController");
const { auth } = require("../middleware/auth");
const PurchasedPlan = require("../models/PurchasedPlan.model"); 

const app = express.Router();

app.post("/signup", signup);

app.post("/login", login);

app.post("/resendOTP",resendOTP)

app.post("/save-fcm", auth, saveFcmToken);

app.post("/verifySignupOTP", verifySignupOTP);

app.post("/verifyLoginOTP", verifyLoginOTP);

app.get("/getUserProfileByToken", auth, getUserProfileByToken);

app.put("/editUserProfile", auth, editUserProfile);

app.put("/upload-profile-pic", auth, uploadProfilePic);

app.get("/getAllAds", auth, getAllAds);

app.get("/getCourses", auth, getCourses);

app.get("/getAllQuizzes", auth, getAllQuizzes);

app.get("/getAllFeaturedCourses", auth, getAllFeaturedCourses);

app.get("/getAllPlans", auth, getAllPlans);

app.get("/getAllStuff", auth, getAllStuff);

app.post("/send-feedback", auth, sendFeedback);

app.get("/feedback", getFeedback);

app.get("/feedback/:feedbackId", getFeedbackById);

app.post("/createPaymentIntent", auth, createPaymentIntent);

app.get("/getSyllabus", auth, getSyllabus);

app.get("/getResult", auth, getResult);

app.post("/addMarks", auth, addMarks);

app.get("/getMarks/:courseId", auth, getMarks);

app.get("/getUserRanks", auth, getUserRanks);

app.get("/getLeaderboard", auth, getLeaderboard);

app.post("/saveUserAttempt", auth, saveUserAttempt);

app.get("/getSavedAttempts", auth, getSavedAttempts);

app.get("/getactiveCourse", auth, getactiveCourse);

app.get("/getPaymentDetails", auth, getPaymentDetails);

app.get("/getAllPosters",auth,getAllPosters)

app.get("/getPurchasedPlanById",auth,getPurchasedPlanById)

app.get("/getCoursesById/:courseId?",auth,getCoursesById)

app.delete("/deleteUser",auth,deleteUser)

app.get("/getallnotifications",auth,getallnotifications)

app.post('/update-payment-status', async (req, res) => {
  try {
    console.log('Received update payment status request:', req.body);
    const { transactionId, paymentStatus } = req.body;

    if (!paymentStatus) {
      return res.status(400).json({ success: false, message: 'Payment status is required' });
    }

    const purchasedPlan = await PurchasedPlan.findOne({ transactionId });

    if (!purchasedPlan) {
      return res.status(404).json({ success: false, message: 'PurchasedPlan not found' });
    }

    // Update the paymentStatus to the received value
    purchasedPlan.paymentStatus = paymentStatus;
    await purchasedPlan.save();

    return res.status(200).json({ success: true, message: 'Payment status updated successfully' });
  } catch (error) {
    console.error('Error updating payment status:', error);

    // Send the error details in the response for debugging
    return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});


module.exports = app;
