const express = require("express");
const ProviderRouter = express.Router();


const {ProviderBookings,ProviderHalls,ProviderReviews,ProviderStatistics} = require("../controllers/Provider.controller"); 

const authentication = require("../middleware/Authentication");
const authorization = require("../middleware/Authorization");

ProviderRouter.get("/statistics", authentication, authorization("provider"), ProviderStatistics); 
ProviderRouter.get("/halls",authentication,authorization("provider") ,ProviderHalls);           
ProviderRouter.get("/bookings", authentication, authorization("provider"), ProviderBookings);     
ProviderRouter.get("/reviews", authentication, authorization("provider"), ProviderReviews);       

module.exports = ProviderRouter;