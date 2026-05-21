const express = require('express');

const FavoriteRouter = express.Router();

const { createFavorite, getAllFavorites, deleteFavorite } = require('../controllers/Favourite.controller');
const authentication = require('../middleware/Authentication');
const authorization = require('../middleware/Authorization');

FavoriteRouter.post('/:hallId',authentication,authorization('user'),createFavorite);

FavoriteRouter.get('/myFavorites',authentication,authorization('user'),getAllFavorites);

FavoriteRouter.delete('/:hallId',authentication,authorization('user'),deleteFavorite);

module.exports = FavoriteRouter