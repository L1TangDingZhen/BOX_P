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
    Fullscreen as FullscreenIcon,
    FullscreenExit as FullscreenExitIcon,
} from '@mui/icons-material';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { API_BASE_URL } from '../config/api';

const WorkerConsole = () => {
    // --- Refs ---
    const mount3DRef = useRef(null);  // 3D视图的ref
    const mount3DContainerRef = useRef(null); // 3D视图容器ref（用于全屏）
    const mountTopViewRef = useRef(null);  // 顶视图的ref
    const scene3DRef = useRef(null);  // 3D视图场景
    const sceneTopViewRef = useRef(null);  // 顶视图场景
    const renderer3DRef = useRef(null);  // 3D视图渲染器
    const rendererTopViewRef = useRef(null);  // 顶视图渲染器
    const frameId3DRef = useRef(null);  // 3D视图动画帧
    const frameIdTopViewRef = useRef(null);  // 顶视图动画帧
    const camera3DRef = useRef(null);  // 3D视图相机
    const cameraTopViewRef = useRef(null);  // 顶视图相机
    const isMouseDown = useRef(false);
    const mousePosition = useRef({ x: 0, y: 0 });
    const cameraRotation = useRef({ x: 0, y: 0 });

    // --- State ---
    const [currentItemIndex, setCurrentItemIndex] = useState(-1);
    const [itemList, setItemList] = useState([]);
    const [spaceSize, setSpaceSize] = useState({ x: 10, y: 10, z: 10 });
    const [placedItems, setPlacedItems] = useState([]);  // 跟踪已放置的物品
    const [currentLayerY, setCurrentLayerY] = useState(0);  // 跟踪当前显示层的Y坐标
    const [isFullScreen, setIsFullScreen] = useState(false); // 全屏状态


    // Worker and tasks states
    const [currentUser, setCurrentUser] = useState(null);
    const [workerTasks, setWorkerTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 检测iOS设备
    const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad/.test(navigator.userAgent);

    const itemRefs = useRef({});
    const listContainerRef = useRef(null);

    const scrollToSelectedItem = useCallback(() => {
        if (currentItemIndex >= 0 && itemRefs.current[currentItemIndex] && listContainerRef.current) {
            const container = listContainerRef.current;
            const containerRect = container.getBoundingClientRect();
            
            const itemElement = itemRefs.current[currentItemIndex];
            const itemRect = itemElement.getBoundingClientRect();
            
            const relativeTop = itemRect.top - containerRect.top;
            const relativeBottom = itemRect.bottom - containerRect.top;
            
            if (relativeTop < 0) {
                container.scrollTop += relativeTop;
            } else if (relativeBottom > containerRect.height) {
                container.scrollTop += relativeBottom - containerRect.height;
            }
        }
    }, [currentItemIndex]);

    // Generate a random color based on item ID for visualization
    const getRandomColor = (id) => {
        const colors = [
            '#8dd3c7', '#bebada', '#fb8072', '#80b1d3', 
            '#fdb462', '#b3de69', '#fccde5', '#d9d9d9'
        ];
        return colors[id % colors.length];
    };

    // Handle selection of a task
    const handleSelectTask = useCallback((task) => {
        setSelectedTask(task);
        
        // 更新space size基于task的space_info
        setSpaceSize({
            x: task.space_info.x,
            y: task.space_info.y,
            z: task.space_info.z
        });
        
        // 映射API项目到3D可视化期望的格式
        const formattedItems = task.items.map(item => ({
            id: `item${item.order_id}`,
            name: item.name,
            width: item.dimensions.x,
            height: item.dimensions.y,  // 调整为正确的映射
            depth: item.dimensions.z,   // 调整为正确的映射
            x: item.position.x,
            y: item.position.y,         // 调整为正确的映射
            z: item.position.z,         // 调整为正确的映射
            constraints: [
                ...(item.face_up ? ['Face Up'] : []),
                ...(item.fragile ? ['Fragile'] : [])
            ],
            color: getRandomColor(item.order_id) // 基于order_id分配颜色
        }));
        
        setItemList(formattedItems);
        setCurrentItemIndex(-1); // 重置选定项
        setPlacedItems([]); // 重置已放置物品列表
        setCurrentLayerY(0); // 重置当前层级为0
    }, []);

    // Fetch worker tasks from API
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
    }, [handleSelectTask]);

    // 处理窗口大小变化
    const handleResize = useCallback(() => {
        // 处理3D视图的窗口大小变化
        if (renderer3DRef.current && mount3DRef.current && camera3DRef.current) {
            const width = mount3DRef.current.clientWidth;
            const height = mount3DRef.current.clientHeight;
            renderer3DRef.current.setSize(width, height, true);
            camera3DRef.current.aspect = width / height;
            camera3DRef.current.updateProjectionMatrix();
        }
        
        // 处理顶视图的窗口大小变化
        if (rendererTopViewRef.current && mountTopViewRef.current && cameraTopViewRef.current) {
            const width = mountTopViewRef.current.clientWidth;
            const height = mountTopViewRef.current.clientHeight;
            rendererTopViewRef.current.setSize(width, height, true);
            
            // 确保渲染
            if (sceneTopViewRef.current) {
                rendererTopViewRef.current.render(sceneTopViewRef.current, cameraTopViewRef.current);
            }
        }
    }, []);

    // 处理全屏切换
    const toggleFullScreen = useCallback(async () => {
        try {
            // 保存相机状态
            const camera = camera3DRef.current;
            const currentPosition = camera?.position.clone();
            const currentUp = camera?.up.clone();
            
            if (!isFullScreen) {
                setIsFullScreen(true);
                if (isIOS) {
                    // iOS设备的全屏处理
                    if (mount3DRef.current) {
                        mount3DRef.current.style.position = "fixed";
                        mount3DRef.current.style.top = "0";
                        mount3DRef.current.style.left = "0";
                        mount3DRef.current.style.width = "100vw";
                        mount3DRef.current.style.height = "100vh";
                        mount3DRef.current.style.zIndex = "9999";
                        mount3DRef.current.style.backgroundColor = "#f0f0f0";
                    }
                } else {
                    // 标准全屏API
                    if (mount3DContainerRef.current?.requestFullscreen) {
                        await mount3DContainerRef.current.requestFullscreen();
                    } else if (mount3DContainerRef.current?.webkitRequestFullscreen) {
                        await mount3DContainerRef.current.webkitRequestFullscreen();
                    }
                }
            } else {
                setIsFullScreen(false);
                if (isIOS) {
                    // iOS退出全屏
                    if (mount3DRef.current) {
                        mount3DRef.current.style.position = "";
                        mount3DRef.current.style.top = "";
                        mount3DRef.current.style.left = "";
                        mount3DRef.current.style.width = "";
                        mount3DRef.current.style.height = "";
                        mount3DRef.current.style.zIndex = "";
                        mount3DRef.current.style.backgroundColor = "";
                    }
                } else {
                    // 标准退出全屏API
                    if (document.exitFullscreen) {
                        await document.exitFullscreen();
                    } else if (document.webkitExitFullscreen) {
                        await document.webkitExitFullscreen();
                    }
                }
            }
            
            // 延迟执行尺寸调整和渲染
            setTimeout(() => {
                handleResize();
                
                // 恢复相机状态
                if (camera && currentPosition && currentUp) {
                    camera.position.copy(currentPosition);
                    camera.up.copy(currentUp);
                    camera.lookAt(0, 0, 0);
                }
                
                // 重新渲染
                if (renderer3DRef.current && scene3DRef.current && camera3DRef.current) {
                    renderer3DRef.current.render(scene3DRef.current, camera3DRef.current);
                }
            }, 100);
        } catch (err) {
            console.error("Error toggling fullscreen:", err);
        }
    }, [isFullScreen, isIOS, handleResize]);

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

    // 监听全屏变化
    useEffect(() => {
        const handleFullScreenChange = () => {
            const isCurrentlyFullScreen = !!document.fullscreenElement;
            setIsFullScreen(isCurrentlyFullScreen);
            
            // 全屏状态变化时执行尺寸调整
            setTimeout(() => {
                handleResize();
            }, 100);
        };
        
        document.addEventListener('fullscreenchange', handleFullScreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullScreenChange);
        
        return () => {
            document.removeEventListener('fullscreenchange', handleFullScreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullScreenChange);
        };
    }, [handleResize]);
    
    // 专门处理退出全屏模式时顶视图的重建
    useEffect(() => {
        // 我们只关心从全屏模式切换到非全屏模式的情况
        if (isFullScreen === false && mountTopViewRef.current) {
            // 分两步处理，加快渲染速度
            // 第一步：快速创建渲染器（100ms）
            const timeout1 = setTimeout(() => {
                console.log("退出全屏，快速重建顶视图...");
                
                // 完全删除旧的渲染器和画布
                if (mountTopViewRef.current && rendererTopViewRef.current) {
                    // 清除动画帧
                    if (frameIdTopViewRef.current) {
                        cancelAnimationFrame(frameIdTopViewRef.current);
                        frameIdTopViewRef.current = null;
                    }
                    
                    // 移除旧的canvas
                    while (mountTopViewRef.current.firstChild) {
                        mountTopViewRef.current.removeChild(mountTopViewRef.current.firstChild);
                    }
                    
                    // 释放旧渲染器资源
                    rendererTopViewRef.current.dispose();
                    rendererTopViewRef.current = null;
                }
                
                // 立即创建新的渲染器
                if (mountTopViewRef.current) {
                    // 设置为高性能模式
                    const newRenderer = new THREE.WebGLRenderer({ 
                        antialias: true,
                        powerPreference: "high-performance"
                    });
                    const width = mountTopViewRef.current.clientWidth;
                    const height = mountTopViewRef.current.clientHeight;
                    newRenderer.setSize(width, height);
                    mountTopViewRef.current.appendChild(newRenderer.domElement);
                    rendererTopViewRef.current = newRenderer;
                    
                    // 快速渲染一个基本场景
                    if (sceneTopViewRef.current && cameraTopViewRef.current) {
                        // 立即渲染一次
                        newRenderer.render(sceneTopViewRef.current, cameraTopViewRef.current);
                        
                        // 立即启动渲染循环
                        const animateTopView = () => {
                            frameIdTopViewRef.current = requestAnimationFrame(animateTopView);
                            if (rendererTopViewRef.current && sceneTopViewRef.current && cameraTopViewRef.current) {
                                rendererTopViewRef.current.render(sceneTopViewRef.current, cameraTopViewRef.current);
                            }
                        };
                        animateTopView();
                    }
                }
            }, 100); // 快速响应
            
            // 第二步：填充内容（再等150ms）
            const timeout2 = setTimeout(() => {
                if (rendererTopViewRef.current && sceneTopViewRef.current && currentItemIndex >= 0 && itemList[currentItemIndex]) {
                    // 直接使用内联代码，避免循环引用问题
                    const item = itemList[currentItemIndex];
                    
                    // 更新当前层为当前物品的Y坐标
                    setCurrentLayerY(item.y);
                    
                    // 重新创建顶视图中的物品显示
                    // 清除之前的所有平面表示
                    const sceneTop = sceneTopViewRef.current;
                    sceneTop.children = sceneTop.children.filter(child => 
                        !child.userData || !child.userData.isItemMesh
                    );
                    
                    // 找出所有当前层的物品
                    const itemsInCurrentLayer = itemList.filter(i => 
                        Math.abs(i.y - item.y) < 0.01 || // 在当前层
                        i.id === item.id // 或是当前选中的物品
                    );
                    
                    // 创建所有物品几何体（优化性能的批处理方法）
                    const geometries = [];
                    const materials = [];
                    const planes = [];
                    
                    // 为当前层的每个物品创建平面表示
                    itemsInCurrentLayer.forEach(layerItem => {
                        const isCurrentItem = layerItem.id === item.id;
                        
                        const topMaterial = new THREE.MeshBasicMaterial({
                            color: layerItem.color || 0x3498db,
                            transparent: true,
                            opacity: isCurrentItem ? 0.9 : 0.4
                        });
                        
                        // 创建一个平面来表示顶视图中的物品
                        const planeGeometry = new THREE.PlaneGeometry(layerItem.width, layerItem.depth);
                        const plane = new THREE.Mesh(planeGeometry, topMaterial);
                        
                        // 旋转使其平躺在XZ平面上
                        plane.rotation.x = -Math.PI / 2;
                        
                        // 定位在物品XZ坐标的中心
                        plane.position.set(
                            layerItem.x + layerItem.width / 2,
                            layerItem.y + 0.01, // 略高于物品表面，避免Z-fighting
                            layerItem.z + layerItem.depth / 2
                        );
                        
                        plane.userData = {
                            itemId: layerItem.id,
                            originalColor: layerItem.color || 0x3498db,
                            isItemMesh: true,
                            layerY: layerItem.y
                        };
                        
                        // 添加轮廓
                        const outlineGeometry = new THREE.EdgesGeometry(planeGeometry);
                        const outlineMaterial = new THREE.LineBasicMaterial({ 
                            color: isCurrentItem ? 0x000000 : 0x666666,
                            linewidth: isCurrentItem ? 2 : 1
                        });
                        const outline = new THREE.LineSegments(outlineGeometry, outlineMaterial);
                        plane.add(outline);
                        
                        // 一次性添加所有物品
                        sceneTop.add(plane);
                    });
                    
                    // 再次渲染顶视图
                    if (rendererTopViewRef.current && cameraTopViewRef.current) {
                        rendererTopViewRef.current.render(sceneTop, cameraTopViewRef.current);
                    }
                }
            }, 250); // 更快的渲染内容
            
            return () => {
                clearTimeout(timeout1);
                clearTimeout(timeout2);
            };
        }
    }, [isFullScreen, currentItemIndex, itemList]);

    // Fetch worker tasks when component loads
    useEffect(() => {
        if (currentUser && currentUser.id) {
            fetchWorkerTasks(currentUser.id);
        }
    }, [currentUser, fetchWorkerTasks]);

    useEffect(() => { 
        scrollToSelectedItem(); 
    }, [currentItemIndex, scrollToSelectedItem]);

    // 创建网格辅助线
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

    // 添加轴线刻度
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

    // 创建坐标轴
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

    // 添加坐标轴标签
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

    // 处理鼠标移动
    const handleMouseMove = useCallback((e) => {
        e.preventDefault();

        if (!isMouseDown.current || !camera3DRef.current) return;

        const deltaX = e.clientX - mousePosition.current.x;
        const deltaY = e.clientY - mousePosition.current.y;

        cameraRotation.current.x += deltaY * 0.01;
        cameraRotation.current.y += deltaX * 0.01;

        // 限制垂直旋转角度
        cameraRotation.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraRotation.current.x));

        const camera = camera3DRef.current;
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

    // 处理鼠标滚轮
    const handleWheel = useCallback((e) => {
        const camera = camera3DRef.current;
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


    // 鼠标按下事件
    const handleMouseDown = useCallback((e) => {
        isMouseDown.current = true;
        mousePosition.current = {
            x: e.clientX,
            y: e.clientY
        };
    }, []);

    // 鼠标释放事件
    const handleMouseUp = useCallback(() => {
        isMouseDown.current = false;
    }, []);

    const addOrHighlightItem = useCallback((item) => {
        if (!scene3DRef.current || !sceneTopViewRef.current) return;
        
        // 首先检查是否已经放置过这个物品
        const isItemPlaced = placedItems.some(placedItem => placedItem.id === item.id);
        
        // 更新当前层级为当前物品的Y坐标
        setCurrentLayerY(item.y);
        
        // 处理3D视图场景
        const scene3D = scene3DRef.current;
        
        // 检查物品是否已存在于3D场景中
        const existing3DMesh = scene3D.children.find(
            child => child.userData && child.userData.itemId === item.id
        );
        
        if (existing3DMesh) {
            // 如果物品已存在，高亮显示它并使其他物品变暗
            scene3D.children.forEach(child => {
                if (child.material && child.material.type === 'MeshPhongMaterial') {
                    if (child.userData && child.userData.itemId === item.id) {
                        // 当前物品高亮显示
                        child.material.opacity = 0.8;
                        child.material.color.set(item.color || 0x3498db);
                    } else {
                        // 其他物品变暗
                        child.material.opacity = 0.3;
                        child.material.color.set(child.userData.originalColor || 0xcccccc);
                    }
                }
            });
        } else {
            // 如果物品不存在，创建新物品 (3D视图)
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
                originalColor: item.color || 0x3498db,
                layerY: item.y
            };
            
            // 添加线框边缘以提高可见性
            const edges = new THREE.EdgesGeometry(geometry);
            const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
            const wireframe = new THREE.LineSegments(edges, lineMaterial);
            cube.add(wireframe);
            
            scene3D.add(cube);
            
            // 使其他物品半透明
            scene3D.children.forEach(child => {
                if (child.material && 
                    child.material.type === 'MeshPhongMaterial' && 
                    child.userData && 
                    child.userData.itemId !== item.id) {
                    child.material.opacity = 0.3;
                }
            });
        }
        
        // 现在处理顶视图 - 首先清除所有当前物品
        const sceneTop = sceneTopViewRef.current;
        
        // 清除之前的所有平面表示
        sceneTop.children = sceneTop.children.filter(child => 
            !child.userData || !child.userData.isItemMesh
        );
        
        // 找出所有当前层的物品（包括当前选中的物品）
        const itemsInCurrentLayer = itemList.filter(i => 
            Math.abs(i.y - currentLayerY) < 0.01 || // 在当前层
            i.id === item.id // 或是当前选中的物品
        );
        
        // 为当前层的每个物品创建平面表示
        itemsInCurrentLayer.forEach(layerItem => {
            const isCurrentItem = layerItem.id === item.id;
            
            const topMaterial = new THREE.MeshBasicMaterial({
                color: layerItem.color || 0x3498db,
                transparent: true,
                opacity: isCurrentItem ? 0.9 : 0.4
            });
            
            // 创建一个平面来表示顶视图中的物品
            const planeGeometry = new THREE.PlaneGeometry(layerItem.width, layerItem.depth);
            const plane = new THREE.Mesh(planeGeometry, topMaterial);
            
            // 旋转使其平躺在XZ平面上
            plane.rotation.x = -Math.PI / 2;
            
            // 定位在物品XZ坐标的中心
            plane.position.set(
                layerItem.x + layerItem.width / 2,
                layerItem.y + 0.01, // 略高于物品表面，避免Z-fighting
                layerItem.z + layerItem.depth / 2
            );
            
            plane.userData = {
                itemId: layerItem.id,
                originalColor: layerItem.color || 0x3498db,
                isItemMesh: true,
                layerY: layerItem.y
            };
            
            // 添加轮廓
            const outlineGeometry = new THREE.EdgesGeometry(planeGeometry);
            const outlineMaterial = new THREE.LineBasicMaterial({ 
                color: isCurrentItem ? 0x000000 : 0x666666,
                linewidth: isCurrentItem ? 2 : 1
            });
            const outline = new THREE.LineSegments(outlineGeometry, outlineMaterial);
            plane.add(outline);
            
            // 添加物品ID标签
            const loader = new FontLoader();
            loader.load(
                'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
                (font) => {
                    const textGeometry = new TextGeometry(layerItem.id.replace('item', ''), {
                        font: font,
                        size: 0.2,
                        height: 0.01,
                    });
                    const textMaterial = new THREE.MeshBasicMaterial({ 
                        color: isCurrentItem ? 0x000000 : 0x444444 
                    });
                    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
                    
                    // 计算并居中文本
                    textGeometry.computeBoundingBox();
                    const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
                    
                    // 将文本定位在物品中心
                    textMesh.position.set(
                        -textWidth / 2,
                        0.05, // 稍微高于平面
                        0
                    );
                    textMesh.rotation.x = Math.PI / 2;
                    plane.add(textMesh);
                }
            );
            
            sceneTop.add(plane);
        });
        
        // 如果这是一个新放置的物品，添加到已放置物品列表中
        if (!isItemPlaced) {
            setPlacedItems(prev => [...prev, item]);
        }
    }, [placedItems, itemList, currentLayerY]);

    // 初始化Three.js场景 - 现在创建两个场景：3D视图和顶视图
    useEffect(() => {
        if (!mount3DRef.current || !mountTopViewRef.current) return;

        // 清除两个场景
        if (scene3DRef.current) {
            while(scene3DRef.current.children.length > 0) { 
                scene3DRef.current.remove(scene3DRef.current.children[0]); 
            }
        }
        
        if (sceneTopViewRef.current) {
            while(sceneTopViewRef.current.children.length > 0) { 
                sceneTopViewRef.current.remove(sceneTopViewRef.current.children[0]); 
            }
        }

        // 1. 设置3D视图
        const mount3DNode = mount3DRef.current;
        const scene3D = new THREE.Scene();
        scene3D.background = new THREE.Color(0xf0f0f0);
        scene3DRef.current = scene3D;

        const modelGroup3D = new THREE.Group();
        scene3D.add(modelGroup3D);
        scene3D.modelGroup = modelGroup3D;

        const camera3D = new THREE.PerspectiveCamera(
            75, 
            mount3DNode.clientWidth / mount3DNode.clientHeight, 
            0.1, 
            1000
        );
        camera3D.position.set(15, 10, 15);
        camera3D.lookAt(0, 0, 0);
        camera3DRef.current = camera3D;

        if (!renderer3DRef.current) {
            const renderer3D = new THREE.WebGLRenderer({ antialias: true });
            renderer3D.setSize(mount3DNode.clientWidth, mount3DNode.clientHeight);
            mount3DNode.appendChild(renderer3D.domElement);
            renderer3DRef.current = renderer3D;
        }

        // 添加3D视图的坐标轴和网格
        const axisLength3D = Math.max(spaceSize.x, spaceSize.y, spaceSize.z);
        createThickAxis(scene3D, spaceSize, false);
        addAxisLabels(scene3D, axisLength3D);

        // 创建3D视图的光源组
        const lightGroup3D = new THREE.Group();
        scene3D.add(lightGroup3D);
        scene3D.lightGroup = lightGroup3D;

        // 添加3D视图的光源
        const light3D = new THREE.DirectionalLight(0xffffff, 1);
        light3D.position.set(1, 1, 1);
        lightGroup3D.add(light3D);
        lightGroup3D.add(new THREE.AmbientLight(0x404040));

        // 2. 设置顶视图
        const mountTopViewNode = mountTopViewRef.current;
        const sceneTopView = new THREE.Scene();
        sceneTopView.background = new THREE.Color(0xf0f0f0);
        sceneTopViewRef.current = sceneTopView;

        // 为顶视图创建正交相机(顶视图)
        const aspectRatio = mountTopViewNode.clientWidth / mountTopViewNode.clientHeight;
        const viewSize = Math.max(spaceSize.x, spaceSize.z) * 3;  // 确保完全可见 

        const cameraTopView = new THREE.OrthographicCamera(
            -viewSize * aspectRatio / 2,
            viewSize * aspectRatio / 2,
            viewSize / 2,
            -viewSize / 2,
            0.1,
            1000
        );
        // 将相机放置在正上方
        cameraTopView.position.set(spaceSize.x / 2, spaceSize.y * 5, spaceSize.z / 2);
        console.log('Top view camera position:', cameraTopView.position);

        // 设置相机观察目标点 - 看向空间中心底部
        cameraTopView.lookAt(spaceSize.x / 2, 0, spaceSize.z / 2);
        // 设置相机的up方向 - 确保顶视图方向正确
        cameraTopView.up.set(0, 0, -1);

        cameraTopViewRef.current = cameraTopView;

        if (!rendererTopViewRef.current) {
            const rendererTopView = new THREE.WebGLRenderer({ antialias: true });
            rendererTopView.setSize(mountTopViewNode.clientWidth, mountTopViewNode.clientHeight);
            mountTopViewNode.appendChild(rendererTopView.domElement);
            rendererTopViewRef.current = rendererTopView;
        }

        // 为顶视图添加基本的网格和坐标轴
        const gridTopView = new THREE.GridHelper(
            Math.max(spaceSize.x, spaceSize.z), 
            Math.max(spaceSize.x, spaceSize.z), 
            0x000000, 
            0x555555
        );
        // 不需要旋转网格，因为我们是从上方直接看下去
        gridTopView.position.set(spaceSize.x / 2, 0, spaceSize.z / 2);
        sceneTopView.add(gridTopView);

        // 添加空间边界轮廓以使其更清晰
        const spaceOutlineGeometry = new THREE.BufferGeometry();
        const spaceVertices = [
            // 底部矩形
            0, 0, 0,  spaceSize.x, 0, 0,
            spaceSize.x, 0, 0,  spaceSize.x, 0, spaceSize.z,
            spaceSize.x, 0, spaceSize.z,  0, 0, spaceSize.z,
            0, 0, spaceSize.z,  0, 0, 0
        ];
        spaceOutlineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(spaceVertices, 3));
        const spaceOutlineMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff, linewidth: 2 });
        const spaceOutline = new THREE.LineSegments(spaceOutlineGeometry, spaceOutlineMaterial);
        sceneTopView.add(spaceOutline);

        // 为顶视图添加光源
        const lightTopView = new THREE.DirectionalLight(0xffffff, 1);
        lightTopView.position.set(0, 1, 0);
        sceneTopView.add(lightTopView);
        sceneTopView.add(new THREE.AmbientLight(0x404040));

        // 添加事件监听器
        window.addEventListener('resize', handleResize);
        renderer3DRef.current.domElement.addEventListener('mousedown', handleMouseDown);
        renderer3DRef.current.domElement.addEventListener('wheel', handleWheel, { passive: false });
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('mousemove', handleMouseMove);

        // 3D视图的动画循环
        const animate3D = () => {
            frameId3DRef.current = requestAnimationFrame(animate3D);
            renderer3DRef.current.render(scene3D, camera3D);
        };
        animate3D();

        // 顶视图的动画循环
        const animateTopView = () => {
            frameIdTopViewRef.current = requestAnimationFrame(animateTopView);
            rendererTopViewRef.current.render(sceneTopView, cameraTopView);
        };
        animateTopView();

        // 清理函数
        return () => {
            if (frameId3DRef.current) {
                cancelAnimationFrame(frameId3DRef.current);
            }
            
            if (frameIdTopViewRef.current) {
                cancelAnimationFrame(frameIdTopViewRef.current);
            }
            
            window.removeEventListener('resize', handleResize);
            renderer3DRef.current.domElement.removeEventListener('mousedown', handleMouseDown);
            renderer3DRef.current.domElement.removeEventListener('wheel', handleWheel);
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

    // 处理Next Item按钮点击
    const handleNextItem = () => {
        const nextIndex = currentItemIndex + 1;
        if (nextIndex < itemList.length) {
            setCurrentItemIndex(nextIndex);
            const nextItem = itemList[nextIndex];
            setCurrentLayerY(nextItem.y); // 更新当前层级
            addOrHighlightItem(nextItem);
        }
    };

    // 处理Previous Item按钮点击
    const handlePreviousItem = () => {
        const prevIndex = currentItemIndex - 1;
        if (prevIndex >= 0) {
            setCurrentItemIndex(prevIndex);
            const prevItem = itemList[prevIndex];
            setCurrentLayerY(prevItem.y); // 更新当前层级
            addOrHighlightItem(prevItem);
        }
    };

    // 处理从列表中选择物品
    const handleSelectItem = (item, index) => {
        setCurrentItemIndex(index);
        setCurrentLayerY(item.y); // 更新当前层级
        addOrHighlightItem(item);
    };
    
    // 处理刷新按钮点击
    const handleRefresh = () => {
        if (currentUser && currentUser.id) {
            fetchWorkerTasks(currentUser.id);
        }
    };

    // 格式化日期显示
    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleString();
        } catch (e) {
            return dateString;
        }
    };

    // 获取当前选中的物品
    const currentItem = currentItemIndex >= 0 && currentItemIndex < itemList.length 
        ? itemList[currentItemIndex] 
        : null;

    return (
        <Box sx={{ 
            p: 0, 
            bgcolor: '#f5f5f5', 
            minHeight: '100vh', 
            position: 'relative',
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
                <Paper elevation={3} sx={{ 
                    p: 2, 
                    mb: 2, 
                    borderRadius: 1,
                    maxHeight: '400px',  // 限制最大高度
                    overflow: 'auto'     // 内容过多时可滚动
                }}>
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
                <Box sx={{display: 'flex', flexDirection: 'column', pb: 2}}>
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
                
                    {/* 3D View, Top View and Item List */}
                    <Box sx={{ 
                        px: 2,
                        pb: 1,
                        display: 'flex'
                    }}>
                        <Grid container spacing={2} sx={{ height: { xs: 'auto', md: '500px' } }}>
                            {/* 3D View */}
                            <Grid item xs={12} md={4} sx={{ height: { xs: '400px', md: '100%' }, display: 'flex' }}>
                                <Paper 
                                    ref={mount3DContainerRef}
                                    elevation={3} 
                                    sx={{ 
                                        p: 1,
                                        width: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        bgcolor: '#fff',
                                        borderRadius: 1,
                                        position: 'relative', // 为全屏按钮添加定位上下文
                                        ...(isFullScreen && {
                                            position: 'fixed',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            zIndex: 9999,
                                            width: '100vw',
                                            height: '100vh',
                                            borderRadius: 0,
                                        })
                                    }}
                                >
                                    <Typography variant="subtitle1" align="center" sx={{ mb: 1, flexShrink: 0 }}>
                                        3D View - Item Configuration
                                    </Typography>
                                    <Box 
                                        ref={mount3DRef} 
                                        sx={{ 
                                            width: '100%', 
                                            flex: 1,
                                            borderRadius: 1,
                                            overflow: 'hidden' 
                                        }}
                                    />
                                    
                                    {/* 全屏按钮 */}
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            bottom: 16,
                                            right: 16,
                                            zIndex: 9999,
                                        }}
                                    >
                                        <Button
                                            variant="contained"
                                            size="small"
                                            onClick={toggleFullScreen}
                                            sx={{
                                                minWidth: 'auto',
                                                p: 1,
                                                bgcolor: 'rgba(0, 0, 0, 0.6)',
                                                color: 'white',
                                                '&:hover': {
                                                    bgcolor: 'rgba(0, 0, 0, 0.8)'
                                                }
                                            }}
                                        >
                                            {isFullScreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                                        </Button>
                                    </Box>
                                </Paper>
                            </Grid>
                            
                            {/* Top View - 只在非全屏模式下显示 */}
                            {!isFullScreen && (
                                <Grid item xs={12} md={4} sx={{ height: { xs: '400px', md: '100%' }, display: 'flex' }}>
                                    <Paper 
                                        elevation={3} 
                                        sx={{ 
                                            p: 1, 
                                            width: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            bgcolor: '#fff',
                                            borderRadius: 1,
                                        }}
                                    >
                                        <Typography variant="subtitle1" align="center" sx={{ mb: 1, flexShrink: 0 }}>
                                            Top View - Current Layer (Y: {currentLayerY.toFixed(1)})
                                        </Typography>
                                        <Box 
                                            ref={mountTopViewRef} 
                                            sx={{ 
                                                width: '100%', 
                                                flex: 1,
                                                borderRadius: 1,
                                                overflow: 'hidden' 
                                            }}
                                        />
                                    </Paper>
                                </Grid>
                            )}
                            
                            {/* Item List - 只在非全屏模式下显示 */}
                            {!isFullScreen && (
                                <Grid item xs={12} md={4} sx={{ height: { xs: 'auto', md: '100%' }, display: 'flex' }}>
                                    <Paper 
                                        elevation={3} 
                                        sx={{ 
                                            p: 1, 
                                            width: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            bgcolor: '#fff',
                                            borderRadius: 1,
                                        }}
                                    >
                                        <Typography variant="subtitle1" align="center" sx={{ mb: 1, flexShrink: 0 }}>
                                            List of Items ({itemList.length})
                                        </Typography>
                                        <Box
                                            ref={listContainerRef}
                                            sx={{ 
                                                overflow: 'auto', 
                                                flex: 1,
                                                borderRadius: 1,
                                                maxHeight: { xs: '300px', md: 'calc(100% - 80px)' },
                                            }}
                                        >
                                            <List disablePadding>
                                                {itemList.length === 0 ? (
                                                    <ListItem>
                                                        <ListItemText primary="No items in this task" />
                                                    </ListItem>
                                                ) : (
                                                    itemList.map((item, index) => (
                                                        <React.Fragment key={item.id}>
                                                            <ListItem
                                                                ref={el => itemRefs.current[index] = el}
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

                                        {/* 导航按钮 - 位于列表下方 */}
                                        <Box sx={{ 
                                            mt: 1,
                                            pt: 1,
                                            borderTop: '1px solid rgba(0, 0, 0, 0.12)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            <Stack 
                                                direction="row" 
                                                spacing={2} 
                                                justifyContent="space-between" 
                                                sx={{ width: '100%' }}
                                            >
                                                <Button
                                                    variant="outlined"
                                                    startIcon={<PreviousIcon />}
                                                    onClick={handlePreviousItem}
                                                    disabled={currentItemIndex <= 0 || itemList.length === 0}
                                                    size="small"
                                                    sx={{ flex: 1 }}
                                                >
                                                    Previous
                                                </Button>
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    endIcon={<NextIcon />}
                                                    onClick={handleNextItem}
                                                    disabled={currentItemIndex >= itemList.length - 1 || itemList.length === 0}
                                                    size="small"
                                                    sx={{ flex: 1 }}
                                                >
                                                    Next
                                                </Button>
                                            </Stack>
                                        </Box>
                                    </Paper>
                                </Grid>
                            )}
                        </Grid>
                    </Box>

                    {/* Item Details Section - 只在非全屏模式下显示 */}
                    {!isFullScreen && (
                        <Box sx={{ p: 2, pt: 1, order: 5 }}>
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
                                            Select an item from the list above or use the navigation buttons to see item details.
                                        </Typography>
                                    </Box>
                                )}
                            </Paper>
                        </Box>
                    )}
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