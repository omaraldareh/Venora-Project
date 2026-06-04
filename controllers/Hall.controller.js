const Hall = require('../models/Hall.model');
const mongoose = require("mongoose");


const createHall = async (req, res) => {
    try {
        // ========================
        // 1. Check user (IMPORTANT)
        // ========================
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                message: "Unauthorized - user not found"
            });
        }

        const {
            name,
            description,
            capacity,
            hallType,
            location,
            amenities,
            availableSlots
        } = req.body;

        // ========================
        // 2. Parse JSON safely
        // ========================
        let locationObj = {};
        let amenitiesArr = [];
        let availableSlotsArr = [];

        try {
            locationObj =
                typeof location === "string"
                    ? JSON.parse(location)
                    : location || {};

            amenitiesArr =
                typeof amenities === "string"
                    ? JSON.parse(amenities)
                    : amenities || [];

            availableSlotsArr =
                typeof availableSlots === "string"
                    ? JSON.parse(availableSlots)
                    : availableSlots || [];
        } catch (err) {
            return res.status(400).json({
                message: "Invalid JSON format in request body"
            });
        }

        // ========================
        // 3. Validate required fields
        // ========================
        if (
            !name ||
            !description ||
            !capacity ||
            !hallType ||
            !locationObj.city ||
            !locationObj.address
        ) {
            return res.status(400).json({
                message: "Missing required fields"
            });
        }

        // ========================
        // 4. Images validation
        // ========================
        const images =
            req.files && req.files.length > 0
                ? req.files.map((f) => f.path)
                : [];

        if (images.length === 0) {
            return res.status(400).json({
                message: "At least one image is required"
            });
        }

        // ========================
        // 5. Create Hall
        // ========================
        const newHall = await Hall.create({
            name,
            description,
            images,
            capacity: Number(capacity),
            hallType,
            location: locationObj,
            amenities: amenitiesArr,
            availableSlots: availableSlotsArr,
            provider: req.user.id,
            status: "pending" // مهم حسب الـ schema
        });

        return res.status(201).json({
            message: "Hall created successfully",
            data: newHall
        });

    } catch (error) {
        console.error("CREATE HALL ERROR:", error);

        return res.status(500).json({
            message: "Server error",
            error: error.message,
            details: error.errors || null
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

        const hall = await Hall.findById(id).populate("provider", "phone name email");
        
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

        // 1. Text Fields
        if (req.body.name) updates.name = req.body.name;
        if (req.body.description) updates.description = req.body.description;
        if (req.body.capacity) updates.capacity = req.body.capacity;
        if (req.body.hallType) updates.hallType = req.body.hallType;

        // 2. JSON Fields
        if (req.body.location) updates.location = JSON.parse(req.body.location);
        if (req.body.amenities) updates.amenities = JSON.parse(req.body.amenities);
        if (req.body.availableSlots) updates.availableSlots = JSON.parse(req.body.availableSlots);

        let finalImages = [];
        if (req.body.existingImages) {
            finalImages = JSON.parse(req.body.existingImages);
        }

        
        const deletedImages = hall.images.filter(img => !finalImages.includes(img));
        if (deletedImages.length > 0) {

        }

        if (req.files && req.files.length > 0) {
            const newImageUrls = req.files.map(file => file.path); 
            finalImages = [...finalImages, ...newImageUrls];
        }

        updates.images = finalImages;

        // 4. Update Database
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
            price: { "availableSlots.price": 1 },
            "-price": { "availableSlots.price": -1 },
            rating: { rating: -1 }
        };

        const sortOption =
            sortMap[req.query.sort] || { createdAt: -1 };

        const filter = {
            status: "approved"
        };

        if (req.query.city) {
            filter["location.city"] = {
                $regex: req.query.city,
                $options: "i"
            };
        }

        if (req.query.capacity) {
            filter.capacity = {
                $gte: Number(req.query.capacity)
            };
        }

        if (req.query.hallType) {
            filter.hallType = req.query.hallType;
        }

        if (req.query.minPrice || req.query.maxPrice) {

            filter.availableSlots = {
                $elemMatch: {
                    price: {
                        ...(req.query.minPrice && {
                            $gte: Number(req.query.minPrice)
                        }),

                        ...(req.query.maxPrice && {
                            $lte: Number(req.query.maxPrice)
                        })
                    }
                }
            };
        }

        const halls = await Hall.find(filter)
            .sort(sortOption)
            .skip(skip)
            .limit(limit)
            .select(
                "name images hallType location capacity rating availableSlots"
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