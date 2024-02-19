const adminModel = require("../models/admin.model");
const jwt = require("jsonwebtoken");
const PlanModel = require("../models/plan.model");
const adModel = require("../models/Ads.model");
const quizModel = require("../models/quiz.model");
const mongoose = require("mongoose");
const teacherModel = require("../models/teacher.model");
const PurchasedPlan = require("../models/PurchasedPlan.model");
const PosterModel = require("../models/poster.model");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const moment = require("moment-timezone");
const normalNotification = require("../models/normalNotification.model")
// const xlsx = require("exceljs");
const xlsx = require("xlsx");
const Feedback = require('../models/feedback.model');
const cron = require("node-cron");
const userModel = require("../models/user.model");
const StuffModel = require("../models/stuff.model");
const FeaturedModel = require("../models/featured.model");
const ActivecourseModel = require("../models/activecourse.model");
const { CourseModel } = require("../models/Course.Model");
const Payment = require("../models/payment.model");
require("dotenv").config();
const Result = require("../models/result.model");
const SyllabusModel = require("../models/syllabus.model");
const Marks = require("../models/marks.model");
const { sendNotification } = require("../firebase/PushNotification");
const FCM = require("../models/fcmToken.model");
const AWS = require("aws-sdk");
const S3 = require("aws-sdk/clients/s3");

// In-memory storage for failed login attempts for admins
const failedLoginAttempts = {};

// Lockout duration in milliseconds (1 minute)
const LOCKOUT_DURATION = 1 * 60 * 1000;

const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;
const s3 = new S3({
  region,
  accessKeyId,
  secretAccessKey,
});

const config = new AWS.Config({
  region,
  accessKeyId,
  secretAccessKey,
});

// Function to upload a file to S3
const uploadObject = function (file, folder, userId) {
  const uploadParams = {
    Bucket: `${bucketName}/${folder}/${userId}`,
    Body: Buffer.from(file.data),
    Key: file.name,
    ACL: "public-read",
  };
  console.log("Upload Params:", uploadParams);
  return s3.upload(uploadParams).promise();
};
const uploadAdsObject = async function (file, folder, userId) {
  try {
    const fileData = fs.readFileSync(file.tempFilePath); // Use file.tempFilePath to read the file data
    console.log("File Data Size:", fileData.length);

    const uploadParams = {
      Bucket: `${bucketName}/${folder}/${userId}`,
      Body: fileData,
      Key: file.name, // Use file.name as the key
      ACL: "public-read",
    };

    const uploadResult = await s3.upload(uploadParams).promise();
    console.log("File Uploaded Successfully:", uploadResult.Location);

    return uploadResult;
  } catch (uploadError) {
    console.error("Error uploading file:", uploadError);
    throw uploadError;
  }
};

// Admin Signup
const signup = async (req, res) => {
  const { email, password, role } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Your Email is required" });
  }
  if (!password) {
    return res.status(400).json({ error: "Your Password is required" });
  }

  try {
    const admin = await adminModel.findOne({ email });
    if (admin) {
      return res.status(409).json({ message: "Admin already exists" });
    } else {
      await adminModel.create({
        email,
        password,
        role,
      });
      return res.status(200).json({ message: "Admin created successfully" });
    }
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: e.message });
  }
};

