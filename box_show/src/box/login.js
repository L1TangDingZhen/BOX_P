import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, Typography, TextField, Button, Link, Alert, CircularProgress } from '@mui/material';
import { LockOutlined, PersonOutline } from '@mui/icons-material';

const Login = () => {
    const [credentials, setCredentials] = useState({
        id: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCredentials(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // API login logic
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Basic validation
        if (!credentials.id || !credentials.password) {
            setError('Please enter user ID and password');
            return;
        }
        
        try {
            setLoading(true);
            setError('');
            
            // Ensure ID is a number
            const numericId = parseInt(credentials.id, 10);
            
            if (isNaN(numericId)) {
                setError('User ID must be a number');
                setLoading(false);
                return;
            }
            
            // Send login request to API
            const response = await fetch('http://127.0.0.1:8000/api/login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: numericId,
                    password: credentials.password
                }),
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }
            
            // Login successful
            console.log('Login successful:', data);
            
            // Save user info to local storage
            localStorage.setItem('user', JSON.stringify({
                id: data.id,
                name: data.name,
                is_manager: data.is_manager
            }));
            
            // Navigate to different pages based on user role
            if (data.is_manager) {
                navigate('/MG'); // Manager page
            } else {
                navigate('/WK'); // Worker page
            }
            
        } catch (err) {
            console.error('Login error:', err);
            setError(err.message || 'Login failed, please check your credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: '#f5f5f5',
            }}
        >
            <Card
                sx={{
                    width: { xs: '90%', sm: 400 },
                    p: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
                    border: '5px solid rgba(0, 0, 0, 0.4)',
                    borderRadius: 2,
                }}
            >
                <Typography variant="h4" fontWeight="bold" color="primary" mb={1}>
                    3D Box Visualization
                </Typography>
                
                <Typography variant="body1" color="text.secondary" mb={3}>
                    Please log in to continue
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
                    <Box sx={{ position: 'relative', mb: 3 }}>
                        <TextField
                            name="id"
                            value={credentials.id}
                            onChange={handleChange}
                            variant="outlined"
                            label="User ID"
                            type="number"
                            fullWidth
                            InputProps={{
                                startAdornment: (
                                    <PersonOutline color="action" sx={{ mr: 1 }} />
                                ),
                            }}
                        />
                    </Box>

                    <Box sx={{ position: 'relative', mb: 4 }}>
                        <TextField
                            name="password"
                            value={credentials.password}
                            onChange={handleChange}
                            variant="outlined"
                            label="Password"
                            type="password"
                            fullWidth
                            InputProps={{
                                startAdornment: (
                                    <LockOutlined color="action" sx={{ mr: 1 }} />
                                ),
                            }}
                        />
                    </Box>

                    <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        fullWidth
                        disabled={loading}
                        sx={{
                            mb: 2,
                            bgcolor: '#0078d4',
                            height: 48,
                            textTransform: 'none',
                            fontSize: '1rem',
                        }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : "Login"}
                    </Button>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                        <Link href="/register" underline="hover" color="primary" variant="body2">
                            Register new account
                        </Link>
                    </Box>
                </Box>
            </Card>
            
            <Typography variant="body2" color="text.secondary" mt={3}>
                © 2025 Box Visualization Project. All rights reserved.
            </Typography>
        </Box>
    );
};

export default Login;