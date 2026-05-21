const mongoose = require('mongoose');

const FavoriteSchema = new mongoose.Schema({

   user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
   },

   hall: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hall',
      required: true
   }

}, { timestamps: true });

module.exports = mongoose.model('Favorite', FavoriteSchema);