const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
require("dotenv").config();
require('./Config/cloudinary')
const bodyParser = require('body-parser');
const moment = require("moment-timezone");
const fileUpload = require("express-fileupload");
const userRouter = require("./Routes/user.routes");
const adminRouter = require("./Routes/admin.routes");
const teacherRouter = require("./Routes/teacher.routes");
const quizModel = require("../src/models/quiz.model");

const connect = require("./Config/Connect");
const path = require("path");
const { sendNotification } = require("./firebase/PushNotification");
const app = express();
app.set('view engine', 'ejs')
app.use(express.static("src/profiles"));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.json());
app.use(cors());
app.use(fileUpload({
  useTempFiles : true,
  tempFileDir : '/tmp/'
}));

app.use("/user", userRouter);
app.use("/admin", adminRouter);
app.use("/teacher", teacherRouter);

app.post('/send-notification', async (req, res) => {
  const {fcmToken, title, body} = req.body
  await sendNotification(fcmToken, {title, body})
  res.send('notification sended')
});

// Routes
app.get('/', (req, res) => {
  const htmlContent = `
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
          body {
            font-family: 'Arial', sans-serif;
            background-image: url('https://media.tenor.com/TZaIBNauQfAAAAAC/stars-galaxy.gif');
            text-align: center;
            margin: 50px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
          }
          .animated-text {
            color: #ffffff;
            animation: bounce 2s infinite;
          }
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {
              transform: translateY(0);
            }
            40% {
              transform: translateY(-20px);
            }
            60% {
              transform: translateY(-10px);
            }
          }
        </style>
      <title>Connected Test</title>
    </head>
    <body>
    <h1 class="animated-text">Server Live at ☞ 8000!</h1>
    <p class="animated-text">This is a Backend of Project <b>Guru-App</b> to confirm that the server is running and connected.</p>
    </body>
    </html>
  `;
  res.send(htmlContent);
});

// Route for loading page
app.get('/loading', (req, res) => {
  res.send('<html><head><title>Loading...</title></head><body><h1>Loading...</h1></body></html>');
});

// Existing cron job for deleting expired quizzes
const deleteExpiredQuizzes = async () => {
  try {
    console.log('Cron job for deleting expired quizzes triggered at:', new Date());

    const currentTime = new Date();

    console.log('Current Time:', currentTime);

    const expiredQuizzes = await quizModel.find({
      endTime: {
        $lte: currentTime,
      },
    });

    console.log('Number of Expired Quizzes:', expiredQuizzes.length);

    for (const quiz of expiredQuizzes) {
      console.log(`Checking quiz with ID ${quiz._id} - endTime: ${quiz.endTime}`);

      // Convert quiz.endTime to the 'Asia/Kolkata' time zone for comparison
      const quizEndTime = moment.tz(quiz.endTime, 'Asia/Kolkata');

      if (quizEndTime.isSameOrBefore(currentTime)) {
        console.log(`Deleting quiz with ID ${quiz._id}.`);
        await quizModel.findByIdAndDelete(quiz._id);
        console.log(`Quiz with ID ${quiz._id} deleted.`);
      } else {
        console.log(`Quiz with ID ${quiz._id} has not expired.`);
      }
    }
  } catch (error) {
    console.error('Error deleting expired quizzes:', error);
  }
};

// Schedule the job to run every minute
cron.schedule('* * * * *', deleteExpiredQuizzes);

// Additional cron job (example: log something every day at midnight)
const logSomething = () => {
  console.log('Cron is running and checking the endtimes of the Quizes.');
};

cron.schedule('0 0 * * *', logSomething);


let serverStatus = 'UP'; // Initial server status

// Health check endpoint
app.get('/health', (req, res) => {
  try {
    // Simulate a check for server health
    if (serverStatus === 'DOWN') {
      return res.status(503).json({ status: 'DOWN', message: 'Server is down' });
    } else if (serverStatus === 'UNHEALTHY') {
      return res.status(500).json({ status: 'UNHEALTHY', message: 'Server is unhealthy' });
    }

    // If server is healthy
    const healthCheck = {
      status: 'UP',
      message: 'Server is healthy!'
    };
    res.status(200).json(healthCheck);
  } catch (error) {
    console.error('Error checking server health:', error);
    res.status(500).json({ error: 'Failed to check server health' });
  }
});
// Timeout middleware
app.use((req, res, next) => {
  // Set timeout to 30 seconds 
  req.setTimeout(1000, () => {
 
    res.redirect('/loading');
  });
  next();
});

// if (process.env.NODE_ENV === "production") {
//   app.use(express.static("../../Frontend/build"));
//   app.get("*", (req, res) => {
//     res.sendFile(path.join(__dirname, "../../Frontend/build/index.html"));
//   });
// }

app.listen(process.env.PORT, async () => {
  await connect().then(() => {
    console.log(`listening to http://localhost:${process.env.PORT}`);
  });
});
