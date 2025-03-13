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
    Snackbar
} from '@mui/material';
import {
    Settings as SettingsIcon,
    Add as AddIcon,
    PlayArrow as RunIcon,
    Clear as ClearIcon
} from '@mui/icons-material';

const ItemManagementPage = () => {
    // State for new item
    const [newItem, setNewItem] = useState({
        width: '',
        height: '',
        depth: '',
        faceUp: false,
        fragile: false
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
    
    // State for AI processing
    const [aiProcessing, setAiProcessing] = useState(false);
    const [aiComplete, setAiComplete] = useState(false);
    
    // State for snackbar notifications
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'info'
    });

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
        if (!newItem.width || !newItem.height || !newItem.depth) {
        setSnackbar({
            open: true,
            message: 'Please enter all dimensions',
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
        ...newItem,
        width: parseFloat(newItem.width),
        height: parseFloat(newItem.height),
        depth: parseFloat(newItem.depth)
        };

        // Add to items list
        setItems(prev => [...prev, itemWithId]);
        
        // Reset the form
        setNewItem({
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

    // Process AI assignment
    const handleAiAssign = () => {
        if (!workerName.trim()) {
        setSnackbar({
            open: true,
            message: 'Please enter a worker name',
            severity: 'error'
        });
        return;
        }
        
        setAiProcessing(true);
        
        // Simulate AI processing
        setTimeout(() => {
        setAiProcessing(false);
        setAiComplete(true);
        
        setSnackbar({
            open: true,
            message: `Assignment processed and sent to ${workerName}`,
            severity: 'success'
        });
        
        // Close the dialog after a delay
        setTimeout(() => {
            setAiDialogOpen(false);
            setWorkerName('');
            setAiComplete(false);
        }, 2000);
        }, 3000);
    };

    // Cancel AI assignment
    const handleCancelAi = () => {
        setAiDialogOpen(false);
        setWorkerName('');
        setAiComplete(false);
        setAiProcessing(false);
    };

    // Handle close snackbar
    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({
        ...prev,
        open: false
        }));
    };

    return (
        <Box sx={{ p: 2, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
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
                    <TableCell>Dimensions (W×H×D)</TableCell>
                    <TableCell>Constraints</TableCell>
                    <TableCell align="center">Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {items.map((item) => (
                    <TableRow key={item.id} hover>
                        <TableCell>{item.id}</TableCell>
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
                height: 150,  // Fixed height
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
                disabled={!newItem.width || !newItem.height || !newItem.depth}
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
                height: 150,  // Fixed height
                bgcolor: '#fff',
                borderRadius: 1
                }}
            >
                <Typography variant="h6" gutterBottom>
                Input Window - Item Information
                </Typography>
                
                <Grid container spacing={2} sx={{ mb: 1 }}>
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
                height: 150,  // Fixed height to match row 2
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
                    disabled={items.length === 0}
                    sx={{ minWidth: 250 }}
                >
                    Run AI Placement Algorithm
                </Button>
                
                {/* {items.length === 0 && (
                    <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                    Add at least one item first
                    </Typography>
                )} */}
                </Box>
            </Paper>
            </Grid>
            
            {/* System Settings */}
            <Grid item xs={12} sm={6}>
            <Paper 
                elevation={3} 
                sx={{ 
                p: 2,
                height: 150,  // Fixed height to match others
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
                <Alert severity="success" sx={{ mb: 2 }}>
                Optimization complete! Assignment sent to {workerName}.
                </Alert>
            ) : aiProcessing ? (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="body1" sx={{ mb: 2 }}>
                    Running AI optimization algorithm...
                </Typography>
                <Box sx={{ 
                    width: '100%', 
                    height: 5, 
                    bgcolor: '#e0e0e0',
                    borderRadius: 5,
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <Box 
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        height: '100%',
                        width: '30%',
                        bgcolor: 'secondary.main',
                        borderRadius: 5,
                        animation: 'moveRight 1.5s infinite linear'
                    }}
                    />
                </Box>
                <style jsx>{`
                    @keyframes moveRight {
                    0% { left: -30%; }
                    100% { left: 100%; }
                    }
                `}</style>
                </Box>
            ) : (
                <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Enter the name of the worker you want to assign this optimized placement to:
                </Typography>
                
                <TextField
                    fullWidth
                    label="Worker Name"
                    value={workerName}
                    onChange={(e) => setWorkerName(e.target.value)}
                    placeholder="e.g., John Smith"
                />
                </>
            )}
            </DialogContent>
            {!aiComplete && !aiProcessing && (
            <DialogActions>
                <Button onClick={handleCancelAi}>Cancel</Button>
                <Button 
                onClick={handleAiAssign} 
                variant="contained" 
                disabled={!workerName.trim()}
                >
                Process Assignment
                </Button>
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