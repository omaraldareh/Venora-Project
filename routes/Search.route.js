const express = require('express');

const { SearchHalls } = require('../controllers/Search.controller');
const SearchRouter = express.Router();

SearchRouter.get('/Search',SearchHalls);

module.exports = SearchRouter