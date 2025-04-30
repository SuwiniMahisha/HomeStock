const mongoose = require("mongoose");

const recipeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: false
  },
  cookingTime: {
    type: Number,
    required: true
  },
  servings: {
    type: Number,
    required: true
  },
  instructions: {
    type: String,
    required: true
  },
  ingredients: [{
    ingredient: {
      type: String,
      required: true
    },
    quantity: {
      value: { type: Number, required: true },
      unit: { type: String, required: true } // grams, cups, pieces, etc.
    }
  }],
  image: {
    type: String,
    required: false
  },
  tags: [{
    type: String,
    enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Low-Carb', 'High-Protein']
  }]
});

const mealPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  meals: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true
    },
    breakfast: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe'
    },
    lunch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe'
    },
    dinner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe'
    },
    snacks: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe'
    }]
  }],
  notes: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const Recipe = mongoose.model("Recipe", recipeSchema);
const MealPlan = mongoose.model("MealPlan", mealPlanSchema);

module.exports = { MealPlan, Recipe }; 