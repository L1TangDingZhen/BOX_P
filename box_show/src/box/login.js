import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, Typography, TextField, Button, Link, Alert } from '@mui/material';
import { LockOutlined, PersonOutline } from '@mui/icons-material';

const Login = () => {
    const [credentials, setCredentials] = useState({
        userId: '',
        password: '',
    });
        const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCredentials(prev => ({
        ...prev,
        [name]: value
        }));
    };


    // 登录逻辑
    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Basic validation
        if (!credentials.userId || !credentials.password) {
        setError('Please enter both user ID and password');
        return;
        }
        
        // Mock authentication - in a real app this would be an API call
        if (credentials.userId === 'admin' && credentials.password === 'admin') {
        // Success - redirect to main application
        navigate('/fou');
        } else {
        setError('Invalid credentials. Please try again.');
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
            border: '5px solid rgba(0, It will not be visible outside this comment: 0, 0, 0.4)',
            borderRadius: 2,
            }}
        >
            <Typography variant="h4" fontWeight="bold" color="primary" mb={1}>
            3D Box Visualization
            </Typography>
            
            <Typography variant="body1" color="text.secondary" mb={3}>
            Please sign in to continue
            </Typography>

            {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                {error}
            </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <Box sx={{ position: 'relative', mb: 3 }}>
                <TextField
                name="userId"
                value={credentials.userId}
                onChange={handleChange}
                variant="outlined"
                label="User ID"
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
                sx={{
                mb: 2,
                bgcolor: '#0078d4',
                height: 48,
                textTransform: 'none',
                fontSize: '1rem',
                }}
            >
                Sign In
            </Button>
            
            {/* <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <Link href="#" underline="hover" color="primary" variant="body2">
                Forgot Password?
                </Link>
                
                <Link href="#" underline="hover" color="primary" variant="body2">
                Create Account
                </Link>
            </Box> */}
            </Box>
        </Card>
        
        <Typography variant="body2" color="text.secondary" mt={3}>
            © 2025 Box Visualization Project. All rights reserved.
        </Typography>
        </Box>
    );
    };

export default Login;