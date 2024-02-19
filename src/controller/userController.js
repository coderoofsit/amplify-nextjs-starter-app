const jwt = require("jsonwebtoken");
require("dotenv").config();
const userModel = require("../models/user.model");
const quizModel = require("../models/quiz.model");
const AWS = require("aws-sdk");
const S3 = require("aws-sdk/clients/s3");
const path = require("path");
const Razorpay = require("razorpay");
const PurchasedPlan = require("../models/PurchasedPlan.model");
const Payment = require("../models/payment.model");
const Marks = require("../models/marks.model");
const PosterModel = require("../models/poster.model");
// const path = require("path");
const AttemptedTest = require("../models/AttemptedTest.model");
// const { uploadObject } = require("../aws/s3");
const Notification = require("../models/normalNotification.model")
const Result = require("../models/result.model");
const ActivecourseModel = require("../models/activecourse.model");
const {
  CourseModel,
  SubjectModel,
  OptionModel,
} = require("../models/Course.Model");
const Feedback = require("../models/feedback.model");
const adModel = require("../models/Ads.model");
const twilio = require("twilio");
const FeaturedModel = require("../models/featured.model");
const PlanModel = require("../models/plan.model");
const StuffModel = require("../models/stuff.model");
const fs = require("fs");
const accountSid = process.env.ACCOUNT_SSID;
const authToken = process.env.AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NO;
const cloudinary = require("cloudinary").v2;
const SyllabusModel = require("../models/syllabus.model");
const FCM = require("../models/fcmToken.model");
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID; // Add your Razorpay Key ID
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET; // Add your Razorpay Key Secret
const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_KEY;

const s3 = new S3({
  region,
  accessKeyId,
  secretAccessKey,
});

const client = new twilio(accountSid, authToken);

//  Signup

const signup = async (req, res) => {
  const { name, email, mob } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Your Name is required" });
  }
  if (!email) {
    return res.status(400).json({ error: "Your Email is required" });
  }
  if (!mob) {
    return res.status(400).json({ error: "Your Mobile Number is required" });
  }

  try {
    const user = await userModel.findOne({ email, mob });
    if (user) {
      console.log("User found:", user);
      if (user.isTemp === true) {
        // User already exists and is temporary
        console.log("User is temporary");
        const otp = generateRandomOTP();
        console.log(
          `Generated OTP for user with email ${email} and phone number ${mob}: ${otp}`
        );

        // Update the existing user with a new OTP
        user.otp = otp;
        await user.save();

        // Send OTP to the user
        client.messages
          .create({
            body: `Your OTP for signup: ${otp} from Guru Coaching Centre`,
            from: twilioPhoneNumber,
            to: mob,
          })
          .then(() => {
            return res.status(200).send({ message: "OTP sent successfully" });
          })
          .catch((error) => {
            console.error(error);
            return res.status(500).send({ error: "Error sending OTP" });
          });
      } else {
        // User already exists and is permanent
        console.log("User is permanent");
        return res.status(400).json({ error: "User already registered." });
      }
    } else {
      // Check if email or mobile number exists for permanent users
      const permanentUserWithEmail = await userModel.findOne({ email, isTemp: false });
      const permanentUserWithMob = await userModel.findOne({ mob, isTemp: false });
      
      if (permanentUserWithEmail) {
        return res.status(400).json({ error: "Email already exists" });
      }

      if (permanentUserWithMob) {
        return res.status(400).json({ error: "Mobile number already exists" });
      }

      const otp = generateRandomOTP();
      console.log(
        `Generated OTP for user with email ${email} and phone number ${mob}: ${otp}`
      );

      // Store user details in temporary storage
      await userModel.create({
        name,
        email,
        mob,
        otp,
        isTemp: true, // Marking this as a temporary user
      });

      // Send OTP to the user
      client.messages
        .create({
          body: `Your OTP for signup: ${otp} from Guru Coaching Centre`,
          from: twilioPhoneNumber,
          to: mob,
        })
        .then(() => {
          return res.status(200).send({ message: "OTP sent successfully" });
        })
        .catch((error) => {
          console.error(error);
          return res.status(500).send({ error: "Error sending OTP" });
        });
    }
  } catch (e) {
    console.error(e);
    return res.status(500).send({ error: "Internal server error" });
  }
};






