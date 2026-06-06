const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const AuthRouter = require("./routes/Auth.route");
const UserRouter = require("./routes/User.route");
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');


require('dotenv').config();
const nodemailer = require('nodemailer');
const HallRouter = require("./routes/Hall.route");
const BookingRouter = require("./routes/Booking.route");
const FavoriteRouter = require("./routes/Favourite.route");
const ReviewRouter = require("./routes/Review.route");
const AdminRouter = require("./routes/Admin.route");
const SearchRouter = require("./routes/Search.route");
const ProviderRouter = require("./routes/Provider.route");

const app = express();

app.use(express.json());

connectDB();

app.use(cors());

app.use(express.urlencoded({ extended: true }));
   
app.get('/health', (req, res) => {
    res.status(200).json({ status: "UP", message: "Server is alive and kicking!" });
});

app.use('/api/auth',AuthRouter);
app.use('/api/user/',UserRouter);
app.use('/api/hall',HallRouter);
app.use('/api/booking',BookingRouter);
app.use('/api/favorite',FavoriteRouter);
app.use('/api/review',ReviewRouter);
app.use('/api/Admin',AdminRouter);
app.use('/api/Search',SearchRouter);
app.use('/api/provider',ProviderRouter);


app.use("/uploads", express.static("uploads"));


const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log("REDIS_URL =", process.env.REDIS_URL ? "FOUND" : "MISSING");
  console.log("EMAIL =", process.env.EMAIL ? "FOUND" : "MISSING");
  console.log("MONGO_URI =", process.env.MONGO_URI ? "FOUND" : "MISSING");
  console.log(`Server is running on port ${PORT}`);
});