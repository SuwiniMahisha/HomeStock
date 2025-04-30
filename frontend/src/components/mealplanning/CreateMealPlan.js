import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  Container, Grid, Typography, Button, Box, Paper, Divider, Chip, 
  CircularProgress, Alert, FormControl, InputLabel, 
  Select, MenuItem, FormHelperText, IconButton, Dialog, 
  DialogActions, DialogContent, DialogTitle, Card, CardContent,
  CardMedia, Tab, Tabs, Snackbar, FormControlLabel, Switch,
  TextField as MuiTextField
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  CalendarMonth as CalendarIcon,
  Event as EventIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import TextField from '../TextField';
import '../../css/MealPlanning.css';
import Sidebar from '../Sidebar';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snacks'];
const MEAL_TYPE_LABELS = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snacks'
};

const CreateMealPlan = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Get meal plan ID if editing
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [recipes, setRecipes] = useState([]);
  
  // Meal plan form state
  const [mealPlan, setMealPlan] = useState({
    name: '',
    startDate: new Date(),
    endDate: new Date(new Date().setDate(new Date().getDate() + 6)), // Default to 1 week
    meals: DAYS_OF_WEEK.map(day => ({
      day,
      breakfast: null,
      lunch: null,
      dinner: null,
      snacks: []
    })),
    notes: '',
    isActive: true
  });
  
  // Recipe selector dialog state
  const [recipeDialogOpen, setRecipeDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedMealType, setSelectedMealType] = useState(null);
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  
  // Form validation state
  const [errors, setErrors] = useState({});
  
  // Load existing meal plan data if editing
  useEffect(() => {
    // Fetch recipes regardless of whether we're editing or creating
    fetchRecipes();
    
    if (id) {
      setIsEditing(true);
      fetchMealPlanData();
    }
  }, [id]);

  const fetchMealPlanData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:8090/api/meal-plans/${id}`);
      const mealPlanData = response.data.mealPlan;
      
      setMealPlan({
        name: mealPlanData.name || '',
        startDate: mealPlanData.startDate ? new Date(mealPlanData.startDate).toISOString().split('T')[0] : '',
        endDate: mealPlanData.endDate ? new Date(mealPlanData.endDate).toISOString().split('T')[0] : '',
        notes: mealPlanData.notes || '',
        isActive: mealPlanData.isActive || false,
        meals: mealPlanData.meals || []
      });
      
      setLoading(false);
    } catch (err) {
      setError('Failed to load meal plan data');
      console.error(err);
      setLoading(false);
    }
  };

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8090/api/meal-plans/recipes');
      setRecipes(response.data.recipes || []);
      setFilteredRecipes(response.data.recipes || []);
    } catch (err) {
      setError('Failed to load recipes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Filter recipes when search query changes
  useEffect(() => {
    if (recipes.length > 0) {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        setFilteredRecipes(
          recipes.filter(recipe => 
            recipe.name.toLowerCase().includes(query) || 
            (recipe.description && recipe.description.toLowerCase().includes(query))
          )
        );
      } else {
        setFilteredRecipes(recipes);
      }
    }
  }, [searchQuery, recipes]);
  
  // Handle input changes for basic meal plan information
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMealPlan({
      ...mealPlan,
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
  
  // Handle date changes
  const handleDateChange = (name, date) => {
    setMealPlan({
      ...mealPlan,
      [name]: date
    });
    
    // Clear any error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };
  
  // Handle active toggle
  const handleActiveToggle = (e) => {
    setMealPlan({
      ...mealPlan,
      isActive: e.target.checked
    });
  };
  
  // Open recipe selection dialog
  const openRecipeDialog = (day, mealType) => {
    setSelectedDay(day);
    setSelectedMealType(mealType);
    setRecipeDialogOpen(true);
  };
  
  // Close recipe selection dialog
  const closeRecipeDialog = () => {
    setRecipeDialogOpen(false);
    setSelectedDay(null);
    setSelectedMealType(null);
    setSearchQuery('');
    setSelectedTabIndex(0);
  };
  
  // Select a recipe for a meal
  const selectRecipe = (recipe) => {
    const updatedMeals = [...mealPlan.meals];
    const dayIndex = updatedMeals.findIndex(meal => meal.day === selectedDay);
    
    if (dayIndex !== -1) {
      if (selectedMealType === 'snacks') {
        // For snacks, add to the array
        if (!updatedMeals[dayIndex].snacks.some(snack => snack === recipe._id)) {
          updatedMeals[dayIndex].snacks.push(recipe._id);
        }
      } else {
        // For other meal types, just set the ID
        updatedMeals[dayIndex][selectedMealType] = recipe._id;
      }
      
      setMealPlan({
        ...mealPlan,
        meals: updatedMeals
      });
    }
    
    closeRecipeDialog();
  };
  
  // Remove a recipe from a meal
  const removeRecipe = (day, mealType, recipeId) => {
    const updatedMeals = [...mealPlan.meals];
    const dayIndex = updatedMeals.findIndex(meal => meal.day === day);
    
    if (dayIndex !== -1) {
      if (mealType === 'snacks') {
        // For snacks, remove from the array
        updatedMeals[dayIndex].snacks = updatedMeals[dayIndex].snacks.filter(id => id !== recipeId);
      } else {
        // For other meal types, set to null
        updatedMeals[dayIndex][mealType] = null;
      }
      
      setMealPlan({
        ...mealPlan,
        meals: updatedMeals
      });
    }
  };
  
  // Get recipe by ID
  const getRecipeById = (id) => {
    return recipes.find(recipe => recipe._id === id) || null;
  };
  
  // Handle tab change in recipe dialog
  const handleTabChange = (event, newValue) => {
    setSelectedTabIndex(newValue);
    
    // Filter recipes by tag based on tab
    if (newValue === 0) {
      setFilteredRecipes(recipes);
    } else {
      const mealTypeToTag = {
        1: 'Breakfast',
        2: 'Lunch',
        3: 'Dinner',
        4: 'Snack'
      };
      
      const tagToFilter = mealTypeToTag[newValue];
      
      if (tagToFilter) {
        setFilteredRecipes(
          recipes.filter(recipe => 
            recipe.tags && recipe.tags.includes(tagToFilter)
          )
        );
      }
    }
  };
  
  // Validate form before submission
  const validateForm = () => {
    const newErrors = {};
    
    if (!mealPlan.name.trim()) newErrors.name = 'Meal plan name is required';
    if (!mealPlan.startDate) newErrors.startDate = 'Start date is required';
    if (!mealPlan.endDate) newErrors.endDate = 'End date is required';
    
    if (mealPlan.startDate && mealPlan.endDate && mealPlan.startDate > mealPlan.endDate) {
      newErrors.endDate = 'End date must be after start date';
    }
    
    // Check if at least one meal is selected
    const hasMeals = mealPlan.meals.some(meal => 
      meal.breakfast || meal.lunch || meal.dinner || meal.snacks.length > 0
    );
    
    if (!hasMeals) {
      newErrors.meals = 'At least one meal must be added to the plan';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const validationErrors = {};
    if (!mealPlan.name.trim()) validationErrors.name = 'Meal plan name is required';
    if (!mealPlan.startDate) validationErrors.startDate = 'Start date is required';
    if (!mealPlan.endDate) validationErrors.endDate = 'End date is required';
    
    // Check if end date is after start date
    if (mealPlan.startDate && mealPlan.endDate) {
      const start = new Date(mealPlan.startDate);
      const end = new Date(mealPlan.endDate);
      if (end < start) {
        validationErrors.endDate = 'End date must be after start date';
      }
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      let response;
      
      if (isEditing) {
        // Update existing meal plan
        response = await axios.put(`http://localhost:8090/api/meal-plans/${id}`, mealPlan);
      } else {
        // Create new meal plan
        response = await axios.post('http://localhost:8090/api/meal-plans', mealPlan);
      }
      
      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/meal-planning/meal-plans');
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save meal plan');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="mealplanning-container">
        <Container className="loading-container">
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>Loading recipes...</Typography>
        </Container>
      </div>
    );
  }
  
  return (
    <div className="mealplanning-container">
      <Sidebar />
      <div className="meal-content-wrapper">
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/meal-planning/meal-plans')}
              sx={{ mr: 2 }}
            >
              Back to Meal Plans
            </Button>
            <Typography variant="h4" className="page-title">
              {isEditing ? 'Edit Meal Plan' : 'Create New Meal Plan'}
            </Typography>
          </Box>
          
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          {errors.meals && <Alert severity="error" sx={{ mb: 3 }}>{errors.meals}</Alert>}
          
          <Snackbar
            open={success}
            autoHideDuration={2000}
            onClose={() => setSuccess(false)}
          >
            <Alert severity="success" sx={{ width: '100%' }}>
              Meal plan created successfully!
            </Alert>
          </Snackbar>
          
          <form onSubmit={handleSubmit}>
            {/* Basic Information Section */}
            <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <MuiTextField
                    name="name"
                    label="Meal Plan Name"
                    value={mealPlan.name}
                    onChange={handleInputChange}
                    fullWidth
                    required
                    error={!!errors.name}
                    helperText={errors.name || ''}
                  />
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Start Date"
                      value={mealPlan.startDate}
                      onChange={(date) => handleDateChange('startDate', date)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          error={!!errors.startDate}
                          helperText={errors.startDate || ''}
                        />
                      )}
                    />
                  </LocalizationProvider>
                </Grid>
                
                <Grid item xs={12} md={3}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="End Date"
                      value={mealPlan.endDate}
                      onChange={(date) => handleDateChange('endDate', date)}
                      minDate={mealPlan.startDate}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          error={!!errors.endDate}
                          helperText={errors.endDate || ''}
                        />
                      )}
                    />
                  </LocalizationProvider>
                </Grid>
                
                <Grid item xs={12}>
                  <MuiTextField
                    name="notes"
                    label="Meal Plan Notes"
                    value={mealPlan.notes}
                    onChange={handleInputChange}
                    multiline
                    rows={4}
                    fullWidth
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={mealPlan.isActive}
                        onChange={handleActiveToggle}
                        color="primary"
                      />
                    }
                    label="Set as active meal plan"
                  />
                </Grid>
              </Grid>
            </Paper>
            
            {/* Meal Plan Calendar */}
            <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Meal Schedule
              </Typography>
              
              <Box sx={{ mt: 3 }}>
                {mealPlan.meals.map((dayMeal, index) => (
                  <Paper
                    key={dayMeal.day}
                    variant="outlined"
                    sx={{ 
                      p: 2, 
                      mb: 2, 
                      borderLeft: '4px solid',
                      borderColor: getColorForDay(index)
                    }}
                  >
                    <Typography variant="h6" gutterBottom color={getColorForDay(index)}>
                      {dayMeal.day}
                    </Typography>
                    
                    <Grid container spacing={2}>
                      {MEAL_TYPES.map((mealType) => (
                        <Grid item xs={12} sm={6} md={3} key={mealType}>
                          <Paper
                            variant="outlined"
                            sx={{ 
                              p: 2, 
                              height: '100%', 
                              display: 'flex',
                              flexDirection: 'column'
                            }}
                          >
                            <Typography variant="subtitle1" gutterBottom>
                              {MEAL_TYPE_LABELS[mealType]}
                            </Typography>
                            
                            {mealType === 'snacks' ? (
                              // Snacks - Multiple selection
                              <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                {dayMeal.snacks && dayMeal.snacks.length > 0 ? (
                                  <Box sx={{ mb: 2, flexGrow: 1 }}>
                                    {dayMeal.snacks.map((snackId) => {
                                      const recipe = getRecipeById(snackId);
                                      return recipe ? (
                                        <Chip
                                          key={snackId}
                                          label={recipe.name}
                                          onDelete={() => removeRecipe(dayMeal.day, 'snacks', snackId)}
                                          sx={{ m: 0.5 }}
                                        />
                                      ) : null;
                                    })}
                                  </Box>
                                ) : (
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                                    No snacks selected
                                  </Typography>
                                )}
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<AddIcon />}
                                  onClick={() => openRecipeDialog(dayMeal.day, 'snacks')}
                                  fullWidth
                                >
                                  Add Snack
                                </Button>
                              </Box>
                            ) : (
                              // Single meal selection
                              <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                {dayMeal[mealType] ? (
                                  <Box sx={{ mb: 2, flexGrow: 1 }}>
                                    <Typography variant="body1">
                                      {getRecipeById(dayMeal[mealType])?.name}
                                    </Typography>
                                    <Button
                                      variant="text"
                                      color="error"
                                      size="small"
                                      onClick={() => removeRecipe(dayMeal.day, mealType, dayMeal[mealType])}
                                    >
                                      Remove
                                    </Button>
                                  </Box>
                                ) : (
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                                    No {mealType} selected
                                  </Typography>
                                )}
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<AddIcon />}
                                  onClick={() => openRecipeDialog(dayMeal.day, mealType)}
                                  fullWidth
                                >
                                  {dayMeal[mealType] ? 'Change' : 'Add'} {MEAL_TYPE_LABELS[mealType]}
                                </Button>
                              </Box>
                            )}
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>
                ))}
              </Box>
            </Paper>
            
            {/* Submit Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button
                type="button"
                variant="outlined"
                onClick={() => navigate('/meal-planning/meal-plans')}
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
                {loading ? 'Saving...' : 'Save Meal Plan'}
              </Button>
            </Box>
          </form>
        </Container>
      </div>
      
      {/* Recipe Selection Dialog */}
      <Dialog 
        open={recipeDialogOpen} 
        onClose={closeRecipeDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedDay && selectedMealType && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6">
                Select {MEAL_TYPE_LABELS[selectedMealType]} for {selectedDay}
              </Typography>
              <IconButton onClick={closeRecipeDialog} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          )}
        </DialogTitle>
        
        <DialogContent dividers>
          <Box sx={{ display: 'flex', mb: 2 }}>
            <MuiTextField
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              fullWidth
              variant="outlined"
              size="small"
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
              }}
            />
          </Box>
          
          <Box sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={selectedTabIndex} 
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="All Recipes" />
              <Tab label="Breakfast" />
              <Tab label="Lunch" />
              <Tab label="Dinner" />
              <Tab label="Snacks" />
            </Tabs>
          </Box>
          
          <Grid container spacing={2}>
            {filteredRecipes.length > 0 ? (
              filteredRecipes.map((recipe) => (
                <Grid item xs={12} sm={6} md={4} key={recipe._id}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { boxShadow: 6 }
                    }}
                    onClick={() => selectRecipe(recipe)}
                  >
                    <CardMedia
                      component="img"
                      height="120"
                      image={recipe.image || 'https://via.placeholder.com/300x200?text=Recipe'}
                      alt={recipe.name}
                    />
                    <CardContent>
                      <Typography variant="subtitle1" noWrap>
                        {recipe.name}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          {recipe.cookingTime} mins
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {recipe.servings} servings
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography variant="body1">
                    {searchQuery 
                      ? 'No recipes found matching your search' 
                      : 'No recipes available'}
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      closeRecipeDialog();
                      navigate('/meal-planning/recipes/create');
                    }}
                    sx={{ mt: 2 }}
                  >
                    Create New Recipe
                  </Button>
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={closeRecipeDialog}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

// Helper function to get color for day
const getColorForDay = (index) => {
  const colors = ['#1976d2', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a'];
  return colors[index % colors.length];
};

export default CreateMealPlan; 