import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  Container, Paper, Typography, TextField, Button, 
  Grid, Box, Chip, FormControl, InputLabel, Select,
  MenuItem, IconButton, Divider, CircularProgress,
  Alert, Snackbar, LinearProgress
} from '@mui/material';
import { 
  Add as AddIcon, 
  Close as CloseIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import '../../css/MealPlanning.css';
import Sidebar from '../Sidebar';

const CreateRecipe = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get recipe ID if editing
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Recipe form state
  const [recipe, setRecipe] = useState({
    name: '',
    description: '',
    cookingTime: '',
    servings: '',
    instructions: '',
    ingredients: [],
    image: '',
    tags: []
  });

  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Form validation state
  const [errors, setErrors] = useState({});

  // Temporary states for adding ingredients
  const [currentIngredient, setCurrentIngredient] = useState('');
  const [currentQuantity, setCurrentQuantity] = useState('');
  const [currentUnit, setCurrentUnit] = useState('g');

  // Temporary state for adding tags
  const [currentTag, setCurrentTag] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);

  // Available tags and units
  const availableTags = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Low-Carb', 'High-Protein'];
  const availableUnits = ['g', 'kg', 'ml', 'L', 'tbsp', 'tsp', 'cup', 'piece(s)', 'slice(s)', 'pinch'];

  // Load existing recipe data if editing
  useEffect(() => {
    if (id) {
      setIsEditing(true);
      fetchRecipeData();
    }
  }, [id]);

  const fetchRecipeData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:8090/api/meal-plans/recipes/${id}`);
      const recipeData = response.data.recipe;
      
      setRecipe(recipeData);
      
      // Set selected tags from the recipe
      if (recipeData.tags && recipeData.tags.length > 0) {
        setSelectedTags(recipeData.tags);
      }
      
      setLoading(false);
    } catch (err) {
      setError('Failed to load recipe data');
      console.error(err);
      setLoading(false);
    }
  };

  // Handle input changes for basic recipe information
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRecipe({
      ...recipe,
      [name]: value
    });
    
    // Clear any error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  // Add an ingredient to the recipe
  const addIngredient = () => {
    if (!currentIngredient.trim() || !currentQuantity || !currentUnit) {
      setErrors({
        ...errors,
        ingredient: !currentIngredient.trim() ? 'Ingredient name is required' : null,
        quantity: !currentQuantity ? 'Quantity is required' : null,
        unit: !currentUnit ? 'Unit is required' : null
      });
      return;
    }

    const newIngredient = {
      ingredient: currentIngredient.trim(),
      quantity: {
        value: parseFloat(currentQuantity),
        unit: currentUnit
      }
    };

    setRecipe({
      ...recipe,
      ingredients: [...recipe.ingredients, newIngredient]
    });

    // Reset ingredient form
    setCurrentIngredient('');
    setCurrentQuantity('');
    setCurrentUnit('g');
    
    // Clear ingredient errors
    setErrors({
      ...errors,
      ingredient: null,
      quantity: null,
      unit: null
    });
  };

  // Remove an ingredient from the recipe
  const removeIngredient = (index) => {
    const updatedIngredients = [...recipe.ingredients];
    updatedIngredients.splice(index, 1);
    setRecipe({
      ...recipe,
      ingredients: updatedIngredients
    });
  };

  // Add a tag to the recipe
  const addTag = () => {
    if (selectedTags.includes(currentTag)) {
      return; // Tag already added
    }
    
    if (currentTag && !recipe.tags.includes(currentTag)) {
      setRecipe({
        ...recipe,
        tags: [...recipe.tags, currentTag]
      });
      setSelectedTags([...selectedTags, currentTag]);
      setCurrentTag('');
    }
  };

  // Remove a tag from the recipe
  const removeTag = (tagToRemove) => {
    setRecipe({
      ...recipe,
      tags: recipe.tags.filter(tag => tag !== tagToRemove)
    });
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };

  // Validate the form before submission
  const validateForm = () => {
    const newErrors = {};
    
    if (!recipe.name.trim()) newErrors.name = 'Recipe name is required';
    if (!recipe.cookingTime) newErrors.cookingTime = 'Cooking time is required';
    if (!recipe.servings) newErrors.servings = 'Number of servings is required';
    if (!recipe.instructions.trim()) newErrors.instructions = 'Instructions are required';
    if (recipe.ingredients.length === 0) newErrors.ingredientsList = 'At least one ingredient is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload image file
  const uploadImage = async () => {
    if (!selectedFile) return null;
    
    const formData = new FormData();
    formData.append('image', selectedFile);
    
    try {
      const response = await axios.post('http://localhost:8090/api/meal-plans/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      
      return response.data.imageUrl;
    } catch (err) {
      console.error("Error uploading image:", err);
      setError("Failed to upload image. Please try again or use an image URL instead.");
      return null;
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    const validationErrors = {};
    if (!recipe.name) validationErrors.name = 'Recipe name is required';
    if (!recipe.cookingTime) validationErrors.cookingTime = 'Cooking time is required';
    if (!recipe.servings) validationErrors.servings = 'Number of servings is required';
    if (!recipe.instructions) validationErrors.instructions = 'Instructions are required';
    if (recipe.ingredients.length === 0) validationErrors.ingredients = 'At least one ingredient is required';
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // If there's a selected file, upload it first
      let imageUrl = recipe.image;
      if (selectedFile) {
        imageUrl = await uploadImage();
        if (!imageUrl) {
          setLoading(false);
          return; // Stop if image upload failed
        }
      }
      
      // Update recipe with the new image URL
      const updatedRecipe = { ...recipe, image: imageUrl };
      
      let response;
      if (isEditing) {
        // Update existing recipe
        response = await axios.put(`http://localhost:8090/api/meal-plans/recipes/${id}`, updatedRecipe);
      } else {
        // Create new recipe
        response = await axios.post('http://localhost:8090/api/meal-plans/recipes', updatedRecipe);
      }
      
      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/meal-planning/recipes');
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save recipe');
      console.error(err);
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="mealplanning-container">
      <Sidebar />
      <div className="meal-content-wrapper">
        <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/meal-planning/recipes')}
              sx={{ mr: 2 }}
            >
              Back to Recipes
            </Button>
            <Typography variant="h4" className="page-title">
              {isEditing ? 'Edit Recipe' : 'Create New Recipe'}
            </Typography>
          </Box>
          
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          
          <Snackbar
            open={success}
            autoHideDuration={2000}
            onClose={() => setSuccess(false)}
          >
            <Alert severity="success" sx={{ width: '100%' }}>
              Recipe created successfully!
            </Alert>
          </Snackbar>
          
          <Paper elevation={3} sx={{ p: 4 }}>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                {/* Basic Information */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Basic Information
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={8}>
                  <TextField
                    fullWidth
                    label="Recipe Name"
                    name="name"
                    value={recipe.name}
                    onChange={handleInputChange}
                    error={!!errors.name}
                    helperText={errors.name}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    label="Cooking Time (mins)"
                    name="cookingTime"
                    type="number"
                    value={recipe.cookingTime}
                    onChange={handleInputChange}
                    error={!!errors.cookingTime}
                    helperText={errors.cookingTime}
                    required
                    InputProps={{ inputProps: { min: 1 } }}
                  />
                </Grid>
                
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    label="Servings"
                    name="servings"
                    type="number"
                    value={recipe.servings}
                    onChange={handleInputChange}
                    error={!!errors.servings}
                    helperText={errors.servings}
                    required
                    InputProps={{ inputProps: { min: 1 } }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    name="description"
                    value={recipe.description}
                    onChange={handleInputChange}
                    multiline
                    rows={2}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>Recipe Image</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Image URL (Optional)"
                        name="image"
                        value={recipe.image}
                        onChange={handleInputChange}
                        placeholder="https://example.com/image.jpg"
                      />
                      <Typography variant="caption" color="textSecondary">
                        Enter a valid image URL (must start with http:// or https://)
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Button
                        variant="outlined"
                        component="label"
                        fullWidth
                        sx={{ height: '56px' }}
                      >
                        Upload Image
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={handleFileSelect}
                        />
                      </Button>
                      <Typography variant="caption" color="textSecondary">
                        Or upload an image from your device
                      </Typography>
                    </Grid>
                    {(uploadProgress > 0 && uploadProgress < 100) && (
                      <Grid item xs={12}>
                        <LinearProgress variant="determinate" value={uploadProgress} />
                      </Grid>
                    )}
                    <Grid item xs={12}>
                      {(previewUrl || recipe.image) && (
                        <Box sx={{ mt: 2, textAlign: 'center' }}>
                          <img 
                            src={previewUrl || recipe.image} 
                            alt="Recipe preview" 
                            style={{ maxHeight: '200px', maxWidth: '100%', objectFit: 'contain' }}
                            onError={(e) => {
                              if (e.target.src !== 'https://via.placeholder.com/400x300?text=Image+Not+Found') {
                                e.target.onerror = null;
                                e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
                              }
                            }}
                          />
                        </Box>
                      )}
                    </Grid>
                  </Grid>
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                </Grid>
                
                {/* Ingredients Section */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Ingredients
                  </Typography>
                  {errors.ingredientsList && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {errors.ingredientsList}
                    </Alert>
                  )}
                </Grid>
                
                <Grid item xs={12} md={5}>
                  <TextField
                    fullWidth
                    label="Ingredient"
                    value={currentIngredient}
                    onChange={(e) => setCurrentIngredient(e.target.value)}
                    error={!!errors.ingredient}
                    helperText={errors.ingredient}
                  />
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Quantity"
                    type="number"
                    value={currentQuantity}
                    onChange={(e) => setCurrentQuantity(e.target.value)}
                    error={!!errors.quantity}
                    helperText={errors.quantity}
                    InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                  />
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth error={!!errors.unit}>
                    <InputLabel>Unit</InputLabel>
                    <Select
                      value={currentUnit}
                      onChange={(e) => setCurrentUnit(e.target.value)}
                      label="Unit"
                    >
                      {availableUnits.map((unit) => (
                        <MenuItem key={unit} value={unit}>
                          {unit}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={1}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={addIngredient}
                    sx={{ height: '100%' }}
                  >
                    <AddIcon />
                  </Button>
                </Grid>
                
                {/* Ingredient List */}
                <Grid item xs={12}>
                  <Paper 
                    variant="outlined" 
                    sx={{ p: 2, maxHeight: '200px', overflowY: 'auto', mb: 2 }}
                  >
                    {recipe.ingredients.length > 0 ? (
                      <Grid container spacing={1}>
                        {recipe.ingredients.map((ing, index) => (
                          <Grid item xs={12} key={index}>
                            <Box 
                              sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                p: 1,
                                borderRadius: 1,
                                bgcolor: index % 2 === 0 ? '#f5f5f5' : 'transparent'
                              }}
                            >
                              <Typography>
                                {ing.ingredient} ({ing.quantity.value} {ing.quantity.unit})
                              </Typography>
                              <IconButton 
                                size="small" 
                                color="error" 
                                onClick={() => removeIngredient(index)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    ) : (
                      <Typography align="center" color="textSecondary">
                        No ingredients added yet
                      </Typography>
                    )}
                  </Paper>
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                </Grid>
                
                {/* Instructions */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Instructions
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Cooking Instructions"
                    name="instructions"
                    value={recipe.instructions}
                    onChange={handleInputChange}
                    multiline
                    rows={6}
                    error={!!errors.instructions}
                    helperText={errors.instructions}
                    required
                    placeholder="Step-by-step instructions for preparing the recipe..."
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                </Grid>
                
                {/* Tags */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Tags
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Add Tag</InputLabel>
                    <Select
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      label="Add Tag"
                    >
                      {availableTags
                        .filter(tag => !selectedTags.includes(tag))
                        .map((tag) => (
                          <MenuItem key={tag} value={tag}>
                            {tag}
                          </MenuItem>
                        ))
                      }
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={1}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={addTag}
                    disabled={!currentTag}
                    sx={{ height: '100%' }}
                  >
                    <AddIcon />
                  </Button>
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {recipe.tags.map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        onDelete={() => removeTag(tag)}
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                    {recipe.tags.length === 0 && (
                      <Typography color="textSecondary">
                        No tags added yet
                      </Typography>
                    )}
                  </Box>
                </Grid>
                
                {/* Submit Button */}
                <Grid item xs={12} sx={{ mt: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      type="button"
                      variant="outlined"
                      onClick={() => navigate('/meal-planning/recipes')}
                      sx={{ mr: 2 }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} /> : null}
                    >
                      {loading ? 'Saving...' : 'Save Recipe'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Container>
      </div>
    </div>
  );
};

export default CreateRecipe; 