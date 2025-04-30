import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Container, Grid, Card, CardContent, CardMedia, 
  Typography, Button, Box, Paper, Divider, Chip, 
  TextField, InputAdornment, CircularProgress, Alert,
  IconButton, Menu, MenuItem, FormControl, InputLabel,
  Select, Tooltip
} from '@mui/material';
import { 
  Search as SearchIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  AccessTime as TimeIcon,
  Restaurant as ServingsIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import Sidebar from '../Sidebar';
import '../../css/MealPlanning.css';

const RecipeList = () => {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [sortAnchorEl, setSortAnchorEl] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortOption, setSortOption] = useState('name');
  
  // Constants for filtering and sorting
  const availableTags = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Low-Carb', 'High-Protein'];
  
  useEffect(() => {
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
    
    fetchRecipes();
  }, []);
  
  // Filter and sort recipes whenever the filters or search changes
  useEffect(() => {
    filterAndSortRecipes();
  }, [searchQuery, selectedTags, sortOption, recipes]);
  
  // Handle opening the filter menu
  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };
  
  // Handle closing the filter menu
  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };
  
  // Handle opening the sort menu
  const handleSortClick = (event) => {
    setSortAnchorEl(event.currentTarget);
  };
  
  // Handle closing the sort menu
  const handleSortClose = () => {
    setSortAnchorEl(null);
  };
  
  // Toggle tag selection for filtering
  const toggleTagFilter = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };
  
  // Clear all filters
  const clearFilters = () => {
    setSelectedTags([]);
    setSearchQuery('');
    handleFilterClose();
  };
  
  // Change sort option
  const changeSortOption = (option) => {
    setSortOption(option);
    handleSortClose();
  };
  
  // Apply filtering and sorting
  const filterAndSortRecipes = () => {
    let result = [...recipes];
    
    // Apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(recipe => 
        recipe.name.toLowerCase().includes(query) || 
        (recipe.description && recipe.description.toLowerCase().includes(query))
      );
    }
    
    // Apply tag filters
    if (selectedTags.length > 0) {
      result = result.filter(recipe => 
        recipe.tags && selectedTags.every(tag => recipe.tags.includes(tag))
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      switch (sortOption) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'time_asc':
          return a.cookingTime - b.cookingTime;
        case 'time_desc':
          return b.cookingTime - a.cookingTime;
        case 'servings_asc':
          return a.servings - b.servings;
        case 'servings_desc':
          return b.servings - a.servings;
        default:
          return 0;
      }
    });
    
    setFilteredRecipes(result);
  };
  
  // Delete a recipe
  const handleDeleteRecipe = async (id) => {
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      try {
        await axios.delete(`http://localhost:8090/api/meal-plans/recipes/${id}`);
        setRecipes(recipes.filter(recipe => recipe._id !== id));
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
          <Typography variant="h4" gutterBottom className="page-title">
            Recipes
          </Typography>
          
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          
          {/* Search and Filter Bar */}
          <Paper elevation={3} sx={{ p: 2, mb: 4 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Search recipes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={6} md={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  onClick={handleFilterClick}
                  color={selectedTags.length > 0 ? "primary" : "inherit"}
                >
                  Filter
                  {selectedTags.length > 0 && (
                    <Chip 
                      size="small" 
                      label={selectedTags.length} 
                      color="primary"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Button>
                <Menu
                  anchorEl={filterAnchorEl}
                  open={Boolean(filterAnchorEl)}
                  onClose={handleFilterClose}
                >
                  <Box sx={{ px: 2, py: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Filter by Tags
                    </Typography>
                  </Box>
                  <Divider />
                  {availableTags.map((tag) => (
                    <MenuItem 
                      key={tag} 
                      onClick={() => toggleTagFilter(tag)}
                      sx={{ 
                        backgroundColor: selectedTags.includes(tag) ? 'rgba(25, 118, 210, 0.08)' : 'transparent'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Typography>{tag}</Typography>
                        {selectedTags.includes(tag) && (
                          <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-end' }}>
                            <Chip 
                              size="small" 
                              label="Selected" 
                              color="primary" 
                              variant="outlined"
                            />
                          </Box>
                        )}
                      </Box>
                    </MenuItem>
                  ))}
                  <Divider />
                  <MenuItem onClick={clearFilters}>
                    <Typography color="error">Clear Filters</Typography>
                  </MenuItem>
                </Menu>
              </Grid>
              
              <Grid item xs={6} md={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<SortIcon />}
                  onClick={handleSortClick}
                >
                  Sort
                </Button>
                <Menu
                  anchorEl={sortAnchorEl}
                  open={Boolean(sortAnchorEl)}
                  onClose={handleSortClose}
                >
                  <MenuItem 
                    selected={sortOption === 'name'} 
                    onClick={() => changeSortOption('name')}
                  >
                    Name (A-Z)
                  </MenuItem>
                  <MenuItem 
                    selected={sortOption === 'name_desc'} 
                    onClick={() => changeSortOption('name_desc')}
                  >
                    Name (Z-A)
                  </MenuItem>
                  <MenuItem 
                    selected={sortOption === 'time_asc'} 
                    onClick={() => changeSortOption('time_asc')}
                  >
                    Cooking Time (Low to High)
                  </MenuItem>
                  <MenuItem 
                    selected={sortOption === 'time_desc'} 
                    onClick={() => changeSortOption('time_desc')}
                  >
                    Cooking Time (High to Low)
                  </MenuItem>
                  <MenuItem 
                    selected={sortOption === 'servings_asc'} 
                    onClick={() => changeSortOption('servings_asc')}
                  >
                    Servings (Low to High)
                  </MenuItem>
                  <MenuItem 
                    selected={sortOption === 'servings_desc'} 
                    onClick={() => changeSortOption('servings_desc')}
                  >
                    Servings (High to Low)
                  </MenuItem>
                </Menu>
              </Grid>
              
              <Grid item xs={12} md={2}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/meal-planning/recipes/create')}
                >
                  New Recipe
                </Button>
              </Grid>
            </Grid>
            
            {/* Active Filter Chips */}
            {selectedTags.length > 0 && (
              <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {selectedTags.map((tag) => (
                  <Chip 
                    key={tag}
                    label={tag}
                    onDelete={() => toggleTagFilter(tag)}
                    color="primary"
                    size="small"
                  />
                ))}
                <Chip 
                  label="Clear All"
                  onClick={clearFilters}
                  size="small"
                  variant="outlined"
                />
              </Box>
            )}
          </Paper>
          
          {/* Recipes Grid */}
          <Grid container spacing={3}>
            {filteredRecipes.length > 0 ? (
              filteredRecipes.map((recipe) => (
                <Grid item xs={12} sm={6} md={4} key={recipe._id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardMedia
                      component="img"
                      height="180"
                      image={recipe.image || 'https://via.placeholder.com/300x200?text=Recipe'}
                      alt={recipe.name}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography gutterBottom variant="h5" component="div">
                        {recipe.name}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <TimeIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                            {recipe.cookingTime} mins
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <ServingsIcon fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                            {recipe.servings} servings
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, height: 60, overflow: 'hidden' }}>
                        {recipe.description || 'No description available'}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                        {recipe.tags && recipe.tags.slice(0, 3).map((tag, index) => (
                          <Chip key={index} label={tag} size="small" />
                        ))}
                        {recipe.tags && recipe.tags.length > 3 && (
                          <Chip 
                            label={`+${recipe.tags.length - 3} more`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                      <Divider sx={{ mb: 2 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Button 
                          size="small" 
                          variant="contained"
                          color="primary" 
                          onClick={() => navigate(`/meal-planning/recipes/${recipe._id}`)}
                        >
                          View Details
                        </Button>
                        <Box>
                          <Tooltip title="Edit Recipe">
                            <IconButton 
                              size="small" 
                              color="primary" 
                              onClick={() => navigate(`/meal-planning/recipes/edit/${recipe._id}`)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Recipe">
                            <IconButton 
                              size="small" 
                              color="error" 
                              onClick={() => handleDeleteRecipe(recipe._id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="h6" gutterBottom>
                    No recipes found
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {recipes.length > 0 
                      ? 'Try adjusting your search or filters'
                      : 'Start by creating your first recipe'}
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/meal-planning/recipes/create')}
                  >
                    Create Recipe
                  </Button>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Container>
      </div>
    </div>
  );
};

export default RecipeList; 