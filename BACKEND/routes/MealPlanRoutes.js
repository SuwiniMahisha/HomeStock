const express = require("express");
const router = express.Router();
const MealPlanController = require("../controllers/MealPlanControllers");
const multer = require("multer");
const path = require("path");

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'recipe-' + uniqueSuffix + ext);
  }
});

// File type filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, JPG, PNG, GIF and WEBP are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: fileFilter
});

// Recipe routes
router.post("/recipes", MealPlanController.createRecipe);
router.get("/recipes", MealPlanController.getAllRecipes);
router.get("/recipes/:id", MealPlanController.getRecipeById);
router.put("/recipes/:id", MealPlanController.updateRecipe);
router.delete("/recipes/:id", MealPlanController.deleteRecipe);

// Meal plan routes
router.post("/", MealPlanController.createMealPlan);
router.get("/", MealPlanController.getAllMealPlans);
router.get("/active", MealPlanController.getActiveMealPlan);
router.get("/:id", MealPlanController.getMealPlanById);
router.put("/:id", MealPlanController.updateMealPlan);
router.delete("/:id", MealPlanController.deleteMealPlan);

// Ingredient availability check
router.get("/check-ingredients/:recipeId", MealPlanController.checkIngredientsAvailability);

// Meal plan report
router.get("/report/:mealPlanId", MealPlanController.generateMealPlanReport);

// Image upload route
router.post("/upload-image", upload.single('image'), MealPlanController.uploadImage);

module.exports = router; 