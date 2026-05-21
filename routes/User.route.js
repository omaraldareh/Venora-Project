const express = require('express');
const { getAllUsers, getUserById, UpdateUserProfile } = require('../controllers/User.controller');
const authentication = require('../middleware//Authentication');
const authorization = require('../middleware/Authorization');

const UserRouter = express.Router();

UserRouter.get('/getAllUsers',authentication,authorization('admin'),getAllUsers);
UserRouter.get('/:id',authentication,authorization('admin'),getUserById);
UserRouter.put('/profile/me',authentication,UpdateUserProfile);


module.exports = UserRouter 