const mongoose = require("mongoose");

const HallSchema = new mongoose.Schema({

    name: {type: String,required: true,unique: true,trim: true},
    description: {type: String,required: true},
    images: [{type: String}],
    capacity: {type: Number,required: true,min: 1},
    location: {city: {type: String,required: true,trim: true},
               address: {type: String,required: true,trim: true}},
    provider: {type: mongoose.Schema.Types.ObjectId,ref: "User",required: true},
    hallType: {type: String,enum: ["meeting", "wedding", "conference", "event"],required: true},
    amenities: [{type: String}],
availableSlots: [{startTime: {type: String,required: true},endTime: {type: String,required: true},
        price: {type: Number,required: true,min: 0}}],
    rating: {type: Number,default: 0},
    reviewsCount: {type: Number,default: 0},
status: {type: String,enum: ["pending", "approved", "rejected"],default: "pending"}},
 { timestamps: true });

module.exports = mongoose.model("Hall", HallSchema);