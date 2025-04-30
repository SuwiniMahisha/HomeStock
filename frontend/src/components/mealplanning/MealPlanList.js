import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Container, Grid, Typography, Button, Box, Paper, Divider, Chip, 
  CircularProgress, Alert, Card, CardContent, IconButton, 
  List, ListItem, ListItemText, Tab, Tabs
} from '@mui/material';
import { 
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Assessment as ReportIcon,
  CheckCircle as ActiveIcon,
  Event as CalendarIcon
} from '@mui/icons-material';
import format from 'date-fns/format';
import Sidebar from '../Sidebar';
import '../../css/MealPlanning.css';

const MealPlanList = () => {
  const navigate = useNavigate();
  const [mealPlans, setMealPlans] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch meal plans
        const mealPlansResponse = await axios.get('http://localhost:8090/api/meal-plans');
        setMealPlans(mealPlansResponse.data.mealPlans || []);
        
        // Fetch recipes to resolve IDs in meal plans
        const recipesResponse = await axios.get('http://localhost:8090/api/meal-plans/recipes');
        setRecipes(recipesResponse.data.recipes || []);
      } catch (err) {
        setError('Failed to load meal plans');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Helper function to get recipe name by ID
  const getRecipeName = (recipeId) => {
    const recipe = recipes.find(r => r._id === recipeId);
    return recipe ? recipe.name : 'Unknown Recipe';
  };
  
  // Delete meal plan
  const handleDeleteMealPlan = async (id) => {
    if (window.confirm('Are you sure you want to delete this meal plan?')) {
      try {
        await axios.delete(`http://localhost:8090/api/meal-plans/${id}`);
        setMealPlans(mealPlans.filter(plan => plan._id !== id));
      } catch (err) {
        setError('Failed to delete meal plan');
        console.error(err);
      }
    }
  };
  
  // Generate meal plan report
  const handleGenerateReport = async (id) => {
    try {
      setLoadingReport(true);
      
      // Navigate to meal plan details with report tab selected
      navigate(`/meal-planning/meal-plans/${id}?tab=report`);
    } catch (err) {
      setError('Failed to generate report');
      console.error(err);
    } finally {
      setLoadingReport(false);
    }
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };
  
  // Filter meal plans based on selected tab
  const getFilteredMealPlans = () => {
    const currentDate = new Date();
    
    switch (selectedTab) {
      case 0: // All
        return mealPlans;
      case 1: // Active
        return mealPlans.filter(plan => 
          plan.isActive && 
          new Date(plan.startDate) <= currentDate && 
          new Date(plan.endDate) >= currentDate
        );
      case 2: // Upcoming
        return mealPlans.filter(plan => new Date(plan.startDate) > currentDate);
      case 3: // Past
        return mealPlans.filter(plan => new Date(plan.endDate) < currentDate);
      default:
        return mealPlans;
    }
  };
  
  const filteredMealPlans = getFilteredMealPlans();
  
  if (loading) {
    return (
      <div className="mealplanning-container">
        <Sidebar />
        <Container className="loading-container">
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>Loading meal plans...</Typography>
        </Container>
      </div>
    );
  }
  
  return (
    <div className="mealplanning-container">
      <Sidebar />
      <div className="meal-content-wrapper">
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" className="page-title">
              Meal Plans
            </Typography>
            
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => navigate('/meal-planning/meal-plans/create')}
            >
              Create Meal Plan
            </Button>
          </Box>
          
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          
          {/* Tabs for filtering */}
          <Tabs 
            value={selectedTab} 
            onChange={handleTabChange} 
            sx={{ mb: 3 }}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="All Plans" />
            <Tab label="Active" />
            <Tab label="Upcoming" />
            <Tab label="Past" />
          </Tabs>
          
          {filteredMealPlans.length > 0 ? (
            <Grid container spacing={3}>
              {filteredMealPlans.map((plan) => {
                const startDate = new Date(plan.startDate);
                const endDate = new Date(plan.endDate);
                const isActive = plan.isActive && 
                  startDate <= new Date() && 
                  endDate >= new Date();
                
                return (
                  <Grid item xs={12} md={6} key={plan._id}>
                    <Card 
                      className="meal-plan-card"
                      sx={{ 
                        position: 'relative',
                        borderLeft: isActive ? '4px solid #4caf50' : undefined
                      }}
                    >
                      {isActive && (
                        <Chip
                          icon={<ActiveIcon />}
                          label="Active"
                          color="success"
                          size="small"
                          sx={{ 
                            position: 'absolute', 
                            top: 16, 
                            right: 16,
                            zIndex: 1
                          }}
                        />
                      )}
                      
                      <CardContent>
                        <Typography variant="h5" gutterBottom>
                          {plan.name}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <CalendarIcon color="primary" sx={{ mr: 1 }} />
                          <Typography variant="body2" color="textSecondary">
                            {format(startDate, 'MMM d, yyyy')} to {format(endDate, 'MMM d, yyyy')}
                          </Typography>
                        </Box>
                        
                        {plan.notes && (
                          <Typography variant="body2" paragraph>
                            {plan.notes}
                          </Typography>
                        )}
                        
                        <Divider sx={{ my: 2 }} />
                        
                        {/* Sample of meals */}
                        <Typography variant="subtitle1" gutterBottom>
                          Sample Meals:
                        </Typography>
                        
                        <List dense>
                          {plan.meals.slice(0, 2).map((meal) => (
                            <ListItem key={meal.day} disableGutters>
                              <ListItemText
                                primary={meal.day}
                                secondary={
                                  <React.Fragment>
                                    {meal.breakfast && (
                                      <Typography variant="body2" component="span">
                                        Breakfast: {getRecipeName(meal.breakfast)}
                                      </Typography>
                                    )}
                                    {meal.lunch && (
                                      <Typography variant="body2" component="span" sx={{ display: 'block' }}>
                                        Lunch: {getRecipeName(meal.lunch)}
                                      </Typography>
                                    )}
                                    {meal.dinner && (
                                      <Typography variant="body2" component="span" sx={{ display: 'block' }}>
                                        Dinner: {getRecipeName(meal.dinner)}
                                      </Typography>
                                    )}
                                  </React.Fragment>
                                }
                              />
                            </ListItem>
                          ))}
                          {plan.meals.length > 2 && (
                            <ListItem disableGutters>
                              <ListItemText
                                primary={
                                  <Typography variant="body2" color="primary">
                                    + {plan.meals.length - 2} more days...
                                  </Typography>
                                }
                              />
                            </ListItem>
                          )}
                        </List>
                        
                        <Divider sx={{ my: 2 }} />
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Button
                            variant="outlined"
                            startIcon={<ViewIcon />}
                            onClick={() => navigate(`/meal-planning/meal-plans/${plan._id}`)}
                          >
                            View Details
                          </Button>
                          
                          <Box>
                            <IconButton
                              color="primary"
                              onClick={() => handleGenerateReport(plan._id)}
                              disabled={loadingReport}
                            >
                              <ReportIcon />
                            </IconButton>
                            <IconButton
                              color="primary"
                              onClick={() => navigate(`/meal-planning/meal-plans/edit/${plan._id}`)}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              color="error"
                              onClick={() => handleDeleteMealPlan(plan._id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                No meal plans found
              </Typography>
              <Typography variant="body1" paragraph>
                {mealPlans.length > 0 
                  ? 'Try selecting a different filter tab'
                  : 'Start by creating your first meal plan'}
              </Typography>
              <Button 
                variant="contained" 
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => navigate('/meal-planning/meal-plans/create')}
              >
                Create Meal Plan
              </Button>
            </Paper>
          )}
        </Container>
      </div>
    </div>
  );
};

export default MealPlanList; 