import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Container, Grid, Typography, Button, Box, Paper, Divider, Chip, 
  CircularProgress, Alert, IconButton, List, ListItem, ListItemText,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tooltip, Card, CardMedia, Link
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  AccessTime as TimeIcon,
  Restaurant as ServingsIcon,
  ShoppingCart as ShoppingCartIcon
} from '@mui/icons-material';
import Sidebar from '../Sidebar';
import '../../css/MealPlanning.css';

const RecipeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [ingredientStatus, setIngredientStatus] = useState([]);
  const [missingIngredients, setMissingIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingIngredients, setCheckingIngredients] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:8090/api/meal-plans/recipes/${id}`);
        setRecipe(response.data.recipe);
      } catch (err) {
        setError('Failed to load recipe details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecipe();
  }, [id]);

  const checkIngredientAvailability = async () => {
    try {
      setCheckingIngredients(true);
      setError(null);
      
      const response = await axios.get(`http://localhost:8090/api/meal-plans/check-ingredients/${id}`);
      
      setIngredientStatus(response.data.ingredientStatus || []);
      setMissingIngredients(response.data.shoppingListItems || []);
    } catch (err) {
      setError('Failed to check ingredient availability');
      console.error(err);
    } finally {
      setCheckingIngredients(false);
    }
  };

  const handleDeleteRecipe = async () => {
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      try {
        await axios.delete(`http://localhost:8090/api/meal-plans/recipes/${id}`);
        navigate('/meal-planning/recipes');
      } catch (err) {
        setError('Failed to delete recipe');
        console.error(err);
      }
    }
  };

  if (loading) {
    return (
      <div className="mealplanning-container">
        <Container className="loading-container">
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>Loading recipe details...</Typography>
        </Container>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="mealplanning-container">
        <Container sx={{ mt: 4 }}>
          <Alert severity="error">Recipe not found</Alert>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/meal-planning/recipes')}
            sx={{ mt: 2 }}
          >
            Back to Recipes
          </Button>
        </Container>
      </div>
    );
  }

  // Split instructions into steps for better readability
  const instructionSteps = recipe.instructions
    .split(/\r?\n|\r/)
    .filter(step => step.trim())
    .map(step => step.trim());

  return (
    <div className="mealplanning-container">
      <Sidebar />
      <div className="meal-content-wrapper">
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/meal-planning/recipes')}
            sx={{ mb: 3 }}
          >
            Back to Recipes
          </Button>
          
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          
          {/* Recipe Header */}
          <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h4" gutterBottom className="page-title">
                  {recipe.name}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TimeIcon color="primary" />
                    <Typography variant="body1" sx={{ ml: 1 }}>
                      {recipe.cookingTime} minutes
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ServingsIcon color="primary" />
                    <Typography variant="body1" sx={{ ml: 1 }}>
                      {recipe.servings} servings
                    </Typography>
                  </Box>
                </Box>
                
                <Typography variant="body1" paragraph>
                  {recipe.description || 'No description available.'}
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                  {recipe.tags && recipe.tags.map((tag, index) => (
                    <Chip key={index} label={tag} color="primary" />
                  ))}
                </Box>
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => navigate(`/meal-planning/recipes/edit/${id}`)}
                  >
                    Edit Recipe
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleDeleteRecipe}
                  >
                    Delete Recipe
                  </Button>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ position: 'relative', height: '100%', minHeight: '250px' }}>
                  <Card>
                    <CardMedia
                      component="img"
                      height="300"
                      image={recipe.image && (recipe.image.startsWith('http://') || recipe.image.startsWith('https://')) 
                        ? recipe.image 
                        : 'https://via.placeholder.com/600x400?text=Recipe+Image'}
                      alt={recipe.name}
                      sx={{ borderRadius: 1 }}
                      onError={(e) => {
                        console.log("Image failed to load:", recipe.image);
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/600x400?text=Image+Not+Found';
                      }}
                    />
                  </Card>
                </Box>
              </Grid>
            </Grid>
          </Paper>
          
          {/* Ingredients and Instructions */}
          <Grid container spacing={4}>
            {/* Ingredients Section */}
            <Grid item xs={12} md={4}>
              <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Ingredients</Typography>
                  <Button 
                    variant="outlined"
                    color="primary"
                    size="small"
                    startIcon={
                      checkingIngredients ? <CircularProgress size={20} /> : <ShoppingCartIcon />
                    }
                    onClick={checkIngredientAvailability}
                    disabled={checkingIngredients}
                  >
                    Check Availability
                  </Button>
                </Box>
                
                <Divider sx={{ mb: 2 }} />
                
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Ingredient</TableCell>
                        <TableCell align="right">Quantity</TableCell>
                        {ingredientStatus.length > 0 && (
                          <TableCell align="center">Status</TableCell>
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recipe.ingredients.map((ing, index) => (
                        <TableRow 
                          key={index}
                          sx={{ 
                            '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.03)' },
                            ...(ingredientStatus.length > 0 && {
                              backgroundColor: getIngredientStatusColor(
                                ingredientStatus.find(status => 
                                  status.ingredient.toLowerCase() === ing.ingredient.toLowerCase()
                                )?.status
                              )
                            })
                          }}
                        >
                          <TableCell component="th" scope="row">
                            {ing.ingredient}
                          </TableCell>
                          <TableCell align="right">
                            {ing.quantity.value} {ing.quantity.unit}
                          </TableCell>
                          {ingredientStatus.length > 0 && (
                            <TableCell align="center">
                              {getIngredientStatusIcon(
                                ingredientStatus.find(status => 
                                  status.ingredient.toLowerCase() === ing.ingredient.toLowerCase()
                                )?.status,
                                ingredientStatus.find(status => 
                                  status.ingredient.toLowerCase() === ing.ingredient.toLowerCase()
                                )?.reason
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                
                {/* Missing Ingredients */}
                {missingIngredients.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Missing or Insufficient Ingredients:
                    </Typography>
                    <List dense disablePadding>
                      {missingIngredients.map((item, index) => (
                        <ListItem key={index} disableGutters>
                          <ListItemText
                            primary={
                              <Typography variant="body2">
                                {item.ingredient} ({item.quantity.value} {item.quantity.unit})
                                <Chip 
                                  size="small" 
                                  label={item.reason === 'expired' ? 'Expired' : item.reason === 'missing' ? 'Missing' : 'Insufficient'} 
                                  color={item.reason === 'expired' ? 'error' : item.reason === 'missing' ? 'error' : 'warning'}
                                  sx={{ ml: 1 }}
                                />
                              </Typography>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                    <Button
                      variant="outlined"
                      color="primary"
                      size="small"
                      startIcon={<ShoppingCartIcon />}
                      sx={{ mt: 2 }}
                      onClick={() => navigate('/shopping-list')}
                      fullWidth
                    >
                      Add to Shopping List
                    </Button>
                  </Box>
                )}
              </Paper>
            </Grid>
            
            {/* Instructions Section */}
            <Grid item xs={12} md={8}>
              <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Instructions
                </Typography>
                
                <Divider sx={{ mb: 2 }} />
                
                {instructionSteps.length > 0 ? (
                  <List>
                    {instructionSteps.map((step, index) => (
                      <ListItem key={index} alignItems="flex-start" sx={{ mb: 2 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 2
                          }}
                        >
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              bgcolor: 'primary.main',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 'bold',
                              flexShrink: 0
                            }}
                          >
                            {index + 1}
                          </Box>
                          <Typography variant="body1">{step}</Typography>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body1">
                    {recipe.instructions || 'No instructions available.'}
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
          
          {/* Actions Section */}
          <Paper elevation={3} sx={{ p: 3, mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Actions
            </Typography>
            
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={() => navigate('/meal-planning/meal-plans/create')}
                >
                  Add to Meal Plan
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="primary"
                  onClick={() => window.print()}
                >
                  Print Recipe
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="primary"
                  onClick={() => navigate('/meal-planning/recipes')}
                >
                  Browse Similar Recipes
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate('/meal-planning/recipes/create')}
                >
                  Create New Recipe
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Container>
      </div>
    </div>
  );
};

// Helper functions for ingredient status
const getIngredientStatusColor = (status) => {
  switch (status) {
    case 'available':
      return 'rgba(76, 175, 80, 0.1)';
    case 'insufficient':
      return 'rgba(255, 152, 0, 0.1)';
    case 'missing':
      return 'rgba(244, 67, 54, 0.1)';
    default:
      return 'transparent';
  }
};

const getIngredientStatusIcon = (status, reason) => {
  switch (status) {
    case 'available':
      return (
        <Tooltip title="Available in inventory">
          <CheckCircleIcon color="success" fontSize="small" />
        </Tooltip>
      );
    case 'insufficient':
      return (
        <Tooltip title="Insufficient quantity">
          <WarningIcon color="warning" fontSize="small" />
        </Tooltip>
      );
    case 'missing':
      if (reason === 'expired') {
        return (
          <Tooltip title="Item in inventory but expired">
            <ErrorIcon color="error" fontSize="small" />
          </Tooltip>
        );
      }
      return (
        <Tooltip title="Missing from inventory">
          <ErrorIcon color="error" fontSize="small" />
        </Tooltip>
      );
    default:
      return null;
  }
};

export default RecipeDetails; 