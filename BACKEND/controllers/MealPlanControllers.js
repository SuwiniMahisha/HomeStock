const { MealPlan, Recipe } = require("../models/MealPlanModel");
const ProductModel = require("../models/ProductModel");

// ------ Recipe Controllers ------

// Create a new recipe
exports.createRecipe = async (req, res) => {
  try {
    const recipe = new Recipe(req.body);
    await recipe.save();
    res.status(201).json({
      success: true,
      message: "Recipe created successfully",
      recipe
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Recipe creation failed",
      error: error.message
    });
  }
};

// Get all recipes
exports.getAllRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find();
    res.status(200).json({
      success: true,
      count: recipes.length,
      recipes
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to fetch recipes",
      error: error.message
    });
  }
};

// Get recipe by ID
exports.getRecipeById = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: "Recipe not found"
      });
    }
    res.status(200).json({
      success: true,
      recipe
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to fetch recipe",
      error: error.message
    });
  }
};

// Update recipe
exports.updateRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: "Recipe not found"
      });
    }
    res.status(200).json({
      success: true,
      message: "Recipe updated successfully",
      recipe
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Recipe update failed",
      error: error.message
    });
  }
};

// Delete recipe
exports.deleteRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findByIdAndDelete(req.params.id);
    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: "Recipe not found"
      });
    }
    res.status(200).json({
      success: true,
      message: "Recipe deleted successfully"
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Recipe deletion failed",
      error: error.message
    });
  }
};

// ------ Meal Plan Controllers ------

// Create a new meal plan
exports.createMealPlan = async (req, res) => {
  try {
    const mealPlan = new MealPlan(req.body);
    await mealPlan.save();
    res.status(201).json({
      success: true,
      message: "Meal plan created successfully",
      mealPlan
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Meal plan creation failed",
      error: error.message
    });
  }
};

// Get all meal plans
exports.getAllMealPlans = async (req, res) => {
  try {
    const mealPlans = await MealPlan.find();
    res.status(200).json({
      success: true,
      count: mealPlans.length,
      mealPlans
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to fetch meal plans",
      error: error.message
    });
  }
};

// Get meal plan by ID
exports.getMealPlanById = async (req, res) => {
  try {
    const mealPlan = await MealPlan.findById(req.params.id)
      .populate('meals.breakfast')
      .populate('meals.lunch')
      .populate('meals.dinner')
      .populate('meals.snacks');
    
    if (!mealPlan) {
      return res.status(404).json({
        success: false,
        message: "Meal plan not found"
      });
    }
    res.status(200).json({
      success: true,
      mealPlan
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to fetch meal plan",
      error: error.message
    });
  }
};

// Update meal plan
exports.updateMealPlan = async (req, res) => {
  try {
    const mealPlan = await MealPlan.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!mealPlan) {
      return res.status(404).json({
        success: false,
        message: "Meal plan not found"
      });
    }
    res.status(200).json({
      success: true,
      message: "Meal plan updated successfully",
      mealPlan
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Meal plan update failed",
      error: error.message
    });
  }
};

// Delete meal plan
exports.deleteMealPlan = async (req, res) => {
  try {
    const mealPlan = await MealPlan.findByIdAndDelete(req.params.id);
    if (!mealPlan) {
      return res.status(404).json({
        success: false,
        message: "Meal plan not found"
      });
    }
    res.status(200).json({
      success: true,
      message: "Meal plan deleted successfully"
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Meal plan deletion failed",
      error: error.message
    });
  }
};

// Get active meal plan
exports.getActiveMealPlan = async (req, res) => {
  try {
    const currentDate = new Date();
    const activeMealPlan = await MealPlan.findOne({
      isActive: true,
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate }
    })
      .populate('meals.breakfast')
      .populate('meals.lunch')
      .populate('meals.dinner')
      .populate('meals.snacks');
    
    if (!activeMealPlan) {
      return res.status(404).json({
        success: false,
        message: "No active meal plan found"
      });
    }
    res.status(200).json({
      success: true,
      activeMealPlan
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to fetch active meal plan",
      error: error.message
    });
  }
};

// Check ingredients availability
exports.checkIngredientsAvailability = async (req, res) => {
  try {
    const { recipeId } = req.params;
    
    // Get the recipe
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: "Recipe not found"
      });
    }

    // Get all products in inventory
    const inventoryProducts = await ProductModel.find();
    
    // Check each ingredient
    const ingredientStatus = [];
    for (const recipeIngredient of recipe.ingredients) {
      // Find matching product in inventory
      const matchingProduct = inventoryProducts.find(product => 
        product.P_name.toLowerCase() === recipeIngredient.ingredient.toLowerCase());
      
      if (matchingProduct) {
        // Check if product is expired
        const currentDate = new Date();
        const expiryDate = new Date(matchingProduct.Expire_Date);
        
        if (expiryDate < currentDate) {
          // Product is expired, consider as missing
          ingredientStatus.push({
            ingredient: recipeIngredient.ingredient,
            required: {
              value: recipeIngredient.quantity.value,
              unit: recipeIngredient.quantity.unit
            },
            status: 'missing',
            reason: 'expired'
          });
        } else {
          // Product is not expired, check quantity
          const available = matchingProduct.Quantity.value >= recipeIngredient.quantity.value;
          ingredientStatus.push({
            ingredient: recipeIngredient.ingredient,
            required: {
              value: recipeIngredient.quantity.value,
              unit: recipeIngredient.quantity.unit
            },
            available: {
              value: matchingProduct.Quantity.value,
              unit: matchingProduct.Quantity.unit
            },
            status: available ? 'available' : 'insufficient'
          });
        }
      } else {
        // Ingredient not found
        ingredientStatus.push({
          ingredient: recipeIngredient.ingredient,
          required: {
            value: recipeIngredient.quantity.value,
            unit: recipeIngredient.quantity.unit
          },
          status: 'missing'
        });
      }
    }

    // Calculate missing or insufficient ingredients for shopping list
    const shoppingListItems = ingredientStatus
      .filter(item => item.status !== 'available')
      .map(item => {
        if (item.status === 'missing') {
          return {
            ingredient: item.ingredient,
            quantity: item.required,
            reason: 'missing'
          };
        } else {
          // Calculate the difference needed
          return {
            ingredient: item.ingredient,
            quantity: {
              value: item.required.value - item.available.value,
              unit: item.required.unit
            },
            reason: 'insufficient'
          };
        }
      });

    res.status(200).json({
      success: true,
      recipeName: recipe.name,
      ingredientStatus,
      shoppingListItems
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to check ingredients",
      error: error.message
    });
  }
};

