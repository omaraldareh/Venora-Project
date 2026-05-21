const Favorite = require("../models/Favorite.model");
const Hall = require('../models/Hall.model');
const mongoose = require('mongoose');

const createFavorite = async (req, res) => {
    const {hallId} = req.params;

    try {
        const hall = await Hall.findById(hallId);

        if (!hall) {
            return res.status(404).json({
                message: "Hall not found"
            });
        }

        const existingFavorite = await Favorite.findOne({
            user: req.user.id,
            hall: hallId
        });

        if (existingFavorite) {
            return res.status(400).json({
                message: "Hall already added to favorites"
            });
        }

        const favorite = await Favorite.create({
            user: req.user.id,
            hall: hallId
        });

        return res.status(200).json({
            message: "Hall added to favorites successfully",
            data: favorite
        });
        
    } catch (error) {
        return res.status(500).json({
            message: "Server error",
            error: error.message
        })
    }
}

const getAllFavorites = async (req, res) => {
    try {
        const favorites = await Favorite.find({user: req.user.id}).populate('hall','name location images price');

        if(favorites.length === 0) {
            return res.status(200).json({
                message: "No favorites found"
            });
        }

        return res.status(200).json({
            message: "Favorites fetched successfully",
            count: favorites.length,
            data: favorites
        });

    } catch (error) {
        return res.status(500).json({
            message: "Server error",
            error: error.message
        })
    }
}

const deleteFavorite = async (req, res) => {
    const { hallId } = req.params;

    try {

        const favorite = await Favorite.findOne({
            user: req.user.id,
            hall: hallId
        });

        if (!favorite) {
            return res.status(404).json({
                message: "Favorite not found"
            });
        }

        await Favorite.findByIdAndDelete(favorite._id);

        return res.status(200).json({
            message: "Favorite removed successfully"
        });

    } catch (error) {

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });

    }

}

module.exports = {createFavorite, getAllFavorites, deleteFavorite};