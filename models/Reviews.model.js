const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    user: {type : mongoose.Schema.Types.ObjectId, ref: "User", required : true},
    hall: {type : mongoose.Schema.Types.ObjectId, ref: "Hall", required : true},
    rating: {type : Number, required : true , min : 1, max : 5},
    comment: {type : String, trim : true,    default: ""},
},{timestamps : true});

ReviewSchema.index(
    { user: 1, hall: 1 },
    { unique: true }
);

module.exports = mongoose.model("Review", ReviewSchema);