const resendOTP = async (req, res) => {
  const { email, mob } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Your Email is required" });
  }

  if (!mob) {
    return res.status(400).json({ error: "Your Mobile Number is required" });
  }

  try {
    const user = await userModel.findOne({ email, mob });
    if (user) {
      const otp = generateRandomOTP();
      console.log(
        `Generated OTP for user with email ${email} and phone number ${mob}: ${otp}`
      );
      user.otp = otp;
      await user.save();
      client.messages
        .create({
          body: `Your OTP for signup: ${otp} from Guru Classes`,
          from: twilioPhoneNumber,
          to: mob, // Replace this with the user's phone number stored in the database
        })
        .then(() => {
          return res.status(200).send({ message: "OTP resent successfully" });
        })
        .catch((error) => {
          console.error(error);
          return res.status(500).send({ error: "Error sending OTP" });
        });
    } else {
      res.status(404).send({ message: "User not found" });
    }
  } catch (e) {
    console.error(e);
    return res.status(500).send({ error: "Internal server error" });
  }
};
// Verify Signup
const verifySignupOTP = async (req, res) => {
  const { email, otp } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Your Email is required" });
  }

  if (!otp) {
    return res.status(400).json({ error: "OTP is required" });
  }

  try {
    const user = await userModel.findOne({ email, otp });

    if (user && user.isTemp) {
      // OTP is valid, move the user from temporary storage to permanent storage
      user.isTemp = false; // Marking as permanent user
      await user.save();

      // Proceed with further user registration or verification logic here
      const token = jwt.sign({ userId: user._id }, process.env.PRIVATEKEY);
      return res
        .status(200)
        .json({ message: "OTP verified successfully", token });
    } else {
      // Invalid OTP or user is not in temporary storage
      return res.status(404).json({ message: "Invalid OTP" });
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// dss

//  Login
const login = async (req, res) => {
  const { email, mob } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Your Email is required" });
  }

  if (!mob) {
    return res.status(400).json({ error: "Your Mobile Number is required" });
  }

  try {
    const user = await userModel.findOne({ email, mob });
    if (user) {
      if (user.isBlocked) {
        // User is blocked, return a message indicating this
        return res.status(403).send({
          message: "User is blocked. Contact the admin for assistance.",
        });
      }
      console.log("User isTemp:", user.isTemp); // Log the value of isTemp
      if (user.isTemp === true) {
        // User is temporary, prompt to complete signup first
        console.log("User is temporary, cannot login yet."); // Log this message
        return res.status(400).send({
          error: "Please complete your signup process first.",
        });
      }
      const otp = generateRandomOTP();
      console.log(
        `Generated OTP for user with email ${email} and phone number ${mob}: ${otp}`
      );
      user.otp = otp;
      await user.save();
      client.messages
        .create({
          body: `Your OTP for login: ${otp}`,
          from: twilioPhoneNumber,
          to: mob, // Replace this with the user's phone number stored in the database
        })
        .then(() => {
          return res.status(200).send({ message: "OTP sent for login" });
        })
        .catch((error) => {
          console.error(error);
          return res.status(500).send({ error: "Error sending OTP" });
        });
    } else {
      res.status(404).send({ message: "User not found" });
    }
  } catch (e) {
    console.error(e);
    return res.status(500).send({ error: "Internal server error" });
  }
};




// save fcm token
const saveFcmToken = async (req, res) => {
  const userId = req.user.userId;
  const { fcmToken } = req.body;
  const userToken = await FCM.findOne({ userId });

  if (
    userToken &&
    userToken.token.toString().trim() === fcmToken.toString().trim()
  ) {
    return res.status(200).json({ message: "fcm token already saved" });
  }
  if (userToken) {
    userToken.token = fcmToken;
    await userToken.save();
  } else {
    await FCM.create({
      userId,
      token: fcmToken,
    });
  }
  res.status(200).json({ message: "fcm token saved successfully" });
};

// Verify Login OTP
const verifyLoginOTP = async (req, res) => {
  const { email, mob, otp } = req.body;

  if (!otp) {
    return res.status(400).json({ error: "OTP is required" });
  }

  try {
    let user;

    if (email) {
      user = await userModel.findOne({ email });
    }

    if (!user && mob) {
      user = await userModel.findOne({ mob });
    }

    if (user) {
      if (user.isBlocked) {
        // User is blocked, return a message indicating this
        return res.status(403).send({
          message: "User is blocked. Contact the admin for assistance.",
        });
      }

      if (user.otp === otp) {
        // OTP is valid, you can proceed with the login logic here
        const token = jwt.sign({ userId: user._id }, process.env.PRIVATEKEY);
        return res
          .status(200)
          .send({ message: "Login Successful", token, name: user.name });
      } else {
        // Invalid OTP
        return res.status(404).send({ message: "Invalid OTP" });
      }
    } else {
      res.status(404).send({ message: "User not found" });
    }
  } catch (e) {
    console.error(e);
    return res.status(500).send({ error: "Internal server error" });
  }
};

// Get user profile by token
const getUserProfileByToken = async (req, res) => {
  const token = req.headers["x-access-token"];

  if (!token) {
    return res.status(401).json({ error: "Token is missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.PRIVATEKEY);

    if (!decoded.userId) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const user = await userModel.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return the user profile
    return res.status(200).json({ user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
// Edit User Profile
const editUserProfile = async (req, res) => {
  const { userId, newData } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  if (!newData) {
    return res
      .status(400)
      .json({ error: "New data for the profile is required" });
  }

  try {
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Loop through properties of newData and update user's profile
    for (const prop in newData) {
      if (Object.prototype.hasOwnProperty.call(newData, prop)) {
        user[prop] = newData[prop];
      }
    }

    // Save the updated user data
    await user.save();

    // Return a success message or the updated user data
    return res
      .status(200)
      .json({ message: "User profile updated successfully", user });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const uploadProfilePic = async (req, res) => {
  try {
    const picture = req.files.picture;
    const userId = req.user.userId;

    const pictureName = Date.now() + "_" + picture.name;
    const filePath = path.join(__dirname, "../profiles", pictureName);

    picture.mv(filePath, async (err) => {
      if (err) {
        return res.status(500).json({ err: err.message });
      }

      // Upload the file to AWS S3
      const uploadParams = {
        Bucket: bucketName,
        Body: fs.createReadStream(filePath),
        Key: `guru_app/profile/${pictureName}`,
        ACL: "public-read",
      };

      const s3UploadResult = await s3.upload(uploadParams).promise();

      // Update the user's profile picture URL in the database
      const user = await userModel.findById(userId);
      const filename = user.picture.match(/\/([^/]+)$/)[1];
      const existingFilePath = path.join(__dirname, "../profiles", filename);

      if (fs.existsSync(existingFilePath)) {
        fs.unlinkSync(existingFilePath);
      }

      user.picture = s3UploadResult.Location;
      await user.save();

      // Remove the local file
      fs.unlinkSync(filePath);

      res.status(200).json(user);
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
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

const getCourses = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Fetch the user based on userId
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the user has assignedCourses
    if (user.assignedCourses && user.assignedCourses.length > 0) {
      // If the user has assignedCourses, directly respond with those courses
      const assignedCourses = await CourseModel.find({
        _id: { $in: user.assignedCourses },
      });

      return res.status(200).json({ courses: assignedCourses });
    }

    // If user has no assignedCourses, proceed with existing logic

    // Fetch all purchased plans for the user
    const purchasedPlans = await PurchasedPlan.find({
      userId,
      paymentStatus: true,
    });

    if (purchasedPlans.length === 0) {
      return res.status(403).json({
        error: "Oops! It seems you haven't purchased this course yet. Please consider buying it to access.",
      });
    }

    // Extract courseIds from the purchased plans
    const coursePlans = {}; // Use an object to store the level for each course
    purchasedPlans.forEach((plan) => {
      coursePlans[plan.courseId] = parseInt(plan.level, 10);
    });

    // Fetch all courses corresponding to the purchased courseIds
    const courses = await CourseModel.find({
      _id: { $in: Object.keys(coursePlans) },
    });

    // Filter courses based on the user's level for each course
    const filteredCourses = courses.map((course) => {
      const userLevel = coursePlans[course.id];
      return {
        id: course.id,
        title: course.title,
        thumbnail: course.thumbnail,
        subjects:
          userLevel === 1
            ? []
            : course.subjects.map((subject) => {
                if (
                  userLevel === 2 &&
                  !["Recorded", "Study Material"].includes(subject.title)
                ) {
                  return {
                    id: subject.id,
                    title: subject.title,
                    options: [], // No options for unwanted subjects
                  };
                }

                return {
                  id: subject.id,
                  title: subject.title,
                  options: subject.options.map((option) => {
                    return {
                      id: option.id,
                      heading: option.heading,
                      url: option.url,
                      thumbnail: option.thumbnail,
                      batch: option.batch,
                      date: option.date,
                      time: option.time,
                      Conference_no: option.Conference_no,
                      subjects: option.subjects, // Include subjects even if empty
                    };
                  }),
                };
              }),
      };
    });

    // Log the filtered courses for debugging
    console.log("Filtered Courses:", filteredCourses);

    // Format and respond with the list of purchased courses
    return res.status(200).json({ courses: filteredCourses });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error retrieving courses" });
  }
};

const getAllQuizzes = async (req, res) => {
  try {
    const { courseId } = req.query;
    let query = {};

    if (courseId) {
      query = { CourseId: courseId };
    }

    const quizzes = await quizModel.find(query);

    // Format startTime and endTime in each quiz
    const formattedQuizzes = quizzes.map((quiz) => {
      const formattedQuiz = { ...quiz._doc };

      if (quiz.startTime) {
        formattedQuiz.startTime = new Date(quiz.startTime).toISOString();
      }

      if (quiz.endTime) {
        formattedQuiz.endTime = new Date(quiz.endTime).toISOString();
      }

      return formattedQuiz;
    });

    res.status(200).json({ quizzes: formattedQuizzes });
  } catch (error) {
    console.error("Error in getAllQuizzes:", error);

    if (error.name === "CastError") {
      return res.status(400).json({ error: "Invalid courseId format" });
    }

    res.status(500).json({ error: "Internal server error" });
  }
};

const getAllFeaturedCourses = async (req, res) => {
  try {
    const featuredCourses = await FeaturedModel.find();
    return res.status(200).json({ featuredCourses });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getAllPlans = async (req, res) => {
  try {
    const plans = await PlanModel.find();
    return res.status(200).json({ plans });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
};

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

const sendFeedback = async (req, res) => {
  try {
    const feedback = req.body.feedback;
    const savedFeedback = await Feedback.create({
      feedback,
      user: req.user.userId,
    });
    res.status(200).json(savedFeedback);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const getFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({}).populate("user").lean();
    res.status(200).json(feedbacks);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const getFeedbackById = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.feedbackId)
      .populate("user")
      .lean();
    res.status(200).json(feedback);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const createPaymentIntent = async (req, res) => {
  try {
    const { amount, userId, planId, courseId, selectedOptions, level } =
      req.body;

    const amountInPaise = amount * 100;
    const currency = "INR";
    const receiptId = `order_${Date.now()}`;

    const options = {
      amount: amountInPaise,
      currency,
      receipt: receiptId,
      payment_capture: 1,
    };

    razorpay.orders.create(options, async (err, order) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const transactionId = order.id;
      const transactionDateTime = new Date();

      try {
        const selectedPlan = await PlanModel.findById(planId);
        if (!selectedPlan) {
          return res.status(400).json({ error: "Invalid plan ID" });
        }

        const user = await userModel.findById(req.user.userId);
        if (user) {
          user.courseDetails.push({
            selectedPlan: planId,
            courseId: courseId,
            selectedOptions: selectedOptions,
          });

          await user.save();

          const featuredCourse = selectedPlan.title;
          user.featuredCourse = featuredCourse;
          await user.save();
        }

        const payment = new Payment({
          userId: req.user.userId,
          amount: amount,
          transactionId: transactionId,
          receiptId: order.receipt,
          timestamp: transactionDateTime,
          paymentStatus: "Pending",
          selectedPlan: planId,
          selectedOptions: selectedOptions,
          courseId: courseId,
        });

        const purchasedPlan = new PurchasedPlan({
          userId: req.user.userId,
          planId: planId,
          selectedOptions: selectedOptions,
          courseId: courseId,
          amount: amount,
          transactionId: transactionId,
          receiptId: order.receipt,
          level: level, // Save the level here
        });

        await payment.save();
        await purchasedPlan.save();

        // Now, you would typically wait for a webhook/event from Razorpay
        // to confirm the payment success. For this example, let's assume
        // the payment is successful after a delay of 10 seconds.
        setTimeout(async () => {
          // Simulate a successful payment
          const isPaymentSuccessful = true;

          if (isPaymentSuccessful) {
            // Update the payment status to "Success" after successful payment confirmation
            payment.paymentStatus = "Success";
            await payment.save();

            // Additional logic after successful payment (if needed)

            const response = {
              transactionId,
              receiptId: order.receipt,
              order,
              timestamp: transactionDateTime,
              paymentStatus: "Success",
              userId: userId,
              selectedPlan: planId,
              selectedOptions: selectedOptions,
              courseId: courseId,
            };

            console.log(response);
            res.render("Payment", { transactionId });
          } else {
            // If payment is not successful, handle accordingly
            res.status(400).json({ error: "Payment failed" });
          }
        }, 10000); // Simulating a delay of 10 seconds for demonstration purposes
      } catch (error) {
        console.error("Error during payment creation:", error);
        return res.status(500).json({ error: "Failed to create payment" });
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
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

const getResult = async (req, res) => {
  try {
    const result = await Result.find({});
    res.status(200).json(result);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: err.message });
  }
};

// Add Marks
const addMarks = async (req, res) => {
  const {
    userId,
    userName,
    testName,
    Duration,
    totalMarks,
    resultTime,
    marks,
    courseId,
  } = req.body;

  if (
    !userId ||
    !userName ||
    !testName ||
    !Duration ||
    !totalMarks ||
    !resultTime ||
    !marks ||
    !courseId
  ) {
    return res.status(400).json({
      error:
        "User ID, User Name, Test Name, Duration, totalMarks,resultTime, Marks, and Course ID are required",
    });
  }

  try {
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const result = new Marks({
      userId: userId,
      userName: userName,
      Duration: Duration,
      testName: testName,
      totalMarks: totalMarks,
      resultTime: resultTime,

      marks: marks,
      courseId: courseId, // Include courseId in the Marks document
    });

    await result.save();

    return res.status(200).json({ message: "Marks added successfully" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Get Marks with Ranks for Each Test
// Get Marks with Ranks for Each Test
const getMarks = async (req, res) => {
  try {
    const userId = req.user.userId;
    const courseId = req.params.courseId; // Assuming courseId is provided as a route parameter

    // Check if the user is authorized to view their own marks
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Retrieve marks for the user and specific course
    const userMarks = await Marks.find({ userId, courseId });

    if (userMarks.length === 0) {
      return res
        .status(404)
        .json({ message: "No marks found for the user and course" });
    }

    // Get marks of all users for the specific course
    const allMarks = await Marks.find({ courseId }).sort({ marks: -1 });

    // Find the user's rank within the course
    const userRank =
      allMarks.findIndex(
        (mark) => mark.userId.toString() === userId.toString()
      ) + 1;

    // Flatten the marks array
    const flattenedMarks = userMarks.map((mark) => ({
      ...mark._doc,
      userRank: userRank,
    }));

    return res.status(200).json({ marks: flattenedMarks });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Get Rank of the User

const getUserRanks = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Check if the user is authorized to view their own rank
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Retrieve marks for the user
    const userMarks = await Marks.find({ userId });

    if (userMarks.length === 0) {
      return res.status(404).json({ message: "No marks found for the user" });
    }

    const userTotalMarks = userMarks.reduce(
      (total, mark) => total + mark.marks,
      0
    );

    // Get marks of all users
    const allMarks = await Marks.find().sort({ marks: -1 });

    // Find the user's rank
    const userRank =
      allMarks.findIndex(
        (mark) => mark.userId.toString() === userId.toString()
      ) + 1;

    // Create a string to store the test names
    const testNames = userMarks.map((mark) => mark.testName).join(", ");

    return res
      .status(200)
      .json({ rank: userRank, totalMarks: userTotalMarks, testNames });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Get Leaderboard
const getLeaderboard = async (req, res) => {
  try {
    // Get marks of all users sorted by marks in descending order
    const allMarks = await Marks.find().sort({ marks: -1 });

    // Format the leaderboard data with exam names
    const leaderboard = await Promise.all(
      allMarks.map(async (mark, index) => {
        const { userId, userName, marks, testName } = mark;

        // const examDetails = await getExamDetails(testName);

        return {
          rank: index + 1,
          userId,
          userName,
          totalMarks: marks,
          testName,
        };
      })
    );

    return res.status(200).json({ leaderboard });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const saveUserAttempt = async (req, res) => {
  try {
    const { userId, quizId, testName, answers, remainingDuration, indexPage } =
      req.body;

    // Validate input data
    if (
      !userId ||
      !quizId ||
      !testName ||
      !remainingDuration ||
      !indexPage ||
      !Array.isArray(answers)
    ) {
      return res.status(400).json({ error: "Invalid input data" });
    }

    // Check if the user and quiz exist
    const user = await userModel.findById(userId);
    const quiz = await quizModel.findById(quizId);

    if (!user || !quiz) {
      return res.status(404).json({ error: "User or quiz not found" });
    }

    // Map the answers to the format expected by the AttemptedTest model
    const questionsAndAnswers = answers.map((answer) => ({
      questionId: answer.questionId,
      chosenAnswer: answer.chosenAnswer,
    }));

    // Save the attempted test details to the database
    const attemptedTest = new AttemptedTest({
      userId: userId,
      quizId: quizId,
      remainingDuration: remainingDuration,
      indexPage: indexPage,
      testName: testName,
      questionsAndAnswers: questionsAndAnswers,
    });

    await attemptedTest.save();

    return res
      .status(200)
      .json({ message: "Attempted test details saved successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getSavedAttempts = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Check if the user is authorized to view their own saved attempts
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Retrieve saved attempts for the user
    const savedAttempts = await AttemptedTest.find({ userId });

    if (savedAttempts.length === 0) {
      return res
        .status(404)
        .json({ message: "No saved attempts found for the user" });
    }

    return res.status(200).json({ savedAttempts });
  } catch (error) {
    console.error(error);
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

// Get Payment Details
const getPaymentDetails = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Fetch payment details for the user
    const payments = await Payment.find({ userId });

    if (payments.length === 0) {
      return res
        .status(404)
        .json({ message: "No payment details found for the user" });
    }

    // Format payment details if needed
    const formattedPayments = payments.map((payment) => ({
      // Add fields that you want to include in the response
      transactionId: payment.transactionId,
      amount: payment.amount,
      timestamp: payment.timestamp,
      paymentStatus: payment.paymentStatus,
      courseId: payment.courseId,
      receiptId: payment.receiptId,
    }));

    return res.status(200).json({ payments: formattedPayments });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getPurchasedPlanById = async (req, res) => {
  try {
    const authenticatedUserId = req.user.userId;

    const userPurchasePlans = await PurchasedPlan.find({
      userId: authenticatedUserId,
    });

    const purchasePlansWithNamesAndTitles = await Promise.all(
      userPurchasePlans.map(async (purchasePlan) => {
        try {
          const user = await userModel.findById(purchasePlan.userId);
          const course = await CourseModel.findById(purchasePlan.courseId);
          const plan = await PlanModel.findById(purchasePlan.planId);

          if (!user || !course || !plan) {
            console.error(
              `User, Course, or Plan not found for purchase plan with ID ${purchasePlan._id}`
            );
          }

          return {
            ...purchasePlan.toObject(),
            userName: user ? user.name : "Unknown User",
            courseTitle: course ? course.title : "Unknown Course",
            planTitle: plan ? plan.title : "Unknown Plan",
          };
        } catch (innerError) {
          console.error(
            `Error fetching user, course, or plan for purchase plan with ID ${purchasePlan._id}:`,
            innerError
          );
          return {
            ...purchasePlan.toObject(),
            userName: "Unknown User",
            courseTitle: "Unknown Course",
            planTitle: "Unknown Plan",
          };
        }
      })
    );

    return res
      .status(200)
      .json({ purchasePlans: purchasePlansWithNamesAndTitles });
  } catch (error) {
    console.error(
      "Error fetching purchase plans for the authenticated user:",
      error
    );
    return res.status(500).json({ error: "Internal server error" });
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

const getCoursesById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const courseId = req.params.courseId;

    // Fetch all assignedCourses for the user
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.assignedCourses && user.assignedCourses.includes(courseId)) {
      // If the course is assigned to the user, fetch and respond without filter logic
      const assignedCourse = await CourseModel.findById(courseId);

      if (!assignedCourse) {
        return res.status(404).json({ error: "Course not found" });
      }

      return res.status(200).json({ courses: [assignedCourse] });
    }

    // Fetch all purchased plans for the user
    const purchasedPlans = await PurchasedPlan.find({
      userId,
      paymentStatus: true,
    });

    if (purchasedPlans.length === 0) {
      return res.status(403).json({
        error: "Access denied. Please purchase a course to access it.",
      });
    }

    // Extract courseIds from the purchased plans
    const coursePlans = {};
    purchasedPlans.forEach((plan) => {
      coursePlans[plan.courseId] = parseInt(plan.level, 10);
    });

    // Fetch specific course by courseId
    if (courseId) {
      const specificCourse = await CourseModel.findById(courseId);

      if (!specificCourse) {
        return res.status(404).json({ error: "Course not found" });
      }

      // Filter the specific course based on the user's level
      const userLevel = coursePlans[specificCourse.id];
      const filteredCourse = {
        id: specificCourse.id,
        title: specificCourse.title,
        thumbnail: specificCourse.thumbnail,
        subjects:
          userLevel === 1
            ? []
            : specificCourse.subjects.map((subject) => {
                if (
                  userLevel === 2 &&
                  !["Recorded", "Study Material"].includes(subject.title)
                ) {
                  return {
                    id: subject.id,
                    title: subject.title,
                    options: [],
                  };
                }

                return {
                  id: subject.id,
                  title: subject.title,
                  options: subject.options.map((option) => {
                    return {
                      id: option.id,
                      heading: option.heading,
                      url: option.url,
                      thumbnail: option.thumbnail,
                      batch: option.batch,
                      date: option.date,
                      time: option.time,
                      Conference_no: option.Conference_no,
                      subjects: option.subjects,
                    };
                  }),
                };
              }),
      };

      // Respond with the filtered specific course
      return res.status(200).json({ courses: [filteredCourse] });
    }

    // Fetch all courses corresponding to the purchased courseIds
    const courses = await CourseModel.find({
      _id: { $in: Object.keys(coursePlans) },
    });

    // Filter courses based on the user's level for each course
    const filteredCourses = courses.map((course) => {
      const userLevel = coursePlans[course.id];
      return {
        id: course.id,
        title: course.title,
        thumbnail: course.thumbnail,
        subjects:
          userLevel === 1
            ? []
            : course.subjects.map((subject) => {
                if (
                  userLevel === 2 &&
                  !["Recorded", "Study Material"].includes(subject.title)
                ) {
                  return {
                    id: subject.id,
                    title: subject.title,
                    options: [],
                  };
                }

                return {
                  id: subject.id,
                  title: subject.title,
                  options: subject.options.map((option) => {
                    return {
                      id: option.id,
                      heading: option.heading,
                      url: option.url,
                      thumbnail: option.thumbnail,
                      batch: option.batch,
                      date: option.date,
                      time: option.time,
                      Conference_no: option.Conference_no,
                      subjects: option.subjects,
                    };
                  }),
                };
              }),
      };
    });

    // Log the filtered courses for debugging
    console.log("Filtered Courses:", filteredCourses);

    // Format and respond with the list of purchased courses
    return res.status(200).json({ courses: filteredCourses });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error retrieving courses" });
  }
};

const deleteUser = async (req, res) => {
  const userId = req.user.userId;

  try {
    const user = await userModel.findOneAndDelete({ _id: userId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getallnotifications = async (req, res) => {
  try {
    // Fetch all notifications from the database
    const notifications = await Notification.find();
    
    // Return the notifications as a response
    res.status(200).json({ notifications });
  } catch (error) {
    // Handle errors
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

module.exports = {
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
  getAllPlans,
  getAllFeaturedCourses,
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
};
function generateRandomOTP() {
  // Generate a random 6-digit OTP
  const min = 100000;
  const max = 999999;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
