const User = require('../models/User.model');

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: "user" }).select("-password");
            return res.status(200).json(
            {
                message: "Users fetched successfully",
                data: users
            }
        );
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const getAllProviders = async (req, res) => {
    try {
        const providers = await User.find({ role: "provider" }).select("-password");
        
        return res.status(200).json({
            message: "Providers fetched successfully",
            data: providers
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}
const getUserById = async(req, res) => {
    const {id} = req.params;
    
    try {
      const user = await User.findById(id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json(
            {
                message: "User fetched successfully",
                data: user
            }
        );
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const UpdateUserProfile = async (req, res) => {
    const id = req.user.id;

    try {

        if (req.user.role === "admin") {
            return res.status(403).json({
                message: "Admin cannot update profile"
            });
        }

        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({
                message: "No data provided for update"
            });
        }

        const allowedFields = ["name", "phone", "address"];

        const updates = {};

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                message: "No valid fields provided"
            });
        }

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const updatedUser = await User.findByIdAndUpdate(id,updates,{ new: true }).select("-password");
        return res.status(200).json({
            message: "User updated successfully",
            data: updatedUser
        });
        

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }

}
module.exports = {
    getAllUsers,
    getAllProviders,
    getUserById,
    UpdateUserProfile
}