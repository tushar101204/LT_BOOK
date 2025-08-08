const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors")
const fileUpload = require('express-fileupload');
const xlsx = require('xlsx');
 const connectDB = require("./DB/conn");
const cookieParser = require("cookie-parser");
const app = express();
app.use(cookieParser());
app.use(fileUpload());

app.use(cors({
  credentials: true,
  origin: true}));  
  
app.set("trust proxy",1); 


app.use(express.json());

// dotenv.config({path:"./.env"})
require("dotenv").config();

// app.use((req, res, next) => {
//   res.header('Access-Control-Allow-Credentials', true);
//   next();
// });

require("./model/userSchema")
require("./model/hallSchema")
require("./model/bookingSchema")

app.use(require("./router/authRoutes"));
app.use(require("./router/bookingRoutes"));
app.use(require("./router/hallRoutes"));

// const authRoutes = require("./router/authRoutes");
// const hallRoutes = require("./router/hallRoutes");
// const bookingRoutes = require("./router/bookingRoutes");

// app.use("/api/auth", authRoutes);
// app.use('/api/halls', hallRoutes);
// app.use('/api/bookings', bookingRoutes);

connectDB()


const PORT = process.env.PORT



app.listen(PORT, () => {
   console.log(`Server is running on port ${PORT}`);
});
