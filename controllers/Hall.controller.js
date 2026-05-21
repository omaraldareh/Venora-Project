const Hall = require('../models/Hall.model');
const mongoose = require("mongoose");

const createHall = async (req, res) => {

    const {name,description,capacity,location,hallType,amenities,availableSlots} = req.body;

    try {

        const imageUrls = req.files.map(
            file => file.path
        );

        const locationObj =
            JSON.parse(location);

        const amenitiesArr =
            JSON.parse(amenities);

        const availableSlotsArr =
            JSON.parse(availableSlots);

        const newHall = await Hall.create({
            name,
            description,
            images: imageUrls,
            capacity,
            location: locationObj,
            hallType,
            amenities: amenitiesArr,
            availableSlots: availableSlotsArr,
            provider: req.user.id
        });

        return res.status(201).json({
            message: "Hall created successfully",
            data: newHall
        });

    } catch (error) {

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });

    }
};

const GetAllHalls = async (req, res) => {

    const { status } = req.query;

    try {
        let filter = {};

        if (status) {
            filter.status = status;
        }

        const halls = await Hall.find(filter);

        return res.status(200).json({
            message: "Halls fetched successfully",
            data: halls
        });

    } catch (error) {

        return res.status(500).json({
            message: "Server error",
            error: error.message
        });

    }

};

const  HallDetails = async(req,res) => {
    const {id} = req.params;

    try {
        const hall = await Hall.findById(id);

        if (!hall) {
            return res.status(404).json({
                message: "Hall not found"
            });
        }
        return res.status(200).json({
            message: "Hall fetched successfully",
            data: hall
        });
    } catch (error) {
        return res.status(500).json({
            error: error.message
        })
    }
}

const MyHalls = async(req,res) => {
    try {
        const halls = await Hall.find({provider: req.user.id}).populate('provider');
        return res.status(200).json({
            message: "Halls fetched successfully",
            data: halls
        });
    } catch (error) {
        return res.status(500).json({
            error: error.message
        })
    }
}


const UpdateHall = async (req, res) => {

    const { id } = req.params;

    try {

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid hall ID"
            });
        }

        const hall = await Hall.findById(id);

        if (!hall) {
            return res.status(404).json({
                message: "Hall not found"
            });
        }

        if (hall.provider.toString() !== req.user.id) {
            return res.status(403).json({
                message: "You are not authorized to update this hall"
            });
        }

        const updates = {};

        // Text Fields
        if (req.body.name) {
            updates.name = req.body.name;
        }

        if (req.body.description) {
            updates.description = req.body.description;
        }

        if (req.body.capacity) {
            updates.capacity = req.body.capacity;
        }

        if (req.body.hallType) {
            updates.hallType = req.body.hallType;
        }

        // JSON Fields
        if (req.body.location) {
            updates.location = JSON.parse(req.body.location);
        }

        if (req.body.amenities) {
            updates.amenities = JSON.parse(req.body.amenities);
        }

        if (req.body.availableSlots) {
            updates.availableSlots = JSON.parse(
                req.body.availableSlots
            );
        }

        // Images
        if (req.files && req.files.length > 0) {

            const imageUrls = req.files.map(
                file => file.path
            );

            updates.images = imageUrls;
        }

        const updatedHall = await Hall.findByIdAndUpdate(
            id,
            updates,
            {
                new: true,
                runValidators: true
            }
        );

        return res.status(200).json({
            message: "Hall updated successfully",
            data: updatedHall
        });

    } catch (error) {

        return res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};


const DeleteHall = async(req,res) => {
    const {id} = req.params;

    if(!id) {
        return res.status(400).json({
            message: "Hall id is required"
        });
    }

    try {
        const hall = await Hall.findById(id);

        if (!hall) {
            return res.status(404).json({
                message: "Hall not found"
            });
        }

        if (
            hall.provider.toString() !== req.user.id &&
            req.user.role !== "admin"
        ) {
            return res.status(403).json({
                message: "You are not allowed to delete this hall"
            });
        }

        await Hall.findByIdAndDelete(id);
        return res.status(200).json({
            message: "Hall deleted successfully"
        });

    } catch (error) {
        return res.status(500).json({
            error: error.message
        })
    }
}

const BrowseHalls = async (req, res) => {
    try {

        const page = Math.max(Number(req.query.page) || 1, 1);

        const limit = Math.min(
            Math.max(Number(req.query.limit) || 10, 1),
            50
        );

        const skip = (page - 1) * limit;

        const sortMap = {
            newest: { createdAt: -1 },
            oldest: { createdAt: 1 },
            price: { startingPrice: 1 },
            "-price": { startingPrice: -1 },
            rating: { rating: -1 }
        };

        const sortOption =
            sortMap[req.query.sort] || { createdAt: -1 };

        const filter = {
            status: "approved"
        };

        const halls = await Hall.find(filter)
            .sort(sortOption)
            .skip(skip)
            .limit(limit)
            .select(
                "name images hallType location capacity rating startingPrice"
            );

        const total = await Hall.countDocuments(filter);

        return res.status(200).json({
            message: "Halls fetched successfully",
            results: halls.length,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page < Math.ceil(total / limit),
                hasPrevPage: page > 1
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



module.exports = {
    createHall,
    GetAllHalls,
    HallDetails,
    MyHalls,
    UpdateHall,
    DeleteHall,
    BrowseHalls
}