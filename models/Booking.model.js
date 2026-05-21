const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    user: {type : mongoose.Schema.Types.ObjectId, ref: "User", required : true},
    hall: {type : mongoose.Schema.Types.ObjectId, ref: "Hall", required : true},
    bookingDate: {type : Date, required : true},
    slot:{
        startTime: {type : String, required : true},
        endTime: {type : String, required : true},
    },
    status: {type: String,enum: ["confirmed", "cancelled"],default: "confirmed"},
    totalPrice: {type : Number, required : true},   
},{timestamps : true});
BookingSchema.index({hall: 1,   bookingDate: 1,"slot.startTime": 1,"slot.endTime": 1},
    {unique: true,partialFilterExpression: {status: { $ne: "cancelled" }}}
);
module.exports = mongoose.model("Booking", BookingSchema);