// Admin Login
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Your Email is required" });
  }

  if (!password) {
    return res.status(400).json({ error: "Your Password is required" });
  }

  try {
    const admin = await adminModel.findOne({ email });

    if (admin) {
      // Check if the admin is currently locked out
      const lastFailedAttempt = failedLoginAttempts[admin.email];
      if (
        lastFailedAttempt &&
        Date.now() - lastFailedAttempt < LOCKOUT_DURATION
      ) {
        // Calculate the remaining lockout time
        const remainingLockoutTime =
          LOCKOUT_DURATION - (Date.now() - lastFailedAttempt);

        return res.status(401).json({
          error: "Account locked. Try again later.",
          remainingLockoutTime,
        });
      }

      if (admin.password === password) {
        // Reset failed attempts upon successful login
        delete failedLoginAttempts[admin.email];

        let token = jwt.sign(
          { adminId: admin._id, email: admin.email },
          process.env.PRIVATEKEY
        );

        res
          .status(200)
          .send({ message: "Login Successful", token, name: admin.name });
      } else {
        // Increment failed attempts and store the timestamp
        failedLoginAttempts[admin.email] = Date.now();
        res.status(401).send({ message: "Login Failed" });
      }
    } else {
      res.status(404).send("You are not a registered admin");
    }
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

// Fetch All User Data
const getAllUsers = async (req, res) => {
  try {
    const users = await userModel.find({ $or: [{ isTemp: false }, { isTemp: { $exists: false } }] });
    return res.status(200).json({ users });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
};



// Block and Unblock User
const blockUnblockUser = async (req, res) => {
  const { userId, isBlocked } = req.body;

  if (!userId || isBlocked === undefined) {
    return res
      .status(400)
      .json({ error: "User ID and isBlocked status are required" });
  }

  try {
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.isBlocked = isBlocked;
    await user.save();

    const action = isBlocked ? "blocked" : "unblocked";
    return res.status(200).json({ message: `User has been ${action}` });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Create an Ad
const createAd = async (req, res) => {
  const { adsLink } = req.body;
  const adsPictures = req.files.adsPictures;

  // Additional logging to help identify the issue
  console.log("Uploaded Files:", adsPictures);

  try {
    let uploadedPictures;

    // Check if adsPictures is provided and has valid properties
    if (
      adsPictures &&
      typeof adsPictures === "object" &&
      adsPictures.name &&
      adsPictures.data
    ) {
      uploadedPictures = await uploadAdsObject(adsPictures, "ads", req.userId);
    } else {
      return res.status(400).json({ error: "AdsPictures are required" });
    }

    const adData = { adsPictures: [uploadedPictures.Location] };

    // Check if adsLink is provided and not empty
    if (adsLink) {
      adData.adsLink = adsLink;
    }

    const ad = await adModel.create(adData);

    return res.status(200).json({ message: "Ad created successfully", ad });
  } catch (e) {
    console.error("console error", e);
    return res.status(500).json({ error: e.message });
  }
};

// Fetch All Ads
const getAllAds = async (req, res) => {
  try {
    const ads = await adModel.find();
    return res.status(200).json({ ads });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Edit an Ad
const editAdById = async (req, res) => {
  const { adId, adsLink } = req.body;

  if (!adId || !adsLink) {
    return res.status(400).json({
      error: "Ad ID and AdsLink must be provided",
    });
  }

  try {
    const ad = await adModel.findById(adId);

    if (!ad) {
      return res.status(404).json({ error: "Ad not found" });
    }

    let updatedPictures = ad.adsPictures;

    // Check if there are new pictures to upload
    if (req.files && req.files.adsPictures) {
      const newPictures = Array.isArray(req.files.adsPictures)
        ? req.files.adsPictures
        : [req.files.adsPictures];

      // Upload new pictures to AWS S3
      const uploadedPictures = await Promise.all(
        newPictures.map(async (picture) => {
          // Pass the correct userId here
          const uploadedPicture = await uploadObject(
            picture,
            "ads",
            req.userId
          );
          return uploadedPicture.Location;
        })
      );

      // Combine existing pictures with newly uploaded pictures
      updatedPictures = uploadedPictures;
    }

    ad.adsPictures = updatedPictures;
    ad.adsLink = adsLink;
    await ad.save();

    return res.status(200).json({ message: "Ad edited successfully", ad });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
};

// Delete an Ad
const deleteAdById = async (req, res) => {
  const { adId } = req.params;

  if (!adId) {
    return res.status(400).json({ error: "Ad ID must be provided" });
  }

  try {
    await adModel.findByIdAndRemove(adId);

    return res.status(200).json({ message: "Ad deleted successfully" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
};

const getUserDetails = async () => {
  try {
    // Fetch all FCM data
    const fcmData = await FCM.find();

    // Fetch all purchase plans with user details
    const allPurchasePlans = await PurchasedPlan.find().populate('userId');

    // Create a map to store user IDs and their corresponding FCM tokens
    const userDataMap = {};

    // Iterate over FCM data to populate the map
    fcmData.forEach((fcm) => {
      if (!userDataMap[fcm.userId]) {
        userDataMap[fcm.userId] = {
          fcmTokens: [],
          paymentStatus: false,
          userName: 'Unknown User'
        };
      }
      userDataMap[fcm.userId].fcmTokens.push(fcm.token);
    });

    // Iterate over purchase plans to update payment status and user name
    allPurchasePlans.forEach((purchasePlan) => {
      if (purchasePlan.userId && purchasePlan.userId._id && purchasePlan.userId.name) { // Check if userId and name are not null
        const userId = purchasePlan.userId._id.toString();
        if (userDataMap[userId]) {
          userDataMap[userId].paymentStatus = purchasePlan.paymentStatus;
          userDataMap[userId].userName = purchasePlan.userId.name;
        }
      }
    });

    // Convert userDataMap to an array of objects
    const userDataArray = Object.entries(userDataMap).map(([userId, userData]) => ({
      userId,
      fcmTokens: userData.fcmTokens,
      paymentStatus: userData.paymentStatus,
      userName: userData.userName
    }));

    // Filter out users with payment status false
    const usersWithTruePaymentStatus = userDataArray.filter(user => user.paymentStatus);

    return usersWithTruePaymentStatus;
  } catch (error) {
    console.error("Error fetching user data with FCM and payment status:", error);
    throw error; // Rethrow the error to handle it in the caller function
  }
};


const sendNotificationToQuizUsers = async (message) => {
  try {
    // Fetch user details including payment status
    const userDetails = await getUserDetails();

    // Filter users with payment status true
    const usersWithPaymentStatusTrue = userDetails.filter(user => user.paymentStatus);

    // Iterate over users with payment status true to send notifications
    for (const user of usersWithPaymentStatusTrue) {
      // Send notification to each user
      for (const fcmToken of user.fcmTokens) {
        await sendNotification(fcmToken, {
          title: "New Quiz available",
          body: message,
          // Add other properties as needed
        });
      }
    }

    console.log("Notifications sent successfully to users with payment status true.");
  } catch (error) {
    console.error("Error sending notification to quiz users:", error);
    throw error; // Rethrow the error to handle it in the caller function
  }
};



// Create a Quiz
const createQuiz = async (req, res) => {
  console.log("Request Payload:", req.body);
  console.log("File Details:", req.files);

  const {
    date,
    CourseId,
    startTime,
    endTime,
    resultTime,
    duration,
    totalMarks,
    negativeMarking,
    testSeriesName,
    testSeriesDescription,
  } = req.body;

  try {
    // Convert the received date and time to IST
    const istStartTime = new Date(`${date}T${startTime}Z`);
    const istEndTime = new Date(`${date}T${endTime}Z`);
    const istResultTime = new Date(`${date}T${resultTime}Z`)

    // Convert IST times to GMT for consistent storage
    const gmtStartTime = new Date(
      istStartTime.getTime() + istStartTime.getTimezoneOffset() * 60000
    );
    const gmtEndTime = new Date(
      istEndTime.getTime() + istEndTime.getTimezoneOffset() * 60000
    );
    const gmtResultTime = new Date(
      istResultTime.getTime() + istResultTime.getTimezoneOffset() *60000
    );

    const options = { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };
    const notificationMessage = `A new quiz "${testSeriesName}" has been created! It will start at ${gmtStartTime.toLocaleString('en-US', options)}. Be ready and happy learning! Results will be declared at ${gmtResultTime.toLocaleString('en-US', options)}.`;
    



     // Call function to send notifications to all users
     await sendNotificationToQuizUsers(notificationMessage);

    const excelFile = req.files && req.files.excelFile;
    const quizImages = req.files && req.files.quizImages;

    // Upload quiz images to AWS S3
    let uploadedImages;
    if (quizImages) {
      const imagesArray = Array.isArray(quizImages) ? quizImages : [quizImages];

      uploadedImages = await Promise.all(
        imagesArray.map(async (image) => {
          try {
            // Read the image data using fs.readFileSync
            const imageData = fs.readFileSync(image.tempFilePath);
            console.log("Image Data Size:", imageData.length);

            // Upload the image data to S3
            const uploadedImage = await uploadObject(
              { data: imageData, name: image.name },
              "quiz-images",
              req.userId
            );

            console.log("Image Uploaded Successfully:", uploadedImage.Location);
            return uploadedImage.Location;
          } catch (uploadError) {
            console.error("Error uploading image:", uploadError);
            throw uploadError; // Rethrow the error to break out of Promise.all
          }
        })
      );
    }

    if (!excelFile) {
      console.error("Excel file is missing in the request");
      return res.status(400).json({ error: "Excel file is required" });
    }

    console.log("Processing Excel file...");

    const fileBuffer = fs.readFileSync(excelFile.tempFilePath);

    console.log("File Buffer Length:", fileBuffer.length);

    const workbook = xlsx.read(fileBuffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const xlsxQuestions = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    // Skip the first row (header) when processing questions
    const questions = xlsxQuestions.slice(1).map((row) => ({
      question: row[0],
      options: [row[1], row[2], row[3], row[4]],
      correctOption: row[5],
      marks: row[6],
    }));

    console.log("Processed Questions:", questions);

    const isValidXlsxData = questions.every((question) => {
      return (
        question.question &&
        Array.isArray(question.options) &&
        question.options.length === 4 &&
        typeof question.correctOption === "number" &&
        typeof question.marks === "number"
      );
    });

    if (!isValidXlsxData) {
      console.error("Invalid structure in Excel file questions");
      return res
        .status(400)
        .json({ error: "Invalid structure in Excel file questions." });
    }

    const quizData = {
      timestamp: new Date(),
      testSeriesName,
      CourseId,
      testSeriesDescription,
      date,
      startTime: gmtStartTime,
      endTime: gmtEndTime,
      resultTime : gmtResultTime,
      duration,
      totalMarks,
      negativeMarking,
      images: uploadedImages || [],
      questions,
    };

    const quiz = await quizModel.create(quizData);

    const notificationData = {
      heading: "New Quiz available!",
      title: testSeriesName,
      message: `A new quiz "${testSeriesName}" has been created! It will start at ${gmtStartTime.toLocaleString('en-US', options)}. Be ready and happy learning! Results will be declared at ${gmtResultTime.toLocaleString('en-US', options)}.`,
     time:gmtStartTime
    };
  
    // Log the notification data before creating it
    console.log("Notification Data:", notificationData);
  
    // Create the notification
    await normalNotification.create(notificationData);

    const formattedQuiz = {
      ...quiz._doc,
      startTime: gmtStartTime.toISOString(),
      endTime: gmtEndTime.toISOString(),
      resultTime: gmtResultTime.toISOString(),
    };

    return res
      .status(200)
      .json({ message: "Quiz created successfully", quiz: formattedQuiz });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ error: `Failed to create the quiz. ${e.message}` });
  }
};


// Fetch All Quizzes
const getAllQuizzes = async (req, res) => {
  try {
    const quizzes = await quizModel.find();
    return res.status(200).json({ quizzes });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
};
// Edit a Quiz by its ID
const editQuizById = async (req, res) => {
  const quizId = req.params.quizId; // Extract the quiz ID from URL parameters
  const { questions } = req.body;

  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({
      error: "At least one question is required in the 'questions' array.",
    });
  }

  try {
    const quiz = await quizModel.findById(quizId);

    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    // Update the quiz's questions with the new questions
    quiz.questions = questions;
    await quiz.save();

    return res.status(200).json({ message: "Quiz edited successfully", quiz });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
};

// Delete a Quiz by its ID
const deleteQuizById = async (req, res) => {
  const quizId = req.params.quizId; // Extract the quiz ID from URL parameters

  if (!quizId) {
    return res.status(400).json({ error: "Quiz ID must be provided" });
  }

  try {
    const quiz = await quizModel.findByIdAndRemove(quizId);

    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    return res.status(200).json({ message: "Quiz deleted successfully" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
};
const createCourseSubjectOption = async (req, res) => {
  const { courses } = req.body;

  try {
    if (!courses || !Array.isArray(courses)) {
      return res.status(400).json({ error: "Invalid input data" });
    }

    const responses = [];

    for (const courseData of courses) {
      if (!courseData.title || !Array.isArray(courseData.subjects)) {
        return res.status(400).json({ error: "Invalid course data" });
      }

      const course = await CourseModel.create({
        title: courseData.title,
        duration: courseData.duration,
        thumbnail: courseData.thumbnail,
        subjects: courseData.subjects.map((subjectData) => {
          if (!subjectData.title || !Array.isArray(subjectData.options)) {
            return res.status(400).json({ error: "Invalid subject data" });
          }

          return {
            title: subjectData.title,
            options: subjectData.options.map((optionData) => {
              if (!optionData.heading || !optionData.url) {
                return res.status(400).json({ error: "Invalid option data" });
              }

              // Check if the subject is "Recorded" and add subjects accordingly
              const subjects =
                optionData.subjects && subjectData.title === "Recorded"
                  ? optionData.subjects.map((subject) => ({
                      title: subject.title,
                      videourls: subject.videourls.map((video) => ({
                        url: video.url,
                        thumbnail: video.thumbnail, // Include the thumbnail field
                      })),
                      pdfsurls: subject.pdfsurls || [],
                    }))
                  : subjectData.title === "Study Material"
                  ? optionData.subjects.map((subject) => ({
                      title: subject.title,
                      videourls: [], // No video URLs for Study Material
                      pdfsurls: subject.pdfsurls || [],
                    }))
                  : [];

              const time =
                subjectData.title === "Live" ? optionData.time : undefined;
              const date =
                subjectData.title === "Live" ? optionData.date : undefined;

              return {
                heading: optionData.heading,
                url: optionData.url,
                thumbnail: optionData.thumbnail,
                batch: optionData.batch,
                Conference_no: optionData.Conference_no,
                subjects,
                time,
                date,
              };
            }),
          };
        }),
      });

      responses.push({ message: "Course created successfully", course });
    }

    // send notification to all users
    const fcmTokens = await FCM.find({});
    for (let i = 0; i < fcmTokens.length; i++) {
      await sendNotification(fcmTokens[i].token, "title", "body");
    }
    return res.status(200).json(responses);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
};
const addSubjectsToCourse = async (req, res) => {
  const courseId = req.params.courseId;
  const newSubjectsData = req.body.newSubjectsData;

  if (!courseId || !newSubjectsData || !Array.isArray(newSubjectsData)) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  try {
    let course = await CourseModel.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Find the "Recorded" section in the course subjects
    const recordedSectionIndex = course.subjects.findIndex(subject => subject.title === 'Recorded');
    if (recordedSectionIndex === -1) {
      return res.status(404).json({ error: 'Recorded section not found in course' });
    }

    // Ensure that the "subjects" property within the "Recorded" section is initialized as an array
    if (!Array.isArray(course.subjects[recordedSectionIndex].subjects)) {
      course.subjects[recordedSectionIndex].subjects = [];
    }

    // Add new subjects to the "subjects" array within the "Recorded" section
    course.subjects[recordedSectionIndex].subjects.push(...newSubjectsData);
    course = await course.save();

    res.status(200).json({ message: 'Subjects added to course successfully', course });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};












const getCourses = async (req, res) => {
  try {
    const courses = await CourseModel.find();
    const formattedCourses = courses.map((course) => {
      return {
        id: course._id,
        title: course.title,
        duration: course.duration,
        thumbnail: course.thumbnail,
        subjects: course.subjects.map((subject) => {
          return {
            id: subject._id,
            title: subject.title,
            options: subject.options.map((option) => {
              const formattedOption = {
                id: option._id,
                heading: option.heading,
                url: option.url,
                thumbnail: option.thumbnail,
                batch: option.batch,
                date: option.date,
                time: option.time,
                Conference_no: option.Conference_no,
                subjects: option.subjects.map((sub) => ({
                  title: sub.title,
                  videourls: sub.videourls || [],
                  pdfsurls: sub.pdfsurls || [],
                })),
              };

              return formattedOption;
            }),
          };
        }),
      };
    });

    return res.status(200).json({ courses: formattedCourses });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error retrieving courses" });
  }
};

// Edit Course
const editCourse = async (req, res) => {
  try {
    // Extract information from the request
    const courseId = req.params.courseId;
    const { title, duration, thumbnail, subjects } = req.body;

    // Find the course by ID
    const course = await CourseModel.findById(courseId);

    // Check if the course exists
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Update the course details
    course.title = title;
    course.duration = duration;
    course.thumbnail = thumbnail;
    course.subjects = subjects;

    // Save the updated course
    await course.save();

    // Return success message and the updated course
    return res
      .status(200)
      .json({ message: "Course edited successfully", course });
  } catch (e) {
    // Handle errors
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
};

const deleteCourse = async (req, res) => {
  const courseId = req.params.courseId; // Use "courseId" as the parameter name

  try {
    // Find the course by ID
    const course = await CourseModel.findById(courseId);

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Delete the course
    await CourseModel.deleteOne({ _id: courseId });

    return res.status(200).json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error deleting course" });
  }
};

// Create a Plans
const createPlan = async (req, res) => {
  const { title, CourseId, plans } = req.body;

  if (
    !title ||
    !CourseId ||
    !plans ||
    !Array.isArray(plans) ||
    plans.length === 0
  ) {
    return res
      .status(400)
      .json({ error: "Title, CourseId, and an array of plans are required" });
  }

  try {
    const plan = await PlanModel.findOne({ title });

    if (!plan) {
      const newPlan = await PlanModel.create({
        title,
        CourseId, // Include CourseId here
        plans,
      });

      return res
        .status(200)
        .json({ message: "Plan created successfully", plan: newPlan });
    } else {
      // If the title already exists, add the new plans to it
      plans.forEach((newPlan) => {
        // Include CourseId for each new plan
        newPlan.CourseId = CourseId;
        plan.plans.push(newPlan);
      });

      await plan.save();

      return res
        .status(200)
        .json({ message: "Plans added to the existing title", plan });
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
};

// Fetch All Plans
const getAllPlans = async (req, res) => {
  try {
    const plans = await PlanModel.find();
    return res.status(200).json({ plans });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Edit a Plan by its ID
const editPlanById = async (req, res) => {
  const planId = req.params.planId;
  const { name, description, price } = req.body;

  if (!name || !description || !price) {
    return res.status(400).json({
      error: "Name, description, and price are required",
    });
  }

  try {
    const plan = await PlanModel.findById(planId);

    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    // Update the plan's details with the new data
    plan.name = name;
    plan.description = description;
    plan.price = price;

    await plan.save();

    return res.status(200).json({ message: "Plan edited successfully", plan });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
};

// Delete a Plan by its ID
const deletePlanById = async (req, res) => {
  const planId = req.params.planId;

  if (!planId) {
    return res.status(400).json({ error: "Plan ID must be provided" });
  }

  try {
    const plan = await PlanModel.findByIdAndRemove(planId);

    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    return res.status(200).json({ message: "Plan deleted successfully" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
};
const updateUpcomingStatus = async (req, res) => {
  const { id } = req.params;

  try {
    // Find the featured course by ID
    const featuredCourse = await FeaturedModel.findById(id);

    if (!featuredCourse) {
      return res.status(404).json({ error: "Featured course not found" });
    }

    // Toggle the 'upComing' field
    featuredCourse.upComing = !featuredCourse.upComing;

    // Save the updated featured course
    await featuredCourse.save();

    return res.status(200).json({
      message: "Featured course updated successfully",
      featuredCourse,
    });
  } catch (error) {
    console.error("Error updating featured course:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};



// Create a new Featured Course
const createFeaturedCourse = async (req, res) => {
  const { featuredHeading, Description, Duration, planId, CourseId } = req.body;

  const { files } = req;

  if (
    !featuredHeading ||
    !Description ||
    !Duration ||
    !files ||
    !files.featuredThumbnail ||
    !files.VideoUrl
  ) {
    return res.status(400).json({
      error: "All fields are required",
    });
  }

  try {
    const uploadThumbnailParams = {
      Bucket: bucketName,
      Body: fs.readFileSync(files.featuredThumbnail.tempFilePath),
      Key: `guru_app/featured/${Date.now()}_${files.featuredThumbnail.name}`,
      ACL: "public-read",
    };

    const uploadVideoParams = {
      Bucket: bucketName,
      Body: fs.readFileSync(files.VideoUrl.tempFilePath),
      Key: `guru_app/featured/${Date.now()}_${files.VideoUrl.name}`,
      ACL: "public-read",
    };

    const [thumbnailUploadResult, videoUploadResult] = await Promise.all([
      s3.upload(uploadThumbnailParams).promise(),
      s3.upload(uploadVideoParams).promise(),
    ]);

    const defaultPlanId = planId || null;
    const defaultCourseId = CourseId || null;

    const featuredCourse = await FeaturedModel.create({
      featuredHeading,
      featuredThumbnail: thumbnailUploadResult.Location,
      Description,
      Duration,
      VideoUrl: videoUploadResult.Location,
      planId: defaultPlanId,
      CourseId: defaultCourseId,
    });


    const notificationData = {
      heading: "New Featured Course Created",
      title: featuredHeading,
      message: `A new featured course titled "${featuredHeading}" has been created with the description: "${Description}".`,
      date: new Date(),
      time: new Date().toISOString(),
    };
  
    // Log the notification data before creating it
    console.log("Notification Data:", notificationData);
  
    // Create the notification
    await normalNotification.create(notificationData);
    
    // Send notification to users
    const notificationMessage = `A new featured course "${featuredHeading}" has been created! Check it out.`;

    // Call a function to send notifications to all users
    await sendNotificationToAllUsers(notificationMessage);

    return res.status(200).json({
      message: "Featured Course created successfully",
      featuredCourse,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: e.message });
  }
};

// Function to send notification to all users
const sendNotificationToAllUsers = async (message) => {
  try {
    // Retrieve all user FCM tokens
    const allUserTokens = await getAllUserTokens();

    // Send notification to each user
    const notificationPromises = allUserTokens.map(async (userToken) => {
      await sendNotification(userToken, {
        title: "New Featured Course Created",
        body: message,
        // Add other properties as needed
      });
    });

    // Wait for all notifications to be sent
    await Promise.all(notificationPromises);
  } catch (error) {
    console.error("Error sending notification to all users:", error);
  }
};

const getAllUserTokens = async () => {
  try {
    const fcmTokens = await FCM.find({}, "token");

    // Extract FCM tokens from the FCM model
    const userTokens = fcmTokens.map((fcm) => fcm.token).filter(Boolean);

    return userTokens;
  } catch (error) {
    console.error("Error fetching FCM tokens:", error);
    return [];
  }
};

// Get All Featured Courses
const getAllFeaturedCourses = async (req, res) => {
  try {
    const featuredCourses = await FeaturedModel.find({});
    return res.status(200).json({ featuredCourses });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const deleteFeaturedCourseById = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if the featured course with the given ID exists
    const existingCourse = await FeaturedModel.findById(id);

    if (!existingCourse) {
      return res.status(404).json({ error: "Featured Course not found" });
    }

    // Delete the featured course using deleteOne
    await FeaturedModel.deleteOne({ _id: id });

    return res
      .status(200)
      .json({ message: "Featured Course deleted successfully" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getactiveCourse = async (req, res) => {
  try {
    const activeCourse = await ActivecourseModel.find(
      {},
      "_id ActivecourseHeading ActivecourseThumbnail Description VideoUrl Duration Price planId CourseId"
    );
    return res.status(200).json({ activeCourse });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const uploadTos3 = async function (file, folder, userId) {
  try {
    const fileData = fs.readFileSync(file.tempFilePath); // Use file.tempFilePath to read the file data
    console.log("File Data Size:", fileData.length);

    const uploadParams = {
      Bucket: `${bucketName}/${folder}/${userId}`,
      Body: fileData,
      Key: file.name, // Use file.name as the key
      ACL: "public-read",
    };

    const uploadResult = await s3.upload(uploadParams).promise();
    console.log("File Uploaded Successfully:", uploadResult.Location);

    return uploadResult;
  } catch (uploadError) {
    console.error("Error uploading file:", uploadError);
    throw uploadError;
  }
};

const createActiveCourse = async (req, res) => {
  const { ActivecourseHeading, Description, Duration, planId, CourseId } = req.body;

  if (!ActivecourseHeading || !Description || !Duration || !CourseId || !planId) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    let thumbnailUrl = '';
    let videoUrl = '';

    // Check if userId is available
    const userId = req.user ? req.user.id : null;
    console.log("User ID:", userId); // Log the userId

    // Upload ActivecourseThumbnail if provided
    if (req.files && req.files.ActivecourseThumbnail) {
      const thumbnailFile = req.files.ActivecourseThumbnail;
      console.log("Thumbnail file:", thumbnailFile); // Log the thumbnailFile
      const thumbnailUploadResult = await uploadTos3(thumbnailFile, "thumbnails", userId);
      thumbnailUrl = thumbnailUploadResult.Location;
    }

    // Upload VideoUrl if provided
    if (req.files && req.files.VideoUrl) {
      const videoFile = req.files.VideoUrl;
      console.log("Video file:", videoFile); // Log the videoFile
      const videoUploadResult = await uploadTos3(videoFile, "videos", userId);
      videoUrl = videoUploadResult.Location;
    }

    // Create ActivecourseModel and save to the database
    const activeCourse = await ActivecourseModel.create({
      ActivecourseHeading,
      ActivecourseThumbnail: thumbnailUrl,
      Description,
      Duration,
      VideoUrl: videoUrl,
      planId,
      CourseId,
    });

    return res.status(200).json({
      message: "Activecourse Added successfully",
      activeCourse,
    });
  } catch (error) {
    console.error("Error creating active course:", error);
    return res.status(500).json({ error: "Failed to create active course" });
  }
};









const deleteActiveCourseById = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if the ID is valid
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        error: "Invalid ID format",
      });
    }

    // Find and delete the active course by ID
    const deletedActiveCourse = await ActivecourseModel.findByIdAndDelete(id);

    // Check if the active course exists
    if (!deletedActiveCourse) {
      return res.status(404).json({
        error: "Active course not found",
      });
    }

    return res.status(200).json({
      message: "Active course deleted successfully",
      deletedActiveCourse,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Create a new Stuff
// Create a new Stuff
const uploadStuffImageVideos = async function (files, folder, userId) {
  try {
    // Check if files are provided and if it's an array
    if (!files || !Array.isArray(files) || files.length === 0) {
      throw new Error("No files provided for upload.");
    }

    const uploadedUrls = [];

    for (const file of files) {
      // Check if file.tempFilePath exists
      if (!file.tempFilePath) {
        throw new Error("File tempFilePath is missing.");
      }

      const fileData = fs.readFileSync(file.tempFilePath);
      console.log("File Data Size:", fileData.length);

      const uploadParams = {
        Bucket: `${bucketName}/${folder}/${userId}`,
        Body: fileData,
        Key: file.name,
        ACL: "public-read",
      };

      // Use try-catch block for individual file uploads
      try {
        const uploadResult = await s3.upload(uploadParams).promise();
        console.log("File Uploaded Successfully:", uploadResult.Location);
        uploadedUrls.push(uploadResult.Location);
      } catch (uploadError) {
        console.error("Error uploading file:", uploadError);
        throw uploadError;
      }
    }

    return uploadedUrls;
  } catch (error) {
    console.error("Error uploading files:", error);
    throw error;
  }
};

const createStuff = async (req, res) => {
  const { stuffHeading,stuffThumbnail, stuffLink, stuffVideoUrl } = req.body;

  try {
    if (!stuffHeading) {
      throw new Error("Stuff heading is required");
    }

    // Create stuff object with provided data
    const stuff = await StuffModel.create({
      stuffHeading,
      stuffThumbnail,
      stuffLink,
      stuffVideoUrl,
    });


    const notificationData = {
      heading: "New Stuffs available!",
      title: stuffHeading,
      // message: description,
     
    };
  
    // Log the notification data before creating it
    console.log("Notification Data:", notificationData);
  
    // Create the notification
    await normalNotification.create(notificationData);

    return res.status(200).json({ stuff });
  } catch (error) {
    console.error("Error creating stuff:", error);
    return res.status(500).json({ error: error.message });
  }
};











// Function to get all Stuff records
const getAllStuff = async (req, res) => {
  try {
    const stuff = await StuffModel.find();

    if (stuff.length === 0) {
      return res.status(404).json({ error: "No Stuff records found" });
    }

    return res.status(200).json({ stuff });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
};

// Edit a Stuff by its ID
const editStuffById = async (req, res) => {
  const stuffId = req.params.stuffId; // Extract the stuff ID from URL parameters
  const { stuffHeading, stuffThumbnail, stuffLink, stuffVideoUrl } = req.body;

  if (
    !stuffLink ||
    !Array.isArray(stuffLink) ||
    !stuffVideoUrl ||
    !Array.isArray(stuffVideoUrl)
  ) {
    return res.status(400).json({
      error:
        "StuffHeading, StuffThumbnail, StuffLink, and StuffVideoUrl must be arrays",
    });
  }

  try {
    const stuff = await StuffModel.findById(stuffId);

    if (!stuff) {
      return res.status(404).json({ error: "Stuff not found" });
    }

    // Update the stuff's details with the new data
    stuff.stuffHeading = stuffHeading;
    stuff.stuffThumbnail = stuffThumbnail;
    stuff.stuffLink = stuffLink;
    stuff.stuffVideoUrl = stuffVideoUrl;

    await stuff.save();

    return res
      .status(200)
      .json({ message: "Stuff edited successfully", stuff });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: e.message });
  }
};

// Delete a Stuff by its ID
const deleteStuffById = async (req, res) => {
  const stuffId = req.params.stuffId; // Extract the stuff ID from URL parameters

  if (!stuffId) {
    return res.status(400).json({ error: "Stuff ID must be provided" });
  }

  try {
    const stuff = await StuffModel.findByIdAndRemove(stuffId);

    if (!stuff) {
      return res.status(404).json({ error: "Stuff not found" });
    }

    return res.status(200).json({ message: "Stuff deleted successfully" });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ error: e.message });
  }
};

const postResult = async (req, res) => {
  try {
    const result = await Result.create(req.body);
    res.status(200).json(result);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: err.message });
  }
};

const getResult = async (req, res) => {
  try {
    const result = await Result.find({});
    res.status(200).json(result);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: err.message });
  }
};

const uploadsyllabuspdf = async function (file, folder, userId) {
  try {
    const fileData = fs.readFileSync(file.tempFilePath);
    console.log("File Data Size:", fileData.length);

    const uploadParams = {
      Bucket: `${bucketName}/${folder}/${userId}`,
      Body: fileData,
      Key: file.name,
      ACL: "public-read",
    };

    const uploadResult = await s3.upload(uploadParams).promise();
    console.log("File Uploaded Successfully:", uploadResult.Location);

    return uploadResult.Location;
  } catch (uploadError) {
    console.error("Error uploading file:", uploadError);
    throw uploadError;
  }
};

const createSyllabus = async (req, res) => {
  const { Subject, Chapters } = req.body;

  try {
    const pdfFile = req.files && req.files.pdfUrl;
    if (!pdfFile) {
      throw new Error("PDF file is missing in the request");
    }

    // Ensure that Chapters is an array
    let parsedChapters;
    try {
      parsedChapters = JSON.parse(Chapters);
    } catch (error) {
      throw new Error("Chapters must be a valid JSON array");
    }

    if (!Array.isArray(parsedChapters)) {
      throw new Error("Chapters must be an array");
    }

    const pdfUrl = await uploadsyllabuspdf(pdfFile, "syllabus", req.userId);
    
    const syllabus = await SyllabusModel.create({
      Subject,
      pdfUrl,
      Chapters: parsedChapters.map((chapter) => ({
        topic: chapter.topic,
        _id: chapter._id,
      })),
    });

    const notificationData = {
      heading: "New Syllabus added!",
      title: Subject,
      // message: description,
    };

    // Log the notification data before creating it
    console.log("Notification Data:", notificationData);

    // Create the notification
    await normalNotification.create(notificationData);

    console.log("Syllabus added successfully:", syllabus);

    return res.status(200).json({ syllabus });
  } catch (e) {
    console.error("Error adding syllabus:", e);
    return res.status(500).json({ error: e.message });
  }
};









const getSyllabus = async (req, res) => {
  try {
    const syllabus = await SyllabusModel.find();
    if (syllabus.length === 0) {
      return res.status(404).json({ error: "No syllabus records found" });
    }

    return res.status(200).json({ syllabus });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
};

const deleteSyllabusById = async (req, res) => {
  const syllabusId = req.params.id;

  try {
    // Check if the provided ID is valid
    if (!mongoose.Types.ObjectId.isValid(syllabusId)) {
      return res.status(400).json({ error: "Invalid syllabus ID" });
    }

    // Attempt to delete the syllabus
    const deletedSyllabus = await SyllabusModel.findByIdAndDelete(syllabusId);

    // Check if the syllabus was found and deleted
    if (!deletedSyllabus) {
      return res.status(404).json({ error: "Syllabus not found" });
    }

    return res.status(200).json({ message: "Syllabus deleted successfully" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
};

const getAllUserTransactions = async (req, res) => {
  try {
    const transactions = await Payment.find();

    return res.status(200).json({ transactions });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error fetching user transactions" });
  }
};
// Get All Users' Marks
const getAllUsersMarks = async (req, res) => {
  try {
    const allUsersMarks = await Marks.find();

    if (allUsersMarks.length === 0) {
      return res.status(404).json({ error: "No marks found for any user" });
    }

    return res.status(200).json({ allUsersMarks });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
// Function to get all user profile pictures
const getAllUserPictures = async (req, res) => {
  try {
    // Retrieve all user profiles
    const users = await userModel.find();

    // Extract profile pictures from user profiles
    const userPictures = users.map((user) => {
      return {
        userId: user._id,
        picture: user.picture,
      };
    });

    return res.status(200).json({ userPictures });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Create a new user by admin
const createNewUserByAdmin = async (req, res) => {
  const { name, email, mob, isTemp, isAdmin, assignedCourses } = req.body;

  if (!name || !email || !mob) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const existingUser = await userModel.findOne({ email });

    if (existingUser) {
      return res
        .status(400)
        .json({ error: "User with this email already exists" });
    }

    // Validate or sanitize assignedCourses if needed

    // Check if course IDs exist (this is just an example, modify based on your actual schema)
    const validCourseIds = await CourseModel.find({
      _id: { $in: assignedCourses },
    }).distinct("_id");

    if (assignedCourses.length !== validCourseIds.length) {
      return res.status(400).json({ error: "Invalid course IDs" });
    }

    const newUser = await userModel.create({
      name,
      email,
      mob,
      isTemp:false,
      isAdmin: isAdmin || false,
      assignedCourses: validCourseIds || [],
    });

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error(error);
    if (error.name === "MongoError" && error.code === 11000) {
      // Duplicate key error (unique constraint violation)
      return res
        .status(400)
        .json({ error: "User with this email already exists" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

const getTotalTransactions = async (req, res) => {
  try {
    const transactions = await Payment.find();

    // Calculate the total amount from all transactions
    const totalAmount = transactions.reduce(
      (acc, transaction) => acc + transaction.amount,
      0
    );

    return res.status(200).json({ totalAmount });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Error fetching and calculating total amount" });
  }
};

const getCurrentMonthTotalTransactions = async (req, res) => {
  try {
    // Get the current month's name, e.g., "October"
    const currentMonthName = new Date().toLocaleString("default", {
      month: "long",
    });

    // Find the data for the current month in the database
    const currentMonthData = await Payment.aggregate([
      {
        $match: {
          $expr: { $eq: [{ $month: "$timestamp" }, new Date().getMonth() + 1] },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    if (currentMonthData.length > 0) {
      // Extract the totalAmount for the current month
      const currentMonthTotalAmount = currentMonthData[0].totalAmount;

      // Send the totalAmount as the response
      return res.status(200).json({ totalAmount: currentMonthTotalAmount });
    } else {
      // If no data is found for the current month, send a response accordingly
      return res.status(200).json({ totalAmount: 0 });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Error fetching and calculating current month total amount",
    });
  }
};

// Modify your getAllUsers function to include createdBy information
const userCreatedByAdminOrItself = async (req, res) => {
  try {
    const users = await userModel.find({}, { name: 1, email: 1, isAdmin: 1 });

    const createdByUserCount = users.filter((user) => !user.isAdmin).length;
    const createdByAdminCount = users.filter((user) => user.isAdmin).length;

    return res.status(200).json({
      createdByUserCount,
      createdByAdminCount,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getAllPurchasePlans = async (req, res) => {
  try {
    const allPurchasePlans = await PurchasedPlan.find();

    // Map over the purchase plans and replace IDs with names
    const purchasePlansWithNames = await Promise.all(
      allPurchasePlans.map(async (purchasePlan) => {
        try {
          const user = await userModel.findById(purchasePlan.userId);
          const course = await CourseModel.findById(purchasePlan.courseId);

          if (!user || !course) {
            console.error(
              `User or Course not found for purchase plan with ID ${purchasePlan._id}`
            );
          }

          return {
            ...purchasePlan.toObject(),
            userName: user ? user.name : "Unknown User",
            courseName: course ? course.name : "Unknown Course",
          };
        } catch (innerError) {
          console.error(
            `Error fetching user or course for purchase plan with ID ${purchasePlan._id}:`,
            innerError
          );
          return {
            ...purchasePlan.toObject(),
            userName: "Unknown User",
            courseName: "Unknown Course",
          };
        }
      })
    );

    // If you want to send the data as a JSON response
    return res.status(200).json({ purchasePlans: purchasePlansWithNames });

    // If you want to render a view (replace 'yourView' with your actual view name)
    // res.render('yourView', { purchasePlans: purchasePlansWithNames });
  } catch (error) {
    console.error("Error fetching all purchase plans:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Create a new teacher by admin
const createTeacherByAdmin = async (req, res) => {
  const { email, name, mob, password } = req.body;

  if (!email || !name || !mob || !password) {
    return res
      .status(400)
      .json({ error: "Email, name, mobile, and password are required" });
  }

  try {
    const existingTeacher = await teacherModel.findOne({ email });
    // const existingUser = await userModel.findOne({ email });

    if (existingTeacher) {
      return res
        .status(409)
        .json({ message: "Teacher with this email already exists" });
    }

    // Create a new teacher
    const newTeacher = await teacherModel.create({
      email,
      name,
      mob,
      password,
    });

    return res.status(201).json({
      message: "Teacher created successfully",
      teacher: {
        _id: newTeacher._id,
        email: newTeacher.email,
        name: newTeacher.name,
        mob: newTeacher.mob,
        role: newTeacher.role,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getAllTeachers = async (req, res) => {
  try {
    const teachers = await teacherModel.find();
    return res.status(200).json(teachers);
  } catch (error) {
    console.error("Error getting teachers:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const deleteTeacherById = async (req, res) => {
  const teacherId = req.params.id;

  try {
    // Check if the teacher exists
    const teacher = await teacherModel.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }

    // Delete the teacher
    await teacherModel.findByIdAndDelete(teacherId);

    res.status(200).json({ message: "Teacher deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const uploadPosterImages = async function (files, folder, userId) {
  try {
    const uploadedImageUrls = [];

    // Check if files is an array (for multiple image uploads) or a single file
    const fileList = Array.isArray(files) ? files : [files];

    for (const file of fileList) {
      const fileData = fs.readFileSync(file.tempFilePath);
      console.log("File Data Size:", fileData.length);

      const uploadParams = {
        Bucket: `${bucketName}/${folder}/${userId}`,
        Body: fileData,
        Key: file.name,
        ACL: "public-read",
      };

      const uploadResult = await s3.upload(uploadParams).promise();
      console.log("File Uploaded Successfully:", uploadResult.Location);

      uploadedImageUrls.push(uploadResult.Location);
    }

    return uploadedImageUrls;
  } catch (uploadError) {
    console.error("Error uploading files:", uploadError);
    throw uploadError;
  }
};

const createPoster = async (req, res) => {
  const { title, description } = req.body;
  const posterImages = req.files.posterImages; // Assuming this is an array of files

  // Additional logging to help identify the issue
  console.log("Uploaded Files:", posterImages);

  try {
    let uploadedImageUrls;

    // Check if posterImages array is provided and has valid properties
    if (
      posterImages &&
      (Array.isArray(posterImages) || posterImages instanceof Object)
    ) {
      uploadedImageUrls = await uploadPosterImages(
        posterImages,
        "posters",
        req.userId
      );
    } else {
      return res.status(400).json({ error: "Invalid posterImages data" });
    }

    const posterData = {
      title,
      description,
      imageUrls: uploadedImageUrls, // Assuming you have an array field in your schema to store multiple image URLs
    };

    const poster = await PosterModel.create(posterData);

    const notificationData = {
      heading: "New Results available!",
      title: title,
      message: description,
     
    };
  
    // Log the notification data before creating it
    console.log("Notification Data:", notificationData);
  
    // Create the notification
    await normalNotification.create(notificationData);

    return res
      .status(200)
      .json({ message: "Poster created successfully", poster });
  } catch (e) {
    console.error("console error", e);
    return res.status(500).json({ error: e.message });
  }


};

const getAllPosters = async (req, res) => {
  try {
    const posters = await PosterModel.find();
    return res.status(200).json({ posters });
  } catch (error) {
    console.error("Error retrieving posters:", error);
    return res.status(500).json({ error: "Error retrieving posters" });
  }
};

const deletePosterById = async (req, res) => {
  const posterId = req.params.id;

  try {
    // Check if the posterId is a valid ObjectId (assuming you are using MongoDB)
    if (!mongoose.Types.ObjectId.isValid(posterId)) {
      return res.status(400).json({ error: "Invalid Poster ID" });
    }

    // Find and delete the poster by ID
    const deletedPoster = await PosterModel.findByIdAndDelete(posterId);

    if (!deletedPoster) {
      return res.status(404).json({ error: "Poster not found" });
    }

    return res.status(200).json({ message: "Poster deleted successfully" });
  } catch (error) {
    console.error("Error deleting poster:", error);
    return res.status(500).json({ error: "Error deleting poster" });
  }
};

const getfeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ user: { $exists: true, $ne: null } })
      .populate('user', 'email name picture mob');
    return res.status(200).json({ feedbacks });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
};








module.exports = {
  signup,
  login,
  getAllUsers,
  blockUnblockUser,
  createAd,
  getAllAds,
  editAdById,
  deleteAdById,
  createQuiz,
  getAllQuizzes,
  editQuizById,
  deleteQuizById,
  createCourseSubjectOption,
  getCourses,
  editCourse,
  createPlan,
  getAllPlans,
  editPlanById,
  deletePlanById,
  createFeaturedCourse,
  getAllFeaturedCourses,
  createStuff,
  getAllStuff,
  editStuffById,
  deleteStuffById,
  postResult,
  getResult,
  createSyllabus,
  getSyllabus,
  deleteCourse,
  getAllUserTransactions,
  getAllUsersMarks,
  getAllUserPictures,
  createActiveCourse,
  getactiveCourse,
  uploadObject,
  createNewUserByAdmin,
  getTotalTransactions,
  getCurrentMonthTotalTransactions,
  userCreatedByAdminOrItself,
  deleteFeaturedCourseById,
  getAllPurchasePlans,
  getAllUserTokens,
  createTeacherByAdmin,
  getAllTeachers,
  deleteTeacherById,
  deleteActiveCourseById,
  deleteSyllabusById,
  createPoster,
  getAllPosters,
  deletePosterById,
  getUserDetails,
  updateUpcomingStatus,
  addSubjectsToCourse,
  getfeedback

};
