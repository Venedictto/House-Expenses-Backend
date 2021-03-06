const mongoose = require('mongoose');
var ObjectId = require('mongoose').Types.ObjectId;


const ExpenseSchema = new mongoose.Schema({
   name: {
      type: String,
      required: true,
      trim: true,
   },
   type: {
      type: String,
      required: true,
      trim: true,
   },
   amount: {
      type: Number,
      required: true,
   },
   currentDate: {
      type: String,
      required: true,
   },
   paid: {
      type: Boolean,
      default: false
   },
   userId:{
      type:ObjectId,
      required:true,
      ref:'User'
   },
   created:{
      type:Date,
      default: Date.now(),
   }
});


module.exports = mongoose.model('Expense', ExpenseSchema);