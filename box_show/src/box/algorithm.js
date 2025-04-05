// import React, { useState, useEffect } from 'react';
import React, { useState} from 'react';
import {
    Box,
    // Paper,
    Typography,
    Button,
    Alert,
    Snackbar,
    CircularProgress,
    Card,
    CardContent,
} from '@mui/material';
import { Upload as UploadIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

const AlgorithmUpload = () => {
    // const [currentUser, setCurrentUser] = useState(null);
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'info'
    });
    const navigate = useNavigate();

    // Load user info
    // useEffect(() => {
    //     const userStr = localStorage.getItem('user');
    //     if (userStr) {
    //         try {
    //             const user = JSON.parse(userStr);
    //             setCurrentUser(user);
                
    //             // Redirect if not manager
    //             if (!user.is_manager) {
    //                 setSnackbar({
    //                     open: true,
    //                     message: 'Only managers can access this page',
    //                     severity: 'error'
    //                 });
    //                 setTimeout(() => navigate('/MG'), 2000);
    //             }
    //         } catch (e) {
    //             console.error('Error parsing user data from localStorage', e);
    //             setTimeout(() => navigate('/login'), 2000);
    //         }
    //     } else {
    //         setTimeout(() => navigate('/login'), 2000);
    //     }
    // }, [navigate]);

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        
        if (!selectedFile) {
            return;
        }
        
        // Validate file type
        if (!selectedFile.name.endsWith('.py')) {
            setSnackbar({
                open: true,
                message: 'Only Python (.py) files are allowed',
                severity: 'error'
            });
            return;
        }
        
        setFile(selectedFile);
    };

    const handleUpload = async () => {
        // if (!file || !currentUser) {
        //     return;
        // }
        if (!file) {
            setSnackbar({
                open: true,
                message: 'Please select a file first',
                severity: 'error'
            });
            return;
        }
        
        setLoading(true);
        
        try {
            const formData = new FormData();
            formData.append('file', file);
            // formData.append('user_id', currentUser.id);
            
            const response = await fetch(`${API_BASE_URL}/api/algorithm/upload/`, {
                method: 'POST',
                body: formData,
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Upload failed');
            }
            
            setSnackbar({
                open: true,
                message: 'Algorithm uploaded successfully!',
                severity: 'success'
            });
            
            setFile(null);
            document.getElementById('algorithm-file-input').value = '';
            
        } catch (error) {
            console.error('Upload error:', error);
            setSnackbar({
                open: true,
                message: `Upload failed: ${error.message}`,
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleGoBack = () => {
        navigate('/MG');
    };

    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({
            ...prev,
            open: false
        }));
    };

    return (
        <Box sx={{ p: 2, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
            {/* User info */}
            {/* {currentUser && (
                <Paper elevation={2} sx={{ p: 1.5, mb: 2, borderRadius: 1, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1">
                        User: {currentUser.name} (ID: {currentUser.id})
                    </Typography>
                    {currentUser.is_manager && (
                        <Typography variant="subtitle1" color="primary">
                            Manager
                        </Typography>
                    )}
                </Paper>
            )} */}

            {/* Back button */}
            <Button
                variant="outlined"
                startIcon={<BackIcon />}
                onClick={handleGoBack}
                sx={{ mb: 2 }}
            >
                Back to Management
            </Button>

            {/* Main content */}
            <Card sx={{ p: 3, borderRadius: 1 }}>
                <CardContent>
                    <Typography variant="h5" gutterBottom align="center">
                        Upload Packing Algorithm
                    </Typography>

                    <Box sx={{ 
                        border: '2px dashed #ccc', 
                        borderRadius: 1, 
                        p: 3, 
                        textAlign: 'center',
                        my: 3 
                    }}>
                        <input
                            type="file"
                            accept=".py"
                            id="algorithm-file-input"
                            style={{ display: 'none' }}
                            onChange={handleFileChange}
                        />
                        <label htmlFor="algorithm-file-input">
                            <Button
                                variant="contained"
                                component="span"
                                startIcon={<UploadIcon />}
                                sx={{ mb: 2 }}
                            >
                                Select Python File
                            </Button>
                        </label>

                        {file ? (
                            <Typography variant="body1">
                                Selected: {file.name}
                            </Typography>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                Please select a .py file with place_items() function
                            </Typography>
                        )}
                    </Box>

                    <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        disabled={!file || loading}
                        onClick={handleUpload}
                    >
                        {loading ? <CircularProgress size={24} /> : "Upload Algorithm"}
                    </Button>
                </CardContent>
            </Card>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert 
                    onClose={handleCloseSnackbar} 
                    severity={snackbar.severity} 
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default AlgorithmUpload;