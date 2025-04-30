import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  Container, Grid, Typography, Button, Box, Paper, Divider, Chip, 
  CircularProgress, Alert, Tabs, Tab, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, List, ListItem, ListItemText,
  ListItemIcon, Card, CardContent, IconButton
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
  AssignmentTurnedIn as CompleteIcon,
  ShoppingCart as ShoppingCartIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';
import format from 'date-fns/format';
import Sidebar from '../Sidebar';
import '../../css/MealPlanning.css';

const MealPlanDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get('tab') === 'report' ? 1 : 0;
  
  const [mealPlan, setMealPlan] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(initialTab);
  
  useEffect(() => {
    const fetchMealPlan = async () => {
      try {
        setLoading(true);
        
        // Fetch meal plan data
        const response = await axios.get(`http://localhost:8090/api/meal-plans/${id}`);
        setMealPlan(response.data.mealPlan);
        
        // Fetch recipes to resolve IDs
        const recipesResponse = await axios.get('http://localhost:8090/api/meal-plans/recipes');
        setRecipes(recipesResponse.data.recipes || []);
        
        // If report tab is selected, generate report
        if (initialTab === 1) {
          generateReport();
        }

        console.log("Meal plan data:", response.data.mealPlan);
        console.log("Recipes data:", recipesResponse.data.recipes);
      } catch (err) {
        setError('Failed to load meal plan details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMealPlan();
  }, [id, initialTab]);
  
  const generateReport = async () => {
    try {
      setLoadingReport(true);
      setError(null);
      
      const response = await axios.get(`http://localhost:8090/api/meal-plans/report/${id}`);
      setReport(response.data);
    } catch (err) {
      setError('Failed to generate meal plan report');
      console.error(err);
    } finally {
      setLoadingReport(false);
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    
    // Generate report if switching to report tab and no report exists
    if (newValue === 1 && !report) {
      generateReport();
    }
  };
  
  const handleDeleteMealPlan = async () => {
    if (window.confirm('Are you sure you want to delete this meal plan?')) {
      try {
        await axios.delete(`http://localhost:8090/api/meal-plans/${id}`);
        navigate('/meal-planning/meal-plans');
      } catch (err) {
        setError('Failed to delete meal plan');
        console.error(err);
      }
    }
  };
  
  const handlePrintReport = () => {
    window.print();
  };
  
  // Helper functions
  const getRecipeById = (recipeId) => {
    if (!recipeId) return null;
    
    // If recipeId is already a populated object with a name, return it directly
    if (typeof recipeId === 'object' && recipeId.name) {
      return recipeId;
    }
    
    // Otherwise, look up the recipe by its ID from our recipes array
    const id = typeof recipeId === 'object' ? recipeId._id : recipeId;
    return recipes.find(recipe => recipe._id === id) || null;
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return '#e8f5e9'; // light green
      case 'insufficient':
        return '#fff8e1'; // light amber
      case 'missing':
        return '#ffebee'; // light red
      default:
        return 'transparent';
    }
  };
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'available':
        return <CheckIcon fontSize="small" color="success" />;
      case 'insufficient':
        return <WarningIcon fontSize="small" color="warning" />;
      case 'missing':
        return <CloseIcon fontSize="small" color="error" />;
      default:
        return null;
    }
  };
  
  if (loading) {
    return (
      <div className="mealplanning-container">
        <Container className="loading-container">
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>Loading meal plan details...</Typography>
        </Container>
      </div>
    );
  }
  
  if (!mealPlan) {
    return (
      <div className="mealplanning-container">
        <Container sx={{ mt: 4 }}>
          <Alert severity="error">Meal plan not found</Alert>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/meal-planning/meal-plans')}
            sx={{ mt: 2 }}
          >
            Back to Meal Plans
          </Button>
        </Container>
      </div>
    );
  }
  
  const startDate = new Date(mealPlan.startDate);
  const endDate = new Date(mealPlan.endDate);
  const isActive = mealPlan.isActive && 
    startDate <= new Date() && 
    endDate >= new Date();
  
  return (
    <div className="mealplanning-container">
      <Sidebar />
      <div className="meal-content-wrapper">
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }} className="print-container">
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/meal-planning/meal-plans')}
            sx={{ mb: 3 }}
            className="no-print"
          >
            Back to Meal Plans
          </Button>
          
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          
          {/* Meal Plan Header */}
          <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="h4" className="page-title">
                    {mealPlan.name}
                  </Typography>
                  {isActive && (
                    <Chip
                      icon={<CheckIcon />}
                      label="Active"
                      color="success"
                      sx={{ ml: 2 }}
                    />
                  )}
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 3 }}>
                  <CalendarIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body1">
                    {format(startDate, 'MMM d, yyyy')} - {format(endDate, 'MMM d, yyyy')}
                  </Typography>
                </Box>
                
                {mealPlan.notes && (
                  <Typography variant="body1" paragraph>
                    {mealPlan.notes}
                  </Typography>
                )}
              </Grid>
              
              <Grid item xs={12} md={4} className="no-print">
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => navigate(`/meal-planning/meal-plans/edit/${id}`)}
                  >
                    Edit Plan
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleDeleteMealPlan}
                  >
                    Delete
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
          
          {/* Tabs */}
          <Paper elevation={3} sx={{ mb: 4 }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange} 
              sx={{ borderBottom: 1, borderColor: 'divider' }}
              className="no-print"
            >
              <Tab label="Meal Schedule" />
              <Tab label="Report & Shopping List" />
            </Tabs>
            
            {/* Meal Schedule Tab */}
            {activeTab === 0 && (
              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  {mealPlan.meals && mealPlan.meals.map((dayMeal, index) => {
                    // Get recipe objects from IDs
                    const breakfast = getRecipeById(dayMeal.breakfast);
                    const lunch = getRecipeById(dayMeal.lunch);
                    const dinner = getRecipeById(dayMeal.dinner);
                    // Handle snacks which might be an array of IDs or objects
                    const snacks = Array.isArray(dayMeal.snacks) 
                      ? dayMeal.snacks.map(id => getRecipeById(id)).filter(Boolean)
                      : [];
                    
                    return (
                      <Grid item xs={12} key={dayMeal.day}>
                        <Paper 
                          variant="outlined" 
                          sx={{ 
                            p: 3, 
                            borderLeft: '4px solid',
                            borderColor: getColorForDay(index)
                          }}
                        >
                          <Typography variant="h6" gutterBottom sx={{ color: getColorForDay(index) }}>
                            {dayMeal.day}
                          </Typography>
                          
                          <Grid container spacing={3}>
                            <Grid item xs={12} md={3}>
                              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                                Breakfast
                              </Typography>
                              {breakfast ? (
                                <Box 
                                  sx={{ 
                                    p: 2, 
                                    bgcolor: '#f9f9f9', 
                                    borderRadius: 1,
                                    minHeight: '80px'
                                  }}
                                >
                                  <Typography variant="body1">{breakfast.name}</Typography>
                                  <Button
                                    size="small"
                                    onClick={() => navigate(`/meal-planning/recipes/${breakfast._id}`)}
                                    sx={{ mt: 1 }}
                                  >
                                    View Recipe
                                  </Button>
                                </Box>
                              ) : (
                                <Box 
                                  sx={{ 
                                    p: 2, 
                                    bgcolor: '#f9f9f9', 
                                    borderRadius: 1,
                                    minHeight: '80px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <Typography variant="body2" color="text.secondary">
                                    No breakfast planned
                                  </Typography>
                                </Box>
                              )}
                            </Grid>
                            
                            <Grid item xs={12} md={3}>
                              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                                Lunch
                              </Typography>
                              {lunch ? (
                                <Box 
                                  sx={{ 
                                    p: 2, 
                                    bgcolor: '#f9f9f9', 
                                    borderRadius: 1,
                                    minHeight: '80px'
                                  }}
                                >
                                  <Typography variant="body1">{lunch.name}</Typography>
                                  <Button
                                    size="small"
                                    onClick={() => navigate(`/meal-planning/recipes/${lunch._id}`)}
                                    sx={{ mt: 1 }}
                                  >
                                    View Recipe
                                  </Button>
                                </Box>
                              ) : (
                                <Box 
                                  sx={{ 
                                    p: 2, 
                                    bgcolor: '#f9f9f9', 
                                    borderRadius: 1,
                                    minHeight: '80px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <Typography variant="body2" color="text.secondary">
                                    No lunch planned
                                  </Typography>
                                </Box>
                              )}
                            </Grid>
                            
                            <Grid item xs={12} md={3}>
                              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                                Dinner
                              </Typography>
                              {dinner ? (
                                <Box 
                                  sx={{ 
                                    p: 2, 
                                    bgcolor: '#f9f9f9', 
                                    borderRadius: 1,
                                    minHeight: '80px'
                                  }}
                                >
                                  <Typography variant="body1">{dinner.name}</Typography>
                                  <Button
                                    size="small"
                                    onClick={() => navigate(`/meal-planning/recipes/${dinner._id}`)}
                                    sx={{ mt: 1 }}
                                  >
                                    View Recipe
                                  </Button>
                                </Box>
                              ) : (
                                <Box 
                                  sx={{ 
                                    p: 2, 
                                    bgcolor: '#f9f9f9', 
                                    borderRadius: 1,
                                    minHeight: '80px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <Typography variant="body2" color="text.secondary">
                                    No dinner planned
                                  </Typography>
                                </Box>
                              )}
                            </Grid>
                            
                            <Grid item xs={12} md={3}>
                              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                                Snacks
                              </Typography>
                              {snacks.length > 0 ? (
                                <Box 
                                  sx={{ 
                                    p: 2, 
                                    bgcolor: '#f9f9f9', 
                                    borderRadius: 1,
                                    minHeight: '80px'
                                  }}
                                >
                                  <List dense disablePadding>
                                    {snacks.map((snack) => (
                                      <ListItem 
                                        key={snack._id} 
                                        disablePadding 
                                        sx={{ mb: 0.5 }}
                                      >
                                        <ListItemText
                                          primary={
                                            <Button
                                              size="small"
                                              variant="text"
                                              onClick={() => navigate(`/meal-planning/recipes/${snack._id}`)}
                                              sx={{ p: 0, textAlign: 'left' }}
                                            >
                                              {snack.name}
                                            </Button>
                                          }
                                        />
                                      </ListItem>
                                    ))}
                                  </List>
                                </Box>
                              ) : (
                                <Box 
                                  sx={{ 
                                    p: 2, 
                                    bgcolor: '#f9f9f9', 
                                    borderRadius: 1,
                                    minHeight: '80px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  <Typography variant="body2" color="text.secondary">
                                    No snacks planned
                                  </Typography>
                                </Box>
                              )}
                            </Grid>
                          </Grid>
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            )}
            
            {/* Report Tab */}
            {activeTab === 1 && (
              <Box sx={{ p: 3 }}>
                {loadingReport ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : report ? (
                  <Box>
                    {/* Report Header */}
                    <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h5">
                        Meal Plan Report
                      </Typography>
                      <Box className="no-print">
                        <Button
                          variant="outlined"
                          startIcon={<PrintIcon />}
                          onClick={handlePrintReport}
                          sx={{ mr: 1 }}
                        >
                          Print Report
                        </Button>
                      </Box>
                    </Box>
                    
                    {/* Summary Cards */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Card>
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              Duration
                            </Typography>
                            <Typography variant="body1">
                              {report.summary.days} days
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={3}>
                        <Card>
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              Total Recipes
                            </Typography>
                            <Typography variant="body1">
                              {report.summary.totalRecipes} recipes
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={3}>
                        <Card>
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              Missing Ingredients
                            </Typography>
                            <Typography variant="body1" color="error">
                              {report.summary.missingIngredients} ingredients
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={3}>
                        <Card>
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              Insufficient Qty
                            </Typography>
                            <Typography variant="body1" color="warning.main">
                              {report.summary.insufficientIngredients} ingredients
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                    
                    {/* Shopping List */}
                    <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">
                          Shopping List
                        </Typography>
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<ShoppingCartIcon />}
                          onClick={() => navigate('/shopping-list')}
                          className="no-print"
                        >
                          Add to Shopping List
                        </Button>
                      </Box>
                      
                      {report.shoppingListItems.length > 0 ? (
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Ingredient</TableCell>
                                <TableCell align="right">Quantity</TableCell>
                                <TableCell align="center">Status</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {report.shoppingListItems.map((item, index) => (
                                <TableRow 
                                  key={index}
                                  sx={{ 
                                    bgcolor: getStatusColor(item.reason === 'missing' ? 'missing' : 'insufficient')
                                  }}
                                >
                                  <TableCell>{item.ingredient}</TableCell>
                                  <TableCell align="right">
                                    {item.quantity.value} {item.quantity.unit}
                                  </TableCell>
                                  <TableCell align="center">
                                    {getStatusIcon(item.reason === 'missing' ? 'missing' : 'insufficient')}
                                    <Typography variant="body2" component="span" sx={{ ml: 1 }}>
                                      {item.reason === 'missing' ? 'Missing' : 'Insufficient'}
                                    </Typography>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Box sx={{ p: 2, textAlign: 'center' }}>
                          <CompleteIcon color="success" sx={{ fontSize: 48, mb: 2 }} />
                          <Typography variant="body1">
                            All ingredients are available in your inventory!
                          </Typography>
                        </Box>
                      )}
                    </Paper>
                    
                    {/* Ingredients Status */}
                    <Paper elevation={2} sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        All Ingredients Status
                      </Typography>
                      
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Ingredient</TableCell>
                              <TableCell align="right">Required</TableCell>
                              <TableCell align="right">Available</TableCell>
                              <TableCell align="center">Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {report.ingredientStatus.map((item, index) => (
                              <TableRow 
                                key={index}
                                sx={{ bgcolor: getStatusColor(item.status) }}
                              >
                                <TableCell>{item.ingredient}</TableCell>
                                <TableCell align="right">
                                  {item.required.value} {item.required.unit}
                                </TableCell>
                                <TableCell align="right">
                                  {item.status !== 'missing' 
                                    ? `${item.available.value} ${item.available.unit}`
                                    : '-'
                                  }
                                </TableCell>
                                <TableCell align="center">
                                  {getStatusIcon(item.status)}
                                  <Typography variant="body2" component="span" sx={{ ml: 1 }}>
                                    {item.status === 'available' ? 'Available' : 
                                     item.status === 'insufficient' ? 'Insufficient' : 'Missing'}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                  </Box>
                ) : (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body1" paragraph>
                      No report generated yet.
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={generateReport}
                    >
                      Generate Report
                    </Button>
                  </Box>
                )}
              </Box>
            )}
          </Paper>
        </Container>
      </div>
    </div>
  );
};

// Helper function to get color for day
const getColorForDay = (index) => {
  const colors = ['#1976d2', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a'];
  return colors[index % colors.length];
};

export default MealPlanDetails; 