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
} from '@mui/material';
import {
    ArrowForward as NextIcon,
    ArrowBack as PreviousIcon,
    Visibility as ViewIcon,
} from '@mui/icons-material';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';

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

    // --- Mock Data ---
    useEffect(() => {
        // 创建空的物品列表 - 初始状态无预置模型
        // 仅测试显示功能用，后续删除
        const mockItems = [
        { 
            id: 'item0001', 
            width: 2, height: 1, depth: 3, 
            x: 0, y: 0, z: 0,
            constraints: ['Face Up'], 
            color: '#8dd3c7' 
        },
        { 
            id: 'item0002', 
            width: 1, height: 2, depth: 1, 
            x: 2, y: 0, z: 0,
            constraints: ['Fragile'], 
            color: '#bebada' 
        },
        { 
            id: 'item0003', 
            width: 3, height: 1, depth: 2, 
            x: 0, y: 0, z: 3,
            constraints: [], 
            color: '#fb8072' 
        },
        { 
            id: 'item0004', 
            width: 2, height: 2, depth: 2, 
            x: 3, y: 0, z: 3,
            constraints: ['Face Up', 'Fragile'], 
            color: '#80b1d3' 
        },
        { 
            id: 'item0005', 
            width: 1, height: 1, depth: 1, 
            x: 0, y: 1, z: 0,
            constraints: [], 
            color: '#fdb462' 
        },
        { 
            id: 'item0006', 
            width: 2.5, height: 0.5, depth: 1.5, 
            x: 1, y: 1, z: 3,
            constraints: ['Face Up'], 
            color: '#b3de69' 
        },
        { 
            id: 'item0007', 
            width: 1, height: 3, depth: 1, 
            x: 5, y: 0, z: 0,
            constraints: [], 
            color: '#fccde5' 
        },
        { 
            id: 'item0008', 
            width: 1.5, height: 1.5, depth: 1.5, 
            x: 5, y: 0, z: 2,
            constraints: ['Fragile'], 
            color: '#d9d9d9' 
        },
        ];
        setItemList(mockItems);
    }, []);

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
        
        // 首先检查这个物品是否已经在场景中
        const existingMesh = sceneRef.current.children.find(
        child => child.userData && child.userData.itemId === item.id
        );
        
        if (existingMesh) {
        // 如果已存在，高亮显示
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
        // 如果不存在，创建新物品
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
        
        // 存储物品信息
        cube.userData = {
            itemId: item.id,
            originalColor: item.color || 0x3498db
        };
        
        // 添加线框边缘使物品更容易识别
        const edges = new THREE.EdgesGeometry(geometry);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
        const wireframe = new THREE.LineSegments(edges, lineMaterial);
        cube.add(wireframe);
        
        sceneRef.current.add(cube);
        
        // 将其他物品设置为半透明
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

    // 初始化Three.js场景 - 基于for.js修改
    useEffect(() => {
        if (!mountRef.current) return;

        const mountNode = mountRef.current;

        // 创建场景
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f0f0);
        sceneRef.current = scene;

        // 创建模型组 - 从for.js复制
        const modelGroup = new THREE.Group();
        scene.add(modelGroup);
        scene.modelGroup = modelGroup;

        // 创建相机
        const camera = new THREE.PerspectiveCamera(
        75, 
        mountNode.clientWidth / mountNode.clientHeight, 
        0.1, 
        1000
        );
        camera.position.set(15, 10, 15);
        camera.lookAt(0, 0, 0);
        cameraRef.current = camera;

        // 创建渲染器
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(mountNode.clientWidth, mountNode.clientHeight);
        mountNode.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // 添加坐标轴和网格
        const axisLength = Math.max(spaceSize.x, spaceSize.y, spaceSize.z);
        createThickAxis(scene, spaceSize, false);
        addAxisLabels(scene, axisLength);

        // 创建光源组 - 从for.js复制
        const lightGroup = new THREE.Group();
        scene.add(lightGroup);
        scene.lightGroup = lightGroup;

        // 添加定向光源 - 从for.js复制
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(1, 1, 1);
        lightGroup.add(light);

        // 添加环境光 - 从for.js复制
        lightGroup.add(new THREE.AmbientLight(0x404040));

        // 添加事件监听器
        window.addEventListener('resize', handleResize);
        renderer.domElement.addEventListener('mousedown', handleMouseDown);
        renderer.domElement.addEventListener('wheel', handleWheel, { passive: false });
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('mousemove', handleMouseMove);

        // 动画循环
        const animate = () => {
        frameIdRef.current = requestAnimationFrame(animate);
        renderer.render(scene, camera);
        };
        animate();

        // 清理函数
        return () => {
        if (frameIdRef.current) {
            cancelAnimationFrame(frameIdRef.current);
        }
        
        window.removeEventListener('resize', handleResize);
        renderer.domElement.removeEventListener('mousedown', handleMouseDown);
        renderer.domElement.removeEventListener('wheel', handleWheel);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('mousemove', handleMouseMove);
        
        if (mountNode && renderer.domElement) {
            mountNode.removeChild(renderer.domElement);
        }
        
        if (sceneRef.current) {
            sceneRef.current.clear();
        }
        
        if (rendererRef.current) {
            rendererRef.current.dispose();
        }
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

    // 处理点击Next Item按钮
    const handleNextItem = () => {
        const nextIndex = currentItemIndex + 1;
        if (nextIndex < itemList.length) {
        setCurrentItemIndex(nextIndex);
        addOrHighlightItem(itemList[nextIndex]);
        }
    };

    // 处理点击Previous Item按钮
    const handlePreviousItem = () => {
        const prevIndex = currentItemIndex - 1;
        if (prevIndex >= 0) {
        setCurrentItemIndex(prevIndex);
        addOrHighlightItem(itemList[prevIndex]);
        }
    };

    // 处理点击列表中的物品
    const handleSelectItem = (item, index) => {
        setCurrentItemIndex(index);
        addOrHighlightItem(item);
    };

    // 获取当前选中的物品
    const currentItem = currentItemIndex >= 0 && currentItemIndex < itemList.length 
        ? itemList[currentItemIndex] 
        : null;

    return (
        // 使用具有相对位置和固定高度的容器，不允许溢出
        <Box sx={{ 
        p: 0, 
        bgcolor: '#f5f5f5', 
        height: '100vh', 
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
        }}>
        {/* 第一行：3D视图和物品列表 - 固定高度 */}
        <Box sx={{ 
            height: 'calc(60vh - 16px)', 
            p: 2,
            pb: 1, 
            flexShrink: 0 
        }}>



            
            <Grid container spacing={2} sx={{ height: '100%' }}>
            {/* 3D视图 */}
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
                    3D View - The Configuration
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
            
            
            {/* 物品列表 */}
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
                    List of Next To-Be-Placed Items
                </Typography>
                <Box sx={{ overflow: 'auto', flex: 1 }}>
                    <List>
                    {itemList.map((item, index) => (
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
                            primary={item.id} 
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
                            <Tooltip title="Preview this item in 3D view" placement="left">
                                <IconButton 
                                size="small" 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectItem(item, index);
                                }}
                                aria-label="Preview item"
                                >
                                    <ViewIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </ListItem>
                        {index < itemList.length - 1 && <Divider />}
                        </React.Fragment>
                    ))}
                    </List>
                </Box>
                </Paper>
            </Grid>
            </Grid>
        </Box>

        {/* 第二行：物品信息区域 - 固定高度，并增加底部边距 */}
        <Box sx={{ 
            height: 'calc(25vh - 16px)', 
            p: 2,
            pt: 1,
            pb: 1,
            flexShrink: 0,  // 防止压缩
            mb: 2  // 添加底部外边距，与导航按钮分隔
        }}>
            <Paper 
                elevation={3}
                sx={{ 
                    p: 2, 
                    height: '100%',
                    bgcolor: '#fff',
                    borderRadius: 1,
                    overflow: 'auto',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <Typography variant="h6" gutterBottom sx={{ flexShrink: 0 }}>
                    Information of the To-Be-Placed Item
                </Typography>
                
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                    {currentItem ? (
                    <Card variant="outlined" sx={{ height: 'auto' }}>
                        <CardContent>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                            <Typography variant="subtitle2" color="primary">ID:</Typography>
                            <Typography variant="body1" sx={{ mb: 1 }}>
                                {currentItem.id}
                            </Typography>
                            </Grid>
                            
                            <Grid item xs={12} sm={4}>
                            <Typography variant="subtitle2" color="primary">Dimensions (W×H×D):</Typography>
                            <Typography variant="body1" sx={{ mb: 1 }}>
                                {`${currentItem.width} × ${currentItem.height} × ${currentItem.depth}`}
                            </Typography>
                            </Grid>
                            
                            <Grid item xs={12} sm={4}>
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
                        height: '100%',
                        border: '1px dashed #ccc',
                        borderRadius: 1,
                        p: 2
                    }}>
                        <Typography variant="body1" color="text.secondary" align="center">
                        Click "Next Item" or select an item from the list to see item information.
                        </Typography>
                    </Box>
                    )}
                </Box>
            </Paper>
        </Box>

        {/* 导航按钮 - 底部固定高度的区域 */}
        <Box sx={{ 
            p: 2, 
            pt: 1, 
            height: 'calc(15vh - 40px)',  // 固定高度
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <Stack direction="row" spacing={4} justifyContent="center">
                <Button
                    variant="outlined"
                    startIcon={<PreviousIcon />}
                    onClick={handlePreviousItem}
                    disabled={currentItemIndex <= 0}
                    sx={{ width: 160 }}
                >
                    Previous Item
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    endIcon={<NextIcon />}
                    onClick={handleNextItem}
                    disabled={currentItemIndex >= itemList.length - 1}
                    sx={{ width: 160 }}
                >
                    Next Item
                </Button>
            </Stack>
        </Box>
        </Box>
    );
};

export default WorkerConsole;