// Generate meal plan report
exports.generateMealPlanReport = async (req, res) => {
  try {
    const { mealPlanId } = req.params;
    
    // Get the meal plan with populated recipes
    const mealPlan = await MealPlan.findById(mealPlanId)
      .populate('meals.breakfast')
      .populate('meals.lunch')
      .populate('meals.dinner')
      .populate('meals.snacks');
    
    if (!mealPlan) {
      return res.status(404).json({
        success: false,
        message: "Meal plan not found"
      });
    }

    // Aggregate all ingredients needed for the meal plan
    const allIngredients = {};
    
    // Helper function to add ingredients
    const addIngredients = (recipe) => {
      if (!recipe) return;
      
      recipe.ingredients.forEach(ing => {
        if (!allIngredients[ing.ingredient]) {
          allIngredients[ing.ingredient] = {
            total: ing.quantity.value,
            unit: ing.quantity.unit
          };
        } else {
          allIngredients[ing.ingredient].total += ing.quantity.value;
        }
      });
    };
    
    // Process all meals
    mealPlan.meals.forEach(meal => {
      if (meal.breakfast) addIngredients(meal.breakfast);
      if (meal.lunch) addIngredients(meal.lunch);
      if (meal.dinner) addIngredients(meal.dinner);
      if (meal.snacks && meal.snacks.length > 0) {
        meal.snacks.forEach(snack => addIngredients(snack));
      }
    });
    
    // Check each ingredient against inventory
    const inventoryProducts = await ProductModel.find();
    const ingredientStatus = [];
    
    for (const [ingredient, details] of Object.entries(allIngredients)) {
      const matchingProduct = inventoryProducts.find(product => 
        product.P_name.toLowerCase() === ingredient.toLowerCase());
      
      if (matchingProduct) {
        // Check if product is expired
        const currentDate = new Date();
        const expiryDate = new Date(matchingProduct.Expire_Date);
        
        if (expiryDate < currentDate) {
          // Product is expired, consider as missing
          ingredientStatus.push({
            ingredient,
            required: {
              value: details.total,
              unit: details.unit
            },
            status: 'missing',
            reason: 'expired'
          });
        } else {
          // Product is not expired, check quantity
          const available = matchingProduct.Quantity.value >= details.total;
          ingredientStatus.push({
            ingredient,
            required: {
              value: details.total,
              unit: details.unit
            },
            available: {
              value: matchingProduct.Quantity.value,
              unit: matchingProduct.Quantity.unit
            },
            status: available ? 'available' : 'insufficient'
          });
        }
      } else {
        ingredientStatus.push({
          ingredient,
          required: {
            value: details.total,
            unit: details.unit
          },
          status: 'missing'
        });
      }
    }

    // Calculate missing or insufficient ingredients for shopping list
    const shoppingListItems = ingredientStatus
      .filter(item => item.status !== 'available')
      .map(item => {
        if (item.status === 'missing') {
          return {
            ingredient: item.ingredient,
            quantity: item.required,
            reason: 'missing'
          };
        } else {
          return {
            ingredient: item.ingredient,
            quantity: {
              value: item.required.value - item.available.value,
              unit: item.required.unit
            },
            reason: 'insufficient'
          };
        }
      });

    // Generate meal plan summary
    const summary = {
      name: mealPlan.name,
      duration: `${mealPlan.startDate.toISOString().split('T')[0]} to ${mealPlan.endDate.toISOString().split('T')[0]}`,
      days: mealPlan.meals.length,
      totalRecipes: new Set([
        ...mealPlan.meals.filter(m => m.breakfast).map(m => m.breakfast._id.toString()),
        ...mealPlan.meals.filter(m => m.lunch).map(m => m.lunch._id.toString()),
        ...mealPlan.meals.filter(m => m.dinner).map(m => m.dinner._id.toString()),
        ...mealPlan.meals.flatMap(m => m.snacks ? m.snacks.map(s => s._id.toString()) : [])
      ]).size,
      missingIngredients: ingredientStatus.filter(i => i.status === 'missing').length,
      insufficientIngredients: ingredientStatus.filter(i => i.status === 'insufficient').length
    };

    res.status(200).json({
      success: true,
      mealPlanName: mealPlan.name,
      summary,
      ingredientStatus,
      shoppingListItems,
      mealPlanDetail: mealPlan
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to generate meal plan report",
      error: error.message
    });
  }
};

// Upload image for recipe
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file uploaded"
      });
    }

    // Create URL for the uploaded file
    const protocol = req.protocol;
    const host = req.get('host');
    const filePath = req.file.path.replace(/\\/g, '/'); // Replace backslashes with forward slashes
    const imageUrl = `${protocol}://${host}/${filePath}`;

    res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      imageUrl: imageUrl
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to upload image",
      error: error.message
    });
  }
}; 