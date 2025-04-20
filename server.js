const express = require('express');
const app = express();
const port = 3002;
const createError = require("http-errors");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require('path');

// Allow requests from any origin
app.use(cors());

const indexRouter = require("./routes/indexRoutes");
const myMemeRouter = require('./routes/myMemeRoutes');
const loginRouter = require('./routes/loginRoutes');
const registerRouter = require("./routes/registerRoutes");
const apiRouter = require("./routes/apiRoutes");

// Serve static files from the 'efs' directory
app.use(express.static(path.join(__dirname, 'efs')));

app.use(express.json());
app.use(cookieParser());
app.use("/", indexRouter);
app.use('/my-memes', myMemeRouter);
app.use('/login', loginRouter);
app.use('/register', registerRouter);
app.use("/api", apiRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404, 'Endpoint not found'));
});

app.use(function (err, req, res, next) {
  // Log 500 Internal Server Errors
  if (err.status === 500 || !err.status) {
    console.error("Internal Server Error:", err);
  }

  const status = err.status || 500;

  // Send the error response
  res.status(status).json({
    error: {
      status: status,
      message: err.message,
    },
  });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
