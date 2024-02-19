const express = require("express");
const {
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

} = require("../controller/adminController");
const { authenticateToken } = require("../middleware/authenticateToken");
const app = express.Router();

app.post("/signup", signup);

app.post("/login", login);

app.get("/getAllUsers", getAllUsers);

app.put("/blockUnblockUser", blockUnblockUser);

app.post("/createAd", createAd);

app.get("/getAllAds", getAllAds);

app.put("/editAd/:adId", editAdById);

app.delete("/deleteAd/:adId", deleteAdById);

app.post("/createQuiz", createQuiz);

app.get("/getAllQuizzes", getAllQuizzes);

app.put("/editQuiz/:quizId", editQuizById);

app.delete("/deleteQuiz/:quizId", deleteQuizById);

app.post("/createCourseSubjectOption",createCourseSubjectOption);

app.get("/getCourses",getCourses);

app.put("/courses/:courseId", editCourse);

app.delete("/deleteCourse/:courseId", deleteCourse)

app.post("/createPlan", createPlan); 

app.get("/getAllPlans", getAllPlans);

app.put("/editPlan/:planId", editPlanById); 

app.delete("/deletePlan/:planId", deletePlanById); 

app.post("/createFeaturedCourse",createFeaturedCourse);

app.get("/getAllFeaturedCourses",getAllFeaturedCourses)

app.post("/createStuff",createStuff)

app.get("/getAllStuff",getAllStuff)

app.put("/editStuff/:stuffId", editStuffById);

app.delete("/deleteStuff/:stuffId", deleteStuffById);

app.post('/student-result', postResult)

app.get("/student-result", getResult)

app.post("/createSyllabus",createSyllabus)

app.get("/getSyllabus",getSyllabus)

app.get("/getAllUserTransactions",getAllUserTransactions)

app.get('/getAllUsersMarks',getAllUsersMarks)

app.get('/getAllUserPictures',getAllUserPictures)

app.post('/createActiveCourse',createActiveCourse)

app.get('/getactiveCourse',getactiveCourse)

app.post('/createNewUserByAdmin',createNewUserByAdmin)

app.get('/getTotalTransactions',getTotalTransactions)

app.get('/getCurrentMonthTotalTransactions',getCurrentMonthTotalTransactions)

app.get("/userCreatedByAdminOrItself",userCreatedByAdminOrItself)

app.delete("/deleteFeaturedCourseById/:id",deleteFeaturedCourseById)

app.put("/updateUpcomingStatus/:id", updateUpcomingStatus)

app.get("/getAllPurchasePlans",getAllPurchasePlans)

app.get("/getAllUserTokens",getAllUserTokens)

app.post("/createTeacherByAdmin",createTeacherByAdmin)

app.get('/getAllTeachers',getAllTeachers)

app.delete('/deleteTeacherById/:id',deleteTeacherById)

app.delete('/deleteActiveCourseById/:id',deleteActiveCourseById)

app.delete('/deleteSyllabusById/:id',deleteSyllabusById)

app.post('/createPoster',createPoster)

app.get('/getAllPosters',getAllPosters)



app.delete('/deletePosterById/:id',deletePosterById)

app.get('/getUserDetails',getUserDetails)

app.post('/addSubjectsToCourse/:courseId', addSubjectsToCourse);


app.get('/getfeedback',getfeedback)
module.exports = app;
