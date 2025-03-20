import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Box, 
    Card, 
    Typography, 
    TextField, 
    Button, 
    Link, 
    Alert, 
    CircularProgress,
    FormControlLabel,
    Checkbox,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import { PersonOutline, LockOutlined, AdminPanelSettings } from '@mui/icons-material';
import { API_BASE_URL } from '../config/api';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        password: '',
        is_manager: false
    });
    
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [userData, setUserData] = useState(null);
    
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value, checked, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Basic validation
        if (!formData.name || !formData.password) {
            setError('Please enter both name and password');
            return;
        }
        
        try {
            setLoading(true);
            setError('');
            
            const response = await fetch(`${API_BASE_URL}/api/register/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }
            
            // Registration successful
            setUserData(data);
            setSuccess(true);
            
            // Auto redirect to login after 5 seconds
            setTimeout(() => {
                navigate('/login');
            }, 5000);
            
        } catch (err) {
            console.error('Registration error:', err);
            setError(err.message || 'Registration failed, please try again');
        } finally {
            setLoading(false);
        }
    };

    const handleCloseSuccessDialog = () => {
        navigate('/login');
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
                    Create a new account
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
                    <Box sx={{ position: 'relative', mb: 3 }}>
                        <TextField
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            variant="outlined"
                            label="Username"
                            fullWidth
                            InputProps={{
                                startAdornment: (
                                    <PersonOutline color="action" sx={{ mr: 1 }} />
                                ),
                            }}
                        />
                    </Box>

                    <Box sx={{ position: 'relative', mb: 3 }}>
                        <TextField
                            name="password"
                            value={formData.password}
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

                    <Box sx={{ mb: 3 }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    name="is_manager"
                                    checked={formData.is_manager}
                                    onChange={handleChange}
                                />
                            }
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <AdminPanelSettings sx={{ mr: 1 }} />
                                    <Typography variant="body2">Register as Manager</Typography>
                                </Box>
                            }
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
                        {loading ? <CircularProgress size={24} color="inherit" /> : "Register"}
                    </Button>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                        <Link href="/login" underline="hover" color="primary" variant="body2">
                            Already have an account? Login
                        </Link>
                    </Box>
                </Box>
            </Card>
            
            <Typography variant="body2" color="text.secondary" mt={3}>
                © 2025 Box Visualization Project. All rights reserved.
            </Typography>

            {/* Success Dialog */}
            <Dialog open={success} onClose={handleCloseSuccessDialog}>
                <DialogTitle sx={{ bgcolor: '#4caf50', color: 'white' }}>
                    Registration Successful!
                </DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Alert severity="success" sx={{ mb: 2 }}>
                        {userData?.message || "Your account has been created successfully"}
                    </Alert>
                    <Typography variant="body1" gutterBottom>
                        Your account has been created with the following details:
                    </Typography>
                    <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                        <Typography variant="body2" gutterBottom>
                            <strong>User ID:</strong> {userData?.id}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                            <strong>Username:</strong> {userData?.name}
                        </Typography>
                        <Typography variant="body2">
                            <strong>Account Type:</strong> {userData?.is_manager ? 'Manager' : 'Worker'}
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        Please remember your User ID as you will need it to log in.
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        You will be redirected to the login page in a few seconds...
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseSuccessDialog} color="primary">
                        Go to Login
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Register;