const express = require('express');

const authentication = require('../middleware/Authentication');

const authorization = require('../middleware/Authorization');

const upload = require('../middleware/upload');

const {createHall,GetAllHalls,HallDetails,MyHalls,UpdateHall,DeleteHall,BrowseHalls} = require('../controllers/Hall.controller');

const HallRouter = express.Router();

HallRouter.post('/createHall', authentication, authorization('provider', 'admin'),upload.array('images', 10),createHall);

HallRouter.get('/getAllHalls', authentication, authorization('admin'), GetAllHalls);

HallRouter.get('/browseHalls', BrowseHalls);

HallRouter.get('/myHalls', authentication, authorization('provider'), MyHalls);

HallRouter.put("/updateHall/:id",authentication,authorization("provider", "admin"),upload.array("images", 5),UpdateHall);

HallRouter.delete('/deleteHall/:id', authentication, authorization('provider', 'admin'), DeleteHall);

HallRouter.get('/:id', HallDetails);

module.exports = HallRouter;