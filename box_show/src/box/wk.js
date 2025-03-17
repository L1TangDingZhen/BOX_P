import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    List,
    ListItem,
    ListItemText,
    Divider,
    Grid,
    Card,
    CardContent,
    IconButton,
    Stack,
    Tooltip,
    CircularProgress,
    Alert,
} from '@mui/material';
import {
    ArrowForward as NextIcon,
    ArrowBack as PreviousIcon,
    Visibility as ViewIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { API_BASE_URL } from '../config/api';


const WorkerConsole = () => {
    // --- Refs ---
    const mountRef = useRef(null);
    const sceneRef = useRef(null);
    const rendererRef = useRef(null);
    const frameIdRef = useRef(null);
    const cameraRef = useRef(null);
    const isMouseDown = useRef(false);
    const mousePosition = useRef({ x: 0, y: 0 });
    const cameraRotation = useRef({ x: 0, y: 0 });

    // --- State ---
    const [currentItemIndex, setCurrentItemIndex] = useState(-1);
    const [itemList, setItemList] = useState([]);
    const [spaceSize, setSpaceSize] = useState({ x: 10, y: 10, z: 10 });
    
    // Worker and tasks states
    const [currentUser, setCurrentUser] = useState(null);
    const [workerTasks, setWorkerTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Generate a random color based on item ID for visualization
    const getRandomColor = (id) => {
        const colors = [
            '#8dd3c7', '#bebada', '#fb8072', '#80b1d3', 
            '#fdb462', '#b3de69', '#fccde5', '#d9d9d9'
        ];
        return colors[id % colors.length];
    };

    // Handle selection of a task - 将此函数移到fetchWorkerTasks前面
    const handleSelectTask = useCallback((task) => {
        setSelectedTask(task);
        
        // Update space size based on task's space_info
        setSpaceSize({
            x: task.space_info.x,
            y: task.space_info.y,
            z: task.space_info.z
        });
        
        // Map API items to the format expected by the 3D visualization
        const formattedItems = task.items.map(item => ({
            id: `item${item.order_id}`,
            name: item.name,
            width: item.dimensions.x,
            height: item.dimensions.y,
            depth: item.dimensions.z,
            x: item.position.x,
            y: item.position.y,
            z: item.position.z,
            constraints: [
                ...(item.face_up ? ['Face Up'] : []),
                ...(item.fragile ? ['Fragile'] : [])
            ],
            color: getRandomColor(item.order_id) // Assign a color based on order_id
        }));
        
        setItemList(formattedItems);
        setCurrentItemIndex(-1); // Reset the selected item
    }, []);

    // Fetch worker tasks from API - 现在handleSelectTask已被定义
    const fetchWorkerTasks = useCallback(async (workerId) => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await fetch(`${API_BASE_URL}/api/workers/${workerId}/tasks/`);
                        
            if (!response.ok) {
                throw new Error(`Failed to fetch tasks: ${response.statusText}`);
            }
            
            const data = await response.json();
            setWorkerTasks(data);
            
            // If tasks available, select the first one by default
            if (data.length > 0) {
                handleSelectTask(data[0]);
            }
        } catch (err) {
            console.error('Error fetching worker tasks:', err);
            setError(`Failed to load tasks: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [handleSelectTask]);  // 依赖项包含handleSelectTask

    // Load user from localStorage
    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setCurrentUser(user);
            } catch (e) {
                console.error('Error parsing user data from localStorage', e);
                setError('Failed to load user information. Please log in again.');
            }
        } else {
            setError('User information not found. Please log in first.');
        }
    }, []);

    // Fetch worker tasks when component loads
    useEffect(() => {
        if (currentUser && currentUser.id) {
            fetchWorkerTasks(currentUser.id);
        }
    }, [currentUser, fetchWorkerTasks]);

    // 创建网格辅助线 - 直接从for.js复制
    const createGrids = useCallback((scene, spaceSize, visible = true) => {
        const gridGroup = new THREE.Group();
        gridGroup.visible = visible;
        scene.add(gridGroup);
        
        const gridMaterial = new THREE.LineBasicMaterial({
        color: 0x000000, 
        opacity: 0.2, 
        transparent: true 
        });
        
        // XY平面网格
        const xyGeometry = new THREE.BufferGeometry();
        const xyVertices = [];
        for (let x = 0; x <= spaceSize.x; x++) {
        xyVertices.push(x, 0, 0, x, spaceSize.y, 0);
        }
        for (let y = 0; y <= spaceSize.y; y++) {
        xyVertices.push(0, y, 0, spaceSize.x, y, 0);
        }
        xyGeometry.setAttribute('position', new THREE.Float32BufferAttribute(xyVertices, 3));
        gridGroup.add(new THREE.LineSegments(xyGeometry, gridMaterial));

        // XZ平面网格
        const xzGeometry = new THREE.BufferGeometry();
        const xzVertices = [];
        for (let x = 0; x <= spaceSize.x; x++) {
        xzVertices.push(x, 0, 0, x, 0, spaceSize.z);
        }
        for (let z = 0; z <= spaceSize.z; z++) {
        xzVertices.push(0, 0, z, spaceSize.x, 0, z);
        }
        xzGeometry.setAttribute('position', new THREE.Float32BufferAttribute(xzVertices, 3));
        gridGroup.add(new THREE.LineSegments(xzGeometry, gridMaterial));

        // YZ平面网格
        const yzGeometry = new THREE.BufferGeometry();
        const yzVertices = [];
        for (let y = 0; y <= spaceSize.y; y++) {
        yzVertices.push(0, y, 0, 0, y, spaceSize.z);
        }
        for (let z = 0; z <= spaceSize.z; z++) {
        yzVertices.push(0, 0, z, 0, spaceSize.y, z);
        }
        yzGeometry.setAttribute('position', new THREE.Float32BufferAttribute(yzVertices, 3));
        gridGroup.add(new THREE.LineSegments(yzGeometry, gridMaterial));

        scene.gridGroup = gridGroup;
    }, []);

    // 添加轴线刻度 - 直接从for.js复制
    const addTicks = useCallback((scene, axis, length) => {
        const tickMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
        const fontLoader = new FontLoader();
        const tickInterval = 2;

        for (let i = 0; i <= length; i += tickInterval) {
        const tickGeometry = new THREE.BufferGeometry();
        const tickPoints = [];

        if (axis === "x") {
            tickPoints.push(new THREE.Vector3(i, -0.1, 0));
            tickPoints.push(new THREE.Vector3(i, 0.1, 0));
        } else if (axis === "y") {
            tickPoints.push(new THREE.Vector3(-0.1, i, 0));
            tickPoints.push(new THREE.Vector3(0.1, i, 0));
        } else if (axis === "z") {
            tickPoints.push(new THREE.Vector3(0, -0.1, i));
            tickPoints.push(new THREE.Vector3(0, 0.1, i));
        }

        tickGeometry.setFromPoints(tickPoints);
        const tickLine = new THREE.Line(tickGeometry, tickMaterial);
        scene.add(tickLine);

        fontLoader.load(
            "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
            (font) => {
            const textGeometry = new TextGeometry(i.toString(), {
                font: font,
                size: 0.3,
                depth: 0.05,
            });
            const textMesh = new THREE.Mesh(
                textGeometry,
                new THREE.MeshBasicMaterial({ color: 0x000000 })
            );

            if (axis === "x") textMesh.position.set(i, -0.5, 0);
            if (axis === "y") textMesh.position.set(-0.5, i, 0);
            if (axis === "z") textMesh.position.set(0, -0.5, i);
            
            scene.add(textMesh);
            }
        );
        }
    }, []);

    // 创建坐标轴 - 直接从for.js复制
    const createThickAxis = useCallback((scene, spaceSize, onlyAxis = false) => {
        const axisMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

        // X轴
        const xGeometry = new THREE.CylinderGeometry(0.05, 0.05, spaceSize.x, 16);
        const xAxis = new THREE.Mesh(xGeometry, axisMaterial);
        xAxis.rotation.z = -Math.PI / 2;
        xAxis.position.set(spaceSize.x / 2, 0, 0);
        scene.add(xAxis);

        // Y轴
        const yGeometry = new THREE.CylinderGeometry(0.05, 0.05, spaceSize.y, 16);
        const yAxis = new THREE.Mesh(yGeometry, axisMaterial);
        yAxis.position.set(0, spaceSize.y / 2, 0);
        scene.add(yAxis);

        // Z轴
        const zGeometry = new THREE.CylinderGeometry(0.05, 0.05, spaceSize.z, 16);
        const zAxis = new THREE.Mesh(zGeometry, axisMaterial);
        zAxis.rotation.x = -Math.PI / 2;
        zAxis.position.set(0, 0, spaceSize.z / 2);
        scene.add(zAxis);

        createGrids(scene, spaceSize, true); // 始终显示网格
        addTicks(scene, "x", spaceSize.x);
        addTicks(scene, "y", spaceSize.y);
        addTicks(scene, "z", spaceSize.z);
    }, [createGrids, addTicks]);

    // 添加坐标轴标签 - 直接从for.js复制
    const addAxisLabels = useCallback((scene, length) => {
        const loader = new FontLoader();
        loader.load(
        'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
        (font) => {
            const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
            
            ['Width (X)', 'Height (Y)', 'Depth (Z)'].forEach((label, index) => {
            const textGeometry = new TextGeometry(label, {
                font: font,
                size: 0.5,
                depth: 0.1,
            });
            const textMesh = new THREE.Mesh(textGeometry, textMaterial);
            
            switch(index) {
                case 0:
                textMesh.position.set(length + 0.5, 0, 0);
                break;
                case 1:
                textMesh.position.set(0, length + 0.5, 0);
                break;
                case 2:
                textMesh.position.set(0, 0, length + 0.5);
                break;
                default:
                break;
            }
            
            scene.add(textMesh);
            });
        }
        );
    }, []);

    // 处理鼠标移动 - 直接从for.js复制
    const handleMouseMove = useCallback((e) => {
        e.preventDefault();

        if (!isMouseDown.current || !cameraRef.current) return;

        const deltaX = e.clientX - mousePosition.current.x;
        const deltaY = e.clientY - mousePosition.current.y;

        cameraRotation.current.x += deltaY * 0.01;
        cameraRotation.current.y += deltaX * 0.01;

        // 限制垂直旋转角度
        cameraRotation.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraRotation.current.x));

        const camera = cameraRef.current;
        const radius = Math.sqrt(
        camera.position.x ** 2 + 
        camera.position.y ** 2 + 
        camera.position.z ** 2
        );

        camera.position.x = radius * Math.cos(cameraRotation.current.y) * Math.cos(cameraRotation.current.x);
        camera.position.y = radius * Math.sin(cameraRotation.current.x);
        camera.position.z = radius * Math.sin(cameraRotation.current.y) * Math.cos(cameraRotation.current.x);

        camera.lookAt(0, 0, 0);
        
        mousePosition.current = {
        x: e.clientX,
        y: e.clientY
        };
    }, []);

    // 处理鼠标滚轮 - 直接从for.js复制
    const handleWheel = useCallback((e) => {
        const camera = cameraRef.current;
        if (!camera) return;

        const zoomSpeed = 0.1;
        const direction = e.deltaY > 0 ? 1 : -1;
        const radius = Math.sqrt(
        camera.position.x ** 2 + 
        camera.position.y ** 2 + 
        camera.position.z ** 2
        );

        const newRadius = radius * (1 + direction * zoomSpeed);
        
        const maxDimension = Math.max(spaceSize.x, spaceSize.y, spaceSize.z);
        const minRadius = Math.max(1, maxDimension * 0.1);
        const maxRadius = Math.max(50, maxDimension * 3);
        
        if (newRadius >= minRadius && newRadius <= maxRadius) {
        const scale = newRadius / radius;
        camera.position.multiplyScalar(scale);
        camera.lookAt(0, 0, 0);
        }
    }, [spaceSize]);

    // 处理窗口大小变化 - 直接从for.js复制
    const handleResize = useCallback(() => {
        if (rendererRef.current && mountRef.current && cameraRef.current) {
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        rendererRef.current.setSize(width, height, true);
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
        }
    }, []);

    // 鼠标按下事件 - 直接从for.js复制
    const handleMouseDown = useCallback((e) => {
        isMouseDown.current = true;
        mousePosition.current = {
        x: e.clientX,
        y: e.clientY
        };
    }, []);

    // 鼠标释放事件 - 直接从for.js复制
    const handleMouseUp = useCallback(() => {
        isMouseDown.current = false;
    }, []);

    // 添加或高亮物品
    const addOrHighlightItem = useCallback((item) => {
        if (!sceneRef.current) return;
        
        // Clear all existing items first if there's a material issue
        const existingItems = sceneRef.current.children.filter(
            child => child.userData && child.userData.itemId
        );
        
        // If we're switching tasks, remove all existing items
        if (existingItems.length > 0 && !existingItems.some(mesh => mesh.userData.itemId === item.id)) {
            existingItems.forEach(mesh => {
                sceneRef.current.remove(mesh);
            });
        }
        
        // Now look for this specific item
        const existingMesh = sceneRef.current.children.find(
            child => child.userData && child.userData.itemId === item.id
        );
        
        if (existingMesh) {
            // If already exists, highlight it
            sceneRef.current.children.forEach(child => {
                if (child.material && child.material.type === 'MeshPhongMaterial') {
                    if (child.userData && child.userData.itemId === item.id) {
                        child.material.opacity = 0.8;
                        child.material.color.set(item.color || 0x3498db);
                    } else {
                        child.material.opacity = 0.3;
                        child.material.color.set(child.userData.originalColor || 0xcccccc);
                    }
                }
            });
        } else {
            // If doesn't exist, create new item
            const geometry = new THREE.BoxGeometry(item.width, item.height, item.depth);
            const material = new THREE.MeshPhongMaterial({
                color: item.color || 0x3498db,
                transparent: true,
                opacity: 0.8
            });
            
            const cube = new THREE.Mesh(geometry, material);
            cube.position.set(
                item.x + item.width / 2,
                item.y + item.height / 2,
                item.z + item.depth / 2
            );
            
            // Store item info
            cube.userData = {
                itemId: item.id,
                originalColor: item.color || 0x3498db
            };
            
            // Add wireframe edges for better visibility
            const edges = new THREE.EdgesGeometry(geometry);
            const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
            const wireframe = new THREE.LineSegments(edges, lineMaterial);
            cube.add(wireframe);
            
            sceneRef.current.add(cube);
            
            // Make other items semi-transparent
            sceneRef.current.children.forEach(child => {
                if (child.material && 
                    child.material.type === 'MeshPhongMaterial' && 
                    child.userData && 
                    child.userData.itemId !== item.id) {
                    child.material.opacity = 0.3;
                }
            });
        }
    }, []);

    // Initialize Three.js scene when component mounts or space size changes
    useEffect(() => {
        if (!mountRef.current) return;

        // Clear the scene if it exists
        if (sceneRef.current) {
            while(sceneRef.current.children.length > 0) { 
                sceneRef.current.remove(sceneRef.current.children[0]); 
            }
        }

        const mountNode = mountRef.current;

        // Create scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f0f0);
        sceneRef.current = scene;

        // Create model group
        const modelGroup = new THREE.Group();
        scene.add(modelGroup);
        scene.modelGroup = modelGroup;

        // Create camera
        const camera = new THREE.PerspectiveCamera(
            75, 
            mountNode.clientWidth / mountNode.clientHeight, 
            0.1, 
            1000
        );
        camera.position.set(15, 10, 15);
        camera.lookAt(0, 0, 0);
        cameraRef.current = camera;

        // Create renderer if it doesn't exist yet
        if (!rendererRef.current) {
            const renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(mountNode.clientWidth, mountNode.clientHeight);
            mountNode.appendChild(renderer.domElement);
            rendererRef.current = renderer;
        }

        // Add axes and grid
        const axisLength = Math.max(spaceSize.x, spaceSize.y, spaceSize.z);
        createThickAxis(scene, spaceSize, false);
        addAxisLabels(scene, axisLength);

        // Create light group
        const lightGroup = new THREE.Group();
        scene.add(lightGroup);
        scene.lightGroup = lightGroup;

        // Add directional light
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(1, 1, 1);
        lightGroup.add(light);

        // Add ambient light
        lightGroup.add(new THREE.AmbientLight(0x404040));

        // Add event listeners
        window.addEventListener('resize', handleResize);
        rendererRef.current.domElement.addEventListener('mousedown', handleMouseDown);
        rendererRef.current.domElement.addEventListener('wheel', handleWheel, { passive: false });
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('mousemove', handleMouseMove);

        // Animation loop
        const animate = () => {
            frameIdRef.current = requestAnimationFrame(animate);
            rendererRef.current.render(scene, camera);
        };
        animate();

        // Cleanup
        return () => {
            if (frameIdRef.current) {
                cancelAnimationFrame(frameIdRef.current);
            }
            
            window.removeEventListener('resize', handleResize);
            rendererRef.current.domElement.removeEventListener('mousedown', handleMouseDown);
            rendererRef.current.domElement.removeEventListener('wheel', handleWheel);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, [
        spaceSize, 
        createThickAxis, 
        addAxisLabels, 
        handleMouseDown, 
        handleMouseUp, 
        handleMouseMove, 
        handleWheel, 
        handleResize
    ]);

    // Handle Next Item button click
    const handleNextItem = () => {
        const nextIndex = currentItemIndex + 1;
        if (nextIndex < itemList.length) {
            setCurrentItemIndex(nextIndex);
            addOrHighlightItem(itemList[nextIndex]);
        }
    };

    // Handle Previous Item button click
    const handlePreviousItem = () => {
        const prevIndex = currentItemIndex - 1;
        if (prevIndex >= 0) {
            setCurrentItemIndex(prevIndex);
            addOrHighlightItem(itemList[prevIndex]);
        }
    };

    // Handle item selection from list
    const handleSelectItem = (item, index) => {
        setCurrentItemIndex(index);
        addOrHighlightItem(item);
    };

    // Handle refresh button click
    const handleRefresh = () => {
        if (currentUser && currentUser.id) {
            fetchWorkerTasks(currentUser.id);
        }
    };

    // Format the date for display
    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleString();
        } catch (e) {
            return dateString;
        }
    };

    // Get the current selected item
    const currentItem = currentItemIndex >= 0 && currentItemIndex < itemList.length 
        ? itemList[currentItemIndex] 
        : null;

    return (
        <Box sx={{ 
            p: 0, 
            bgcolor: '#f5f5f5', 
            height: '100vh', 
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header with user info and task selection */}
            <Box sx={{ p: 2, pb: 1 }}>
                {currentUser && (
                    <Paper elevation={2} sx={{ p: 1.5, mb: 2, borderRadius: 1 }}>
                        <Grid container alignItems="center" spacing={2}>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1">
                                    Worker: {currentUser.name} (ID: {currentUser.id})
                                </Typography>
                            </Grid>
                            <Grid item xs={12} md={6} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                                <Button 
                                    variant="outlined" 
                                    size="small" 
                                    startIcon={<RefreshIcon />}
                                    onClick={handleRefresh}
                                    disabled={loading}
                                >
                                    Refresh Tasks
                                </Button>
                            </Grid>
                        </Grid>
                    </Paper>
                )}
                
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
                
                {/* Task selection section */}
                <Paper elevation={3} sx={{ p: 2, mb: 2, borderRadius: 1 }}>
                    <Typography variant="h6" gutterBottom>
                        Assigned Tasks
                    </Typography>
                    
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                            <CircularProgress />
                        </Box>
                    ) : workerTasks.length === 0 ? (
                        <Alert severity="info">
                            No tasks have been assigned to you yet.
                        </Alert>
                    ) : (
                        <Grid container spacing={2}>
                            {workerTasks.map(task => (
                                <Grid item xs={12} sm={6} md={4} key={task.id}>
                                    <Card 
                                        variant={selectedTask && selectedTask.id === task.id ? "outlined" : "elevation"}
                                        sx={{ 
                                            cursor: 'pointer',
                                            border: selectedTask && selectedTask.id === task.id ? '2px solid #1976d2' : 'none',
                                            backgroundColor: selectedTask && selectedTask.id === task.id ? '#f0f7ff' : '#fff'
                                        }}
                                        onClick={() => handleSelectTask(task)}
                                    >
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                Task #{task.id}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Created by: {task.creator.name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Date: {formatDate(task.created_at)}
                                            </Typography>
                                            <Typography variant="body2" mt={1}>
                                                Items: {task.items.length}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </Paper>
            </Box>

            {/* Main content area */}
            {selectedTask ? (
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {/* Task details section */}
                    <Box sx={{ px: 2, pb: 1 }}>
                        <Paper elevation={3} sx={{ p: 2, borderRadius: 1 }}>
                            <Typography variant="h6" gutterBottom>
                                Task #{selectedTask.id} Details
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={4}>
                                    <Typography variant="subtitle2" color="primary">Creator:</Typography>
                                    <Typography variant="body1">
                                        {selectedTask.creator.name} (ID: {selectedTask.creator.id})
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Typography variant="subtitle2" color="primary">Space Size:</Typography>
                                    <Typography variant="body1">
                                        {`${selectedTask.space_info.x} × ${selectedTask.space_info.y} × ${selectedTask.space_info.z}`}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Typography variant="subtitle2" color="primary">Created:</Typography>
                                    <Typography variant="body1">
                                        {formatDate(selectedTask.created_at)}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Box>
                
                    {/* 3D View and Item List */}
                    <Box sx={{ 
                        flex: 1,
                        px: 2,
                        pb: 1,
                        display: 'flex',
                        overflow: 'hidden'
                    }}>
                        <Grid container spacing={2} sx={{ height: '100%' }}>
                            {/* 3D View */}
                            <Grid item xs={12} md={8} sx={{ height: '100%' }}>
                                <Paper 
                                    elevation={3} 
                                    sx={{ 
                                        p: 1, 
                                        height: '100%',
                                        bgcolor: '#fff',
                                        borderRadius: 1,
                                        overflow: 'hidden',
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}
                                >
                                    <Typography variant="subtitle1" align="center" sx={{ mb: 1, flexShrink: 0 }}>
                                        3D View - Item Configuration
                                    </Typography>
                                    <Box 
                                        ref={mountRef} 
                                        sx={{ 
                                            width: '100%', 
                                            flex: 1,
                                            borderRadius: 1,
                                            overflow: 'hidden' 
                                        }}
                                    />
                                </Paper>
                            </Grid>
                            
                            {/* Item List */}
                            <Grid item xs={12} md={4} sx={{ height: '100%' }}>
                                <Paper 
                                    elevation={3} 
                                    sx={{ 
                                        p: 1, 
                                        height: '100%',
                                        bgcolor: '#fff',
                                        borderRadius: 1,
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}
                                >
                                    <Typography variant="subtitle1" align="center" sx={{ mb: 1, flexShrink: 0 }}>
                                        List of Items ({itemList.length})
                                    </Typography>
                                    <Box sx={{ overflow: 'auto', flex: 1 }}>
                                        <List>
                                            {itemList.length === 0 ? (
                                                <ListItem>
                                                    <ListItemText primary="No items in this task" />
                                                </ListItem>
                                            ) : (
                                                itemList.map((item, index) => (
                                                    <React.Fragment key={item.id}>
                                                        <ListItem 
                                                            button 
                                                            selected={currentItemIndex === index}
                                                            onClick={() => handleSelectItem(item, index)}
                                                            sx={{
                                                                bgcolor: currentItemIndex === index ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                                                                borderLeft: currentItemIndex === index ? '4px solid #1976d2' : 'none',
                                                                pl: currentItemIndex === index ? 1 : 2
                                                            }}
                                                        >
                                                            <ListItemText 
                                                                primary={`${item.name} (${item.id})`}
                                                                secondary={
                                                                    <>
                                                                        <Typography component="span" variant="body2" color="text.primary">
                                                                            {`${item.width} × ${item.height} × ${item.depth}`}
                                                                        </Typography>
                                                                        {item.constraints?.length > 0 && (
                                                                            <Typography component="span" variant="body2" color="text.secondary">
                                                                                {` - ${item.constraints.join(', ')}`}
                                                                            </Typography>
                                                                        )}
                                                                    </>
                                                                } 
                                                            />
                                                            <Tooltip title="View this item in 3D" placement="left">
                                                                <IconButton 
                                                                    size="small" 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleSelectItem(item, index);
                                                                    }}
                                                                    aria-label="View item"
                                                                >
                                                                    <ViewIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </ListItem>
                                                        {index < itemList.length - 1 && <Divider />}
                                                    </React.Fragment>
                                                ))
                                            )}
                                        </List>
                                    </Box>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Item Details Section */}
                    <Box sx={{ p: 2, pt: 1 }}>
                        <Paper 
                            elevation={3}
                            sx={{ 
                                p: 2, 
                                bgcolor: '#fff',
                                borderRadius: 1,
                                overflow: 'auto'
                            }}
                        >
                            <Typography variant="h6" gutterBottom>
                                Item Information
                            </Typography>
                            
                            {currentItem ? (
                                <Card variant="outlined">
                                    <CardContent>
                                        <Grid container spacing={2}>
                                            <Grid item xs={12} sm={3}>
                                                <Typography variant="subtitle2" color="primary">ID:</Typography>
                                                <Typography variant="body1" sx={{ mb: 1 }}>
                                                    {currentItem.id}
                                                </Typography>
                                            </Grid>
                                            
                                            <Grid item xs={12} sm={3}>
                                                <Typography variant="subtitle2" color="primary">Name:</Typography>
                                                <Typography variant="body1" sx={{ mb: 1 }}>
                                                    {currentItem.name}
                                                </Typography>
                                            </Grid>
                                            
                                            <Grid item xs={12} sm={3}>
                                                <Typography variant="subtitle2" color="primary">Dimensions (W×H×D):</Typography>
                                                <Typography variant="body1" sx={{ mb: 1 }}>
                                                    {`${currentItem.width} × ${currentItem.height} × ${currentItem.depth}`}
                                                </Typography>
                                            </Grid>
                                            
                                            <Grid item xs={12} sm={3}>
                                                <Typography variant="subtitle2" color="primary">Constraints:</Typography>
                                                <Typography variant="body1" sx={{ mb: 1 }}>
                                                    {currentItem.constraints?.length > 0 
                                                    ? currentItem.constraints.join(', ') 
                                                    : "None"}
                                                </Typography>
                                            </Grid>
                                            
                                            <Grid item xs={12}>
                                                <Typography variant="subtitle2" color="primary">Placement Position:</Typography>
                                                <Typography variant="body1">
                                                    {`X: ${currentItem.x}, Y: ${currentItem.y}, Z: ${currentItem.z}`}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    border: '1px dashed #ccc',
                                    borderRadius: 1,
                                    p: 2
                                }}>
                                    <Typography variant="body1" color="text.secondary" align="center">
                                        Select an item from the list above to see its details.
                                    </Typography>
                                </Box>
                            )}
                        </Paper>
                    </Box>

                    {/* Navigation Buttons */}
                    <Box sx={{ 
                        p: 2, 
                        pt: 1, 
                        pb: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Stack direction="row" spacing={4} justifyContent="center">
                            <Button
                                variant="outlined"
                                startIcon={<PreviousIcon />}
                                onClick={handlePreviousItem}
                                disabled={currentItemIndex <= 0 || itemList.length === 0}
                                sx={{ width: 160 }}
                            >
                                Previous Item
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                endIcon={<NextIcon />}
                                onClick={handleNextItem}
                                disabled={currentItemIndex >= itemList.length - 1 || itemList.length === 0}
                                sx={{ width: 160 }}
                            >
                                Next Item
                            </Button>
                        </Stack>
                    </Box>
                </Box>
            ) : (
                <Box sx={{ 
                    flex: 1, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center'
                }}>
                    <Paper elevation={3} sx={{ p: 4, maxWidth: 500, textAlign: 'center' }}>
                        <Typography variant="h5" gutterBottom>
                            No Task Selected
                        </Typography>
                        <Typography variant="body1" paragraph>
                            Please select a task from the list above to view its details and 3D visualization.
                        </Typography>
                        {workerTasks.length === 0 && !loading && (
                            <Alert severity="info" sx={{ mt: 2 }}>
                                No tasks have been assigned to you yet.
                            </Alert>
                        )}
                    </Paper>
                </Box>
            )}
        </Box>
    );
};

export default WorkerConsole;