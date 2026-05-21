const express = require('express');

const authentication = require('../middleware/Authentication');
const authorization = require('../middleware/Authorization');
const { pendingHalls, ApproveHall, rejectHall, Dashboard, getAllUsers } = require('../controllers/Admin.controller');

const AdminRouter = express.Router();

AdminRouter.get('/getPendingHalls',authentication,authorization('admin'),pendingHalls);
AdminRouter.patch('/approveHall/:hallId',authentication,authorization('admin'),ApproveHall);
AdminRouter.patch('/rejectHall/:hallId',authentication,authorization('admin'),rejectHall);
AdminRouter.get('/dashboard',authentication,authorization('admin'),Dashboard);

module.exports = AdminRouter
