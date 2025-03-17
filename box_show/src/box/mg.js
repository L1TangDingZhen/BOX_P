import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Checkbox,
    FormControlLabel,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    IconButton,
    Alert,
    Snackbar,
    CircularProgress
} from '@mui/material';
import {
    Settings as SettingsIcon,
    Add as AddIcon,
    PlayArrow as RunIcon,
    Clear as ClearIcon
} from '@mui/icons-material';
import { API_BASE_URL } from '../config/api';


const ItemManagementPage = () => {
    // Get current logged in user
    const [currentUser, setCurrentUser] = useState(null);

    // State for new item
    const [newItem, setNewItem] = useState({
        width: '',
        height: '',
        depth: '',
        faceUp: false,
        fragile: false,
        name: '' // Added name field
    });

    // State for list of items
    const [items, setItems] = useState([]);
    
    // State for container settings
    const [containerSettings, setContainerSettings] = useState({
        width: 10,
        height: 10,
        depth: 10
    });
    
    // State for settings dialog
    const [settingsOpen, setSettingsOpen] = useState(false);
    
    // State for AI assignment dialog
    const [aiDialogOpen, setAiDialogOpen] = useState(false);
    const [workerName, setWorkerName] = useState('');
    const [workerId, setWorkerId] = useState('');
    
    // State for AI processing
    const [aiProcessing, setAiProcessing] = useState(false);
    const [aiComplete, setAiComplete] = useState(false);
    const [apiResponse, setApiResponse] = useState(null);
    
    // State for snackbar notifications
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'info'
    });

    // Load user information
    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setCurrentUser(user);
            } catch (e) {
                console.error('Error parsing user data from localStorage', e);
            }
        }
    }, []);

    // Generate item ID
    const generateItemId = () => {
        const nextNumber = items.length + 1;
        return `item${nextNumber.toString().padStart(4, '0')}`;
    };

    // Handle input change for new item
    const handleInputChange = (e) => {
        const { name, value, checked, type } = e.target;
        setNewItem(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Add new item to list
    const handleAddItem = () => {
        // Validate input
        if (!newItem.width || !newItem.height || !newItem.depth || !newItem.name) {
            setSnackbar({
                open: true,
                message: 'Please enter all required fields (name and dimensions)',
                severity: 'error'
            });
            return;
        }
        
        // Validate dimensions against container
        if (parseFloat(newItem.width) > containerSettings.width || 
            parseFloat(newItem.height) > containerSettings.height || 
            parseFloat(newItem.depth) > containerSettings.depth) {
            setSnackbar({
                open: true,
                message: 'Item dimensions exceed container size',
                severity: 'error'
            });
            return;
        }

        // Create new item with generated ID
        const itemWithId = {
            id: generateItemId(),
            name: newItem.name,
            width: parseFloat(newItem.width),
            height: parseFloat(newItem.height),
            depth: parseFloat(newItem.depth),
            faceUp: newItem.faceUp,
            fragile: newItem.fragile
        };

        // Add to items list
        setItems(prev => [...prev, itemWithId]);
        
        // Reset the form
        setNewItem({
            name: '',
            width: '',
            height: '',
            depth: '',
            faceUp: false,
            fragile: false
        });
        
        setSnackbar({
            open: true,
            message: 'Item added successfully',
            severity: 'success'
        });
    };

    // Delete item from list
    const handleDeleteItem = (itemId) => {
        setItems(prev => prev.filter(item => item.id !== itemId));
        
        setSnackbar({
            open: true,
            message: 'Item removed',
            severity: 'info'
        });
    };

    // Handle container settings change
    const handleSettingsChange = (e) => {
        const { name, value } = e.target;
        setContainerSettings(prev => ({
            ...prev,
            [name]: parseFloat(value) || 10 // Default to 10 if invalid
        }));
    };

    // Apply system settings
    const handleApplySettings = () => {
        // Validate if any existing items would be too large for new container
        const itemsExceedingContainer = items.filter(item => 
            item.width > containerSettings.width || 
            item.height > containerSettings.height || 
            item.depth > containerSettings.depth
        );
        
        if (itemsExceedingContainer.length > 0) {
            setSnackbar({
                open: true,
                message: `${itemsExceedingContainer.length} items exceed the new container size. Please remove these items first.`,
                severity: 'error'
            });
            return;
        }
        
        setSettingsOpen(false);
        setSnackbar({
            open: true,
            message: 'Container settings updated',
            severity: 'success'
        });
    };

    // Open AI dialog
    const handleRunAI = () => {
        setAiDialogOpen(true);
    };

    // Format frontend data for API
    const formatDataForApi = (workerId) => {
        // If user is not logged in, show error
        if (!currentUser || !currentUser.id) {
            throw new Error('User not logged in. Please log in first.');
        }

        // Format items data
        const formattedItems = items.map(item => ({
            name: item.name,
            dimensions: {
                x: item.width,
                y: item.height,
                z: item.depth
            },
            face_up: item.faceUp,
            fragile: item.fragile
        }));

        // Build request body
        return {
            creator_id: currentUser.id,
            worker_id: parseInt(workerId, 10) || null,
            space_info: {
                x: containerSettings.width,
                y: containerSettings.height,
                z: containerSettings.depth
            },
            items: formattedItems
        };
    };

    // Process AI assignment
    const handleAiAssign = async () => {
        if (!workerId.trim()) {
            setSnackbar({
                open: true,
                message: 'Please enter a worker ID',
                severity: 'error'
            });
            return;
        }
        
        setAiProcessing(true);
        
        try {
            // Format data
            const requestData = formatDataForApi(workerId);
            
            // Send to API
            const response = await fetch('3.104.77.160/api/tasks/create/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Processing failed');
            }
            
            // Save API response
            setApiResponse(data);
            setAiComplete(true);
            
            setSnackbar({
                open: true,
                message: `Task created and assigned to worker ID: ${workerId}`,
                severity: 'success'
            });
            
            // Clear items list to indicate completion
            setTimeout(() => {
                setItems([]);
            }, 2000);
            
        } catch (error) {
            console.error('API Error:', error);
            setSnackbar({
                open: true,
                message: `Processing failed: ${error.message}`,
                severity: 'error'
            });
            setAiProcessing(false);
        }
    };

    // Cancel AI assignment
    const handleCancelAi = () => {
        setAiDialogOpen(false);
        setWorkerName('');
        setWorkerId('');
        setAiComplete(false);
        setAiProcessing(false);
        setApiResponse(null);
    };

    // Handle close snackbar
    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({
            ...prev,
            open: false
        }));
    };

    // Actions after closing success dialog
    const handleCloseSuccessDialog = () => {
        setAiDialogOpen(false);
        setWorkerName('');
        setWorkerId('');
        setAiComplete(false);
        setAiProcessing(false);
        setApiResponse(null);
    };

    return (
        <Box sx={{ p: 2, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
            {/* Top user info */}
            {currentUser && (
                <Paper 
                    elevation={2} 
                    sx={{ 
                        p: 1.5, 
                        mb: 2, 
                        bgcolor: '#fff',
                        borderRadius: 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}
                >
                    <Typography variant="subtitle1">
                        Current User: {currentUser.name} (ID: {currentUser.id})
                    </Typography>
                    {currentUser.is_manager && (
                        <Typography variant="subtitle1" color="primary">
                            Manager
                        </Typography>
                    )}
                </Paper>
            )}

            {/* Row 1: Item List */}
            <Paper 
                elevation={3} 
                sx={{ 
                    p: 2, 
                    mb: 3, 
                    minHeight: 280,
                    maxHeight: 300,
                    bgcolor: '#fff',
                    borderRadius: 1,
                    overflow: 'hidden'
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">List of Already Added Items</Typography>
                </Box>
                
                {items.length === 0 ? (
                    <Box sx={{ 
                        height: 200, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: 'text.secondary',
                        border: '1px dashed #ccc',
                        borderRadius: 1
                    }}>
                        <Typography variant="body1">
                            No items added yet. Add items using the form below.
                        </Typography>
                    </Box>
                ) : (
                    <TableContainer sx={{ maxHeight: 200, overflow: 'auto' }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Item ID</TableCell>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Dimensions (W×H×D)</TableCell>
                                    <TableCell>Constraints</TableCell>
                                    <TableCell align="center">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {items.map((item) => (
                                    <TableRow key={item.id} hover>
                                        <TableCell>{item.id}</TableCell>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell>{`${item.width} × ${item.height} × ${item.depth}`}</TableCell>
                                        <TableCell>
                                            {item.faceUp && item.fragile ? 'Face Up, Fragile' : 
                                            item.faceUp ? 'Face Up' : 
                                            item.fragile ? 'Fragile' : 'None'}
                                        </TableCell>
                                        <TableCell align="center">
                                            <IconButton 
                                                size="small" 
                                                color="error"
                                                onClick={() => handleDeleteItem(item.id)}
                                            >
                                                <ClearIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            {/* Row 2: Add Item Button and Input Window */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                {/* Add Item Button */}
                <Grid item xs={12} sm={4}>
                    <Paper 
                        elevation={3} 
                        sx={{ 
                            p: 2,
                            height: 180,  // Increased height for name field
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            bgcolor: '#fff',
                            borderRadius: 1
                        }}
                    >
                        <Typography variant="h6" align="center" gutterBottom>
                            Add Item Button
                        </Typography>
                        
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={handleAddItem}
                            size="large"
                            sx={{ mt: 2, minWidth: 150 }}
                            disabled={!newItem.width || !newItem.height || !newItem.depth || !newItem.name}
                        >
                            Add Item
                        </Button>
                    </Paper>
                </Grid>
                
                {/* Input Window */}
                <Grid item xs={12} sm={8}>
                    <Paper 
                        elevation={3} 
                        sx={{ 
                            p: 2,
                            height: 180,  // Increased height for name field
                            bgcolor: '#fff',
                            borderRadius: 1
                        }}
                    >
                        <Typography variant="h6" gutterBottom>
                            Input Window - Item Information
                        </Typography>
                        
                        <Grid container spacing={2} sx={{ mb: 1 }}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Name"
                                    name="name"
                                    value={newItem.name}
                                    onChange={handleInputChange}
                                    size="small"
                                    placeholder="Enter item name"
                                />
                            </Grid>
                            <Grid item xs={4}>
                                <TextField
                                    fullWidth
                                    label="Width"
                                    name="width"
                                    type="number"
                                    value={newItem.width}
                                    onChange={handleInputChange}
                                    size="small"
                                    inputProps={{ min: 0, step: 0.1 }}
                                />
                            </Grid>
                            <Grid item xs={4}>
                                <TextField
                                    fullWidth
                                    label="Height"
                                    name="height"
                                    type="number"
                                    value={newItem.height}
                                    onChange={handleInputChange}
                                    size="small"
                                    inputProps={{ min: 0, step: 0.1 }}
                                />
                            </Grid>
                            <Grid item xs={4}>
                                <TextField
                                    fullWidth
                                    label="Depth"
                                    name="depth"
                                    type="number"
                                    value={newItem.depth}
                                    onChange={handleInputChange}
                                    size="small"
                                    inputProps={{ min: 0, step: 0.1 }}
                                />
                            </Grid>
                        </Grid>
                        
                        <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                            <FormControlLabel
                                control={
                                    <Checkbox 
                                        checked={newItem.faceUp}
                                        onChange={handleInputChange}
                                        name="faceUp"
                                        color="primary"
                                        size="small"
                                    />
                                }
                                label="Face Up"
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox 
                                        checked={newItem.fragile}
                                        onChange={handleInputChange}
                                        name="fragile"
                                        color="primary"
                                        size="small"
                                    />
                                }
                                label="Fragile (Top Layer)"
                            />
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Row 3: AI Placement and System Settings */}
            <Grid container spacing={3}>
                {/* AI Placement & Assignment */}
                <Grid item xs={12} sm={6}>
                    <Paper 
                        elevation={3} 
                        sx={{ 
                            p: 2,
                            height: 150,
                            bgcolor: '#fff',
                            borderRadius: 1,
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        <Typography variant="h6" gutterBottom align="center">
                            AI Placement and Worker Assignment
                        </Typography>
                        
                        <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center',
                            justifyContent: 'center', 
                            flexGrow: 1
                        }}>
                            <Button
                                variant="contained"
                                color="secondary"
                                startIcon={<RunIcon />}
                                onClick={handleRunAI}
                                size="large"
                                disabled={items.length === 0 || !currentUser}
                                sx={{ minWidth: 250 }}
                            >
                                Run AI Placement Algorithm
                            </Button>
                            
                            {items.length === 0 && (
                                <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                                    Add at least one item first
                                </Typography>
                            )}
                            
                            {!currentUser && (
                                <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                                    Please log in first
                                </Typography>
                            )}
                        </Box>
                    </Paper>
                </Grid>
                
                {/* System Settings */}
                <Grid item xs={12} sm={6}>
                    <Paper 
                        elevation={3} 
                        sx={{ 
                            p: 2,
                            height: 150,
                            bgcolor: '#fff',
                            borderRadius: 1,
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        <Typography variant="h6" gutterBottom align="center">
                            System Settings
                        </Typography>
                        
                        <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexGrow: 1
                        }}>
                            <Button
                                variant="outlined"
                                startIcon={<SettingsIcon />}
                                onClick={() => setSettingsOpen(true)}
                                size="large"
                                sx={{ minWidth: 200 }}
                            >
                                Configure Container Size
                            </Button>
                            
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                                Current: {containerSettings.width} × {containerSettings.height} × {containerSettings.depth}
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Settings Dialog */}
            <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)}>
                <DialogTitle>Container Settings</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Configure the dimensions of the container used for item placement.
                    </Typography>
                    
                    <Grid container spacing={2}>
                        <Grid item xs={4}>
                            <TextField
                                fullWidth
                                label="Width"
                                name="width"
                                type="number"
                                value={containerSettings.width}
                                onChange={handleSettingsChange}
                                inputProps={{ min: 1, step: 0.1 }}
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <TextField
                                fullWidth
                                label="Height"
                                name="height"
                                type="number"
                                value={containerSettings.height}
                                onChange={handleSettingsChange}
                                inputProps={{ min: 1, step: 0.1 }}
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <TextField
                                fullWidth
                                label="Depth"
                                name="depth"
                                type="number"
                                value={containerSettings.depth}
                                onChange={handleSettingsChange}
                                inputProps={{ min: 1, step: 0.1 }}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSettingsOpen(false)}>Cancel</Button>
                    <Button onClick={handleApplySettings} variant="contained">Apply Settings</Button>
                </DialogActions>
            </Dialog>

            {/* AI Assignment Dialog */}
            <Dialog open={aiDialogOpen} onClose={handleCancelAi} maxWidth="sm" fullWidth>
                <DialogTitle>Assign Optimized Placement</DialogTitle>
                <DialogContent>
                    {aiComplete ? (
                        <>
                            <Alert severity="success" sx={{ mb: 2 }}>
                                Optimization complete! Task assigned to worker ID: {workerId}
                            </Alert>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                                Backend has generated the optimal layout with {apiResponse?.items?.length || 0} items.
                            </Typography>
                        </>
                    ) : aiProcessing ? (
                        <Box sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="body1" sx={{ mb: 2 }}>
                                Running AI optimization algorithm...
                            </Typography>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Enter the ID of the worker you want to assign this optimized placement to:
                            </Typography>
                            
                            <TextField
                                fullWidth
                                label="Worker ID"
                                value={workerId}
                                onChange={(e) => setWorkerId(e.target.value)}
                                type="number"
                                placeholder="e.g., 1"
                                sx={{ mb: 2 }}
                            />
                            
                            <TextField
                                fullWidth
                                label="Worker Name (optional)"
                                value={workerName}
                                onChange={(e) => setWorkerName(e.target.value)}
                                placeholder="e.g., John Smith"
                            />
                        </>
                    )}
                </DialogContent>
                {!aiProcessing && (
                    <DialogActions>
                        <Button onClick={handleCancelAi}>Cancel</Button>
                        {!aiComplete ? (
                            <Button 
                                onClick={handleAiAssign} 
                                variant="contained" 
                                disabled={!workerId.trim()}
                            >
                                Process Assignment
                            </Button>
                        ) : (
                            <Button 
                                onClick={handleCloseSuccessDialog} 
                                variant="contained"
                            >
                                Done
                            </Button>
                        )}
                    </DialogActions>
                )}
            </Dialog>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ItemManagementPage;