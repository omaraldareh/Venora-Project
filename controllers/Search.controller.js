const Hall = require("../models/Hall.model");
const mongoose = require("mongoose");

const SearchHalls = async (req, res) => {
    try {
        const {keyword,city,hallType,minPrice,maxPrice,capacity,sort} = req.query;

        let filter = {
            status: "approved"
        };

        if (keyword) {
            filter.name = {
                $regex: keyword,
                $options: "i"
            };
        }

        if (city) {
            filter["location.city"] = {
                $regex: city,
                $options: "i"
            };
        }

        if (hallType) {
            filter.hallType = hallType;
        }

        if (capacity) {
            filter.capacity = {
                $gte: Number(capacity)
            };
        }

        if (minPrice || maxPrice) {
            filter.availableSlots = {
                $elemMatch: {
                    price: {
                        ...(minPrice && {
                            $gte: Number(minPrice)
                        }),
                        ...(maxPrice && {
                            $lte: Number(maxPrice)
                        })
                    }
                }
            };
        }

        const sortMap = {
            price: { startingPrice: 1 },
            "-price": { startingPrice: -1 },
            rating: { rating: 1 },
            "-rating": { rating: -1 }
        };

        const sortOption = sortMap[sort] || {};

        const page = Math.max(Number(req.query.page) || 1, 1);

        const limit = Math.min(
            Math.max(Number(req.query.limit) || 10, 1),
            50
        );

        const skip = (page - 1) * limit;

        const halls = await Hall.find(filter)
            .sort(sortOption)
            .skip(skip)
            .limit(limit);

        const total = await Hall.countDocuments(filter);

        return res.status(200).json({
            message: "Halls fetched successfully",
            results: halls.length,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            },
            data: halls
        });

    } catch (error) {
        return res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

module.exports = { SearchHalls };