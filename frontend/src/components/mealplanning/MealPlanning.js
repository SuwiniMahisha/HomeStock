import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Container, Grid, Card, CardContent, CardMedia, 
  Typography, Button, Box, Paper, Divider, Chip, 
  CircularProgress, Alert
} from '@mui/material';
import { 
  RestaurantMenu, Assignment, ShoppingCart, 
  Bookmark, AddCircle, ListAlt, MenuBook
} from '@mui/icons-material';
import Sidebar from '../Sidebar';
import '../../css/MealPlanning.css';

const MealPlanning = () => {
  const navigate = useNavigate();
  const [activeRecipes, setActiveRecipes] = useState([]);
  const [activeMealPlan, setActiveMealPlan] = useState(null);
  const [missingIngredients, setMissingIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch recipes (just a few for quick display)
        const recipesResponse = await axios.get('http://localhost:8090/api/meal-plans/recipes');
        setActiveRecipes(recipesResponse.data.recipes.slice(0, 4)); // Just get first 4 for display
        
        // Fetch active meal plan
        try {
          const mealPlanResponse = await axios.get('http://localhost:8090/api/meal-plans/active');
          setActiveMealPlan(mealPlanResponse.data.activeMealPlan);
          
          // If we have an active meal plan, get the missing ingredients report
          if (mealPlanResponse.data.activeMealPlan) {
            const reportResponse = await axios.get(
              `http://localhost:8090/api/meal-plans/report/${mealPlanResponse.data.activeMealPlan._id}`
            );
            setMissingIngredients(reportResponse.data.shoppingListItems || []);
          }
        } catch (mealPlanError) {
          // It's ok if there's no active meal plan
          console.log('No active meal plan found');
        }
        
      } catch (err) {
        setError('Failed to load meal planning data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const navigateTo = (path) => {
    navigate(path);
  };

  // Sections for the dashboard
  const sections = [
    { 
      id: 'recipes', 
      title: 'Recipes', 
      description: 'Browse, create and manage your recipes',
      icon: <MenuBook fontSize="large" />,
      color: '#4caf50',
      actions: [
        { label: 'Browse Recipes', onClick: () => navigateTo('/meal-planning/recipes') },
        { label: 'Create New Recipe', onClick: () => navigateTo('/meal-planning/recipes/create') }
      ]
    },
    { 
      id: 'meal-plans', 
      title: 'Meal Plans', 
      description: 'Create and manage weekly meal plans',
      icon: <Assignment fontSize="large" />,
      color: '#2196f3',
      actions: [
        { label: 'View Meal Plans', onClick: () => navigateTo('/meal-planning/meal-plans') },
        { label: 'Create New Plan', onClick: () => navigateTo('/meal-planning/meal-plans/create') }
      ]
    },
    { 
      id: 'ingredients', 
      title: 'Ingredients', 
      description: 'Check ingredients availability in your inventory',
      icon: <RestaurantMenu fontSize="large" />,
      color: '#ff9800',
      actions: [
        { label: 'Check Ingredients', onClick: () => navigate('/inventory') }
      ]
    },
    { 
      id: 'shopping', 
      title: 'Shopping List', 
      description: 'See missing ingredients for your meal plans',
      icon: <ShoppingCart fontSize="large" />,
      color: '#f44336',
      actions: [
        { label: 'View Missing Items', onClick: () => navigate('/shopping-list') }
      ]
    }
  ];

  if (loading) {
    return (
      <div className="mealplanning-container">
        <Container className="loading-container">
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>Loading meal planning data...</Typography>
        </Container>
      </div>
    );
  }

  return (
    <div className="mealplanning-container">
      <Sidebar />
      <div className="meal-content-wrapper">
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h4" gutterBottom className="page-title">
            Meal Planning
          </Typography>
          
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          
          {/* Quick Actions */}
          <Paper elevation={3} sx={{ p: 3, mb: 4 }} className="quick-actions">
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  startIcon={<AddCircle />}
                  fullWidth
                  onClick={() => navigateTo('/meal-planning/recipes/create')}
                >
                  Add New Recipe
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button 
                  variant="contained" 
                  color="secondary" 
                  startIcon={<Assignment />}
                  fullWidth
                  onClick={() => navigateTo('/meal-planning/meal-plans/create')}
                >
                  Create Meal Plan
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button 
                  variant="contained" 
                  style={{ backgroundColor: '#4caf50', color: 'white' }}
                  startIcon={<ListAlt />}
                  fullWidth
                  onClick={() => navigateTo('/meal-planning/meal-plans')}
                >
                  View Meal Plans
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button 
                  variant="contained" 
                  style={{ backgroundColor: '#ff9800', color: 'white' }}
                  startIcon={<RestaurantMenu />}
                  fullWidth
                  onClick={() => navigateTo('/meal-planning/recipes')}
                >
                  Browse Recipes
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Active Meal Plan Section */}
          <Paper elevation={3} sx={{ p: 3, mb: 4 }} className="active-plan">
            <Typography variant="h6" gutterBottom>
              Active Meal Plan
            </Typography>
            {activeMealPlan ? (
              <Box>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={8}>
                    <Typography variant="h5">{activeMealPlan.name}</Typography>
                    <Typography variant="subtitle1" gutterBottom>
                      {new Date(activeMealPlan.startDate).toLocaleDateString()} to {new Date(activeMealPlan.endDate).toLocaleDateString()}
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {activeMealPlan.notes || 'No additional notes for this meal plan.'}
                    </Typography>
                    <Button 
                      variant="outlined" 
                      color="primary"
                      onClick={() => navigateTo(`/meal-planning/meal-plans/${activeMealPlan._id}`)}
                    >
                      View Details
                    </Button>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Paper elevation={1} sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Missing Ingredients:
                      </Typography>
                      {missingIngredients.length > 0 ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {missingIngredients.slice(0, 5).map((item, index) => (
                            <Chip 
                              key={index}
                              label={`${item.ingredient} (${item.quantity.value} ${item.quantity.unit})`}
                              color="error"
                              size="small"
                            />
                          ))}
                          {missingIngredients.length > 5 && (
                            <Chip 
                              label={`+${missingIngredients.length - 5} more`}
                              variant="outlined"
                              size="small"
                              onClick={() => navigate('/shopping-list')}
                            />
                          )}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          All ingredients available!
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="body1" gutterBottom>
                  No active meal plan found.
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => navigateTo('/meal-planning/meal-plans/create')}
                >
                  Create One Now
                </Button>
              </Box>
            )}
          </Paper>

          {/* Recent Recipes */}
          <Paper elevation={3} sx={{ p: 3, mb: 4 }} className="recent-recipes">
            <Typography variant="h6" gutterBottom>
              Recent Recipes
            </Typography>
            <Grid container spacing={3}>
              {activeRecipes.length > 0 ? (
                activeRecipes.map((recipe) => (
                  <Grid item xs={12} sm={6} md={3} key={recipe._id}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardMedia
                        component="img"
                        height="140"
                        image={recipe.image || 'https://via.placeholder.com/300x200?text=Recipe'}
                        alt={recipe.name}
                      />
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography gutterBottom variant="h6" component="div">
                          {recipe.name}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            {recipe.cookingTime} mins
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {recipe.servings} servings
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                          {recipe.tags && recipe.tags.slice(0, 2).map((tag, index) => (
                            <Chip key={index} label={tag} size="small" />
                          ))}
                        </Box>
                        <Button 
                          size="small" 
                          color="primary" 
                          onClick={() => navigateTo(`/meal-planning/recipes/${recipe._id}`)}
                        >
                          View Recipe
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <Typography variant="body1" gutterBottom>
                      No recipes found.
                    </Typography>
                    <Button 
                      variant="contained" 
                      color="primary"
                      onClick={() => navigateTo('/meal-planning/recipes/create')}
                    >
                      Create Your First Recipe
                    </Button>
                  </Box>
                </Grid>
              )}
            </Grid>
            {activeRecipes.length > 0 && (
              <Box sx={{ mt: 2, textAlign: 'right' }}>
                <Button 
                  color="primary" 
                  onClick={() => navigateTo('/meal-planning/recipes')}
                >
                  View All Recipes
                </Button>
              </Box>
            )}
          </Paper>

          {/* Feature Sections */}
          <Grid container spacing={4} sx={{ mb: 4 }}>
            {sections.map((section) => (
              <Grid item xs={12} sm={6} md={3} key={section.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box 
                    sx={{ 
                      bgcolor: section.color, 
                      color: 'white', 
                      p: 2, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center'
                    }}
                  >
                    {section.icon}
                  </Box>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h5" component="h2">
                      {section.title}
                    </Typography>
                    <Typography>
                      {section.description}
                    </Typography>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {section.actions.map((action, index) => (
                        <Button 
                          key={index} 
                          variant={index === 0 ? "contained" : "outlined"} 
                          size="small"
                          onClick={action.onClick}
                          sx={index === 0 ? { bgcolor: section.color } : {}}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </div>
    </div>
  );
};

export default MealPlanning; 