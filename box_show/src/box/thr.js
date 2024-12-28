import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';

// MUI Components
import { 
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Button,
    Card,
    CardContent,
    Slider,
    Tab,
    Tabs,
    TextField,
    Typography,
    Box,
} from '@mui/material';

// MUI Icons

import {
    ExpandMore as ExpandMoreIcon,
    Settings as SettingsIcon,
    Fullscreen as FullscreenIcon,
    FullscreenExit as FullscreenExitIcon,
    // Close as CloseIcon,
    ViewInAr as ViewInArIcon,
} from '@mui/icons-material';



const ThreeScene = () => {
    // --- Refs ---
    const mountRef = useRef(null);
    const sceneRef = useRef(null);
    const rendererRef = useRef(null);
    const frameIdRef = useRef(null);
    const cameraRef = useRef(null);
    const isMouseDown = useRef(false);
    const mousePosition = useRef({ x: 0, y: 0 });
    const cameraRotation = useRef({ MuiOutlinedInputx: 0, y: 0 });
    const toggleFullScreenRef = useRef(null);
    const textFieldStyle = {
        '& .MuiInputBase-input': {
            color: '#000',  // 文本颜色
        },
        '& .MuiOutlinedInput-root': {
            backgroundColor: 'white',  // 输入框背景色
        }
    };
    
    // --- State ---
    const [coordinates, setCoordinates] = useState({ x: 0, y: 0, z: 0 });
    const [dimensions, setDimensions] = useState({ width: 1, height: 1, depth: 1 });
    const [cubes, setCubes] = useState([]);
    const [spaceSize, setSpaceSize] = useState({ x: 10, y: 10, z: 10 });
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [tabValue, setTabValue] = useState(0);
    const [interactionMode, setInteractionMode] = useState(null); // null, 'layer', 'model'


    // --- Constants ---
    const colorSet = new Set();
    const isIOS = /iPhone|iPad/.test(navigator.userAgent);
    const [viewMode, setViewMode] = useState('free'); // 'free', 'front', 'side', 'top'
    const [layers, setLayers] = useState([]); // 存储每一层的模型
    const [currentLayer, setCurrentLayer] = useState(-1); // -1 表示不高亮任何层
    const [currentModelIndex, setCurrentModelIndex] = useState(-1); // -1 表示不高亮任何模型

      // 辅助函数
    const getRandomColor = () => {
        let color;
        do {
        color = Math.floor(Math.random() * 16777215).toString(16);
        } while (colorSet.has(color));
        colorSet.add(color);
        return `#${color}`;
    };

    const isSpaceAvailable = (newCube) => {
        for (let cube of cubes) {
            if (
            newCube.x < cube.x + cube.width &&
            newCube.x + newCube.width > cube.x &&
            newCube.y < cube.y + cube.height &&
            newCube.y + newCube.height > cube.y &&
            newCube.z < cube.z + cube.depth &&
            newCube.z + newCube.depth > cube.z
            ) {
                return false;
            }
        }
        return true;
    };

    const handleResize = useCallback(() => {
        if (rendererRef.current && mountRef.current && cameraRef.current) {
            const width = mountRef.current.clientWidth;
            const height = mountRef.current.clientHeight;
            rendererRef.current.setSize(width, height, true);
            cameraRef.current.aspect = width / height;
            cameraRef.current.updateProjectionMatrix();
        }
    }, [rendererRef, mountRef, cameraRef]);

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
    
    const addTicks = useCallback((scene, axis, length, newSpaceSize) => {
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
                height: 0.05,
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


    const createThickAxis = useCallback((scene, spaceSize, onlyAxis = false) => {
        // 清除旧的轴线、网格和标签
        scene.children = scene.children.filter(child => 
            !(child instanceof THREE.Mesh && child.geometry?.type === 'CylinderGeometry') && // 移除轴线
            !(child === scene.gridGroup) && // 移除网格
            !(child instanceof THREE.Line) // 移除刻度线
        );
    
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

    
    const addAxisLabels = useCallback((scene, length) => {
        // 只清除文本标签，不清除其他内容
        scene.children = scene.children.filter(child => 
            !(child.type === 'Mesh' && child.geometry?.type === 'TextGeometry')
        );
        const loader = new FontLoader();
        loader.load(
            'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
            (font) => {
                const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
                
                ['Width (X)', 'Height (Y)', 'Depth (Z)'].forEach((label, index) => {
                    const textGeometry = new TextGeometry(label, {
                        font: font,
                        size: 0.5,
                        height: 0.1,
                    });
                    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
                    
                    switch(index) {
                        case 0: // X轴
                            textMesh.position.set(length + 0.5, 0, 0);
                            break;
                        case 1: // Y轴
                            textMesh.position.set(0, length + 0.5, 0);
                            break;
                        case 2: // Z轴
                            textMesh.position.set(0, 0, length + 0.5);
                            break;
                        default:
                            break; // 添加默认情况
                    }
                    
                    scene.add(textMesh);
                });
            }
        );
    }, []);

    // 然后修改 handleTouchMove
    const handleTouchMove = useCallback((e) => {
        e.preventDefault();

        // iOS 设备的滑动退出处理
        if (isIOS && isFullScreen) {
            const deltaY = e.touches[0].clientY - mousePosition.current.y;
            const threshold = window.innerHeight / 4;
            console.log('Delta Y:', deltaY, 'Threshold:', threshold);
            
            if (deltaY > threshold) {
                // 使用 ref 调用 toggleFullScreen
                toggleFullScreenRef.current?.();
                return;
            }
        }
        
        if (!cameraRef.current || !isMouseDown.current) return;
        
        const camera = cameraRef.current;

        if (e.touches.length === 2) {
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const currentDistance = Math.sqrt(
                Math.pow(touch2.clientX - touch1.clientX, 2) +
                Math.pow(touch2.clientY - touch1.clientY, 2)
            );

            if (mousePosition.current.initialPinchDistance) {
                const scale = currentDistance / mousePosition.current.initialPinchDistance;
                const zoomSpeed = 0.5;
                const radius = camera.position.length();
                const newRadius = radius * (1 + (1 - scale) * zoomSpeed);

                const minRadius = 5;
                const maxRadius = 50;
                if (newRadius >= minRadius && newRadius <= maxRadius) {
                    const scaleFactor = newRadius / radius;
                    camera.position.multiplyScalar(scaleFactor);
                }
                camera.lookAt(0, 0, 0);
            }
            mousePosition.current.initialPinchDistance = currentDistance;
        } else if (e.touches.length === 1) {
            const deltaX = e.touches[0].clientX - mousePosition.current.x;
            const deltaY = e.touches[0].clientY - mousePosition.current.y;

            cameraRotation.current.x += deltaY * 0.01;
            cameraRotation.current.y += deltaX * 0.01;

            const radius = camera.position.length();
            camera.position.x = radius * Math.cos(cameraRotation.current.y) * Math.cos(cameraRotation.current.x);
            camera.position.y = radius * Math.sin(cameraRotation.current.x);
            camera.position.z = radius * Math.sin(cameraRotation.current.y) * Math.cos(cameraRotation.current.x);
            
            camera.lookAt(0, 0, 0);
            
            mousePosition.current = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };
        }
    }, [isIOS, isFullScreen]);


    // 修改 handleFullScreen 函数
    const toggleFullScreen = useCallback(async () => {
        try {
            if (!isFullScreen) {
                setIsFullScreen(true);
                if (isIOS) {
                    if (mountRef.current) {
                        mountRef.current.style.position = "fixed";
                        mountRef.current.style.top = "0";
                        mountRef.current.style.left = "0";
                        mountRef.current.style.width = "100vw";
                        mountRef.current.style.height = "100vh";
                        mountRef.current.style.zIndex = "9999";
                        mountRef.current.style.backgroundColor = "#f0f0f0";

                        mountRef.current.addEventListener('touchmove', handleTouchMove, { passive: false });
                    }
                } else {
                    if (mountRef.current?.requestFullscreen) {
                        await mountRef.current.requestFullscreen();
                    } else if (mountRef.current?.webkitRequestFullscreen) {
                        await mountRef.current.webkitRequestFullscreen();
                    }
                }
            } else {
                setIsFullScreen(false);
                if (isIOS) {
                    if (mountRef.current) {
                        mountRef.current.style.position = "";
                        mountRef.current.style.top = "";
                        mountRef.current.style.left = "";
                        mountRef.current.style.width = "";
                        mountRef.current.style.height = "";
                        mountRef.current.style.zIndex = "";

                        mountRef.current.removeEventListener('touchmove', handleTouchMove);
                    }
                } else {
                    if (document.exitFullscreen) {
                        await document.exitFullscreen();
                    } else if (document.webkitExitFullscreen) {
                        await document.webkitExitFullscreen();
                    }
                }
            }

            // 无论是进入还是退出全屏，都延迟执行重绘操作
            setTimeout(() => {
                handleResize();
                if (sceneRef.current) {
                    const scene = sceneRef.current;
                    // 清除现有的轴线和标签
                    scene.children = scene.children.filter(child => 
                        !(child instanceof THREE.Line) && 
                        !(child instanceof THREE.Mesh && child.geometry?.type === 'TextGeometry')
                    );
                    // 重新创建轴线和标签
                    createThickAxis(scene, spaceSize, false);
                    addAxisLabels(scene, Math.max(spaceSize.x, spaceSize.y, spaceSize.z));
                }
            }, 100);
        } catch (err) {
            console.error("Error toggling fullscreen:", err);
        }
    }, [isFullScreen, isIOS, handleTouchMove, handleResize, spaceSize, createThickAxis, addAxisLabels]);

    const calculateLayers = useCallback(() => {
        if (cubes.length === 0) {
            setLayers([]); // 如果没有立方体，就设置为空数组
            return;
        }
    
        const sortedCubes = [...cubes].sort((a, b) => a.y - b.y);
        const layerMap = new Map(); // 用于存储每个立方体的层级
        
        // 第一步：计算每个立方体的层级
        sortedCubes.forEach(cube => {
            let maxLayerBelow = -1; // 默认为-1，表示底层
    
            // 检查当前立方体下面的所有立方体
            sortedCubes.forEach(otherCube => {
                if (cube !== otherCube && 
                    otherCube.y + otherCube.height <= cube.y && // 在当前立方体下面
                    cube.x < otherCube.x + otherCube.width &&
                    cube.x + cube.width > otherCube.x &&
                    cube.z < otherCube.z + otherCube.depth &&
                    cube.z + cube.depth > otherCube.z) {
                    // 找到下方立方体的层级，取最大值加1
                    const lowerCubeLayer = layerMap.get(otherCube) || 0;
                    maxLayerBelow = Math.max(maxLayerBelow, lowerCubeLayer);
                }
            });
    
            // 当前立方体的层级是下方最高层级+1
            layerMap.set(cube, maxLayerBelow + 1);
        });
    
        // 第二步：根据层级分组
        const maxLayer = Math.max(...Array.from(layerMap.values()));
        const newLayers = Array(maxLayer + 1).fill(null).map(() => []);
        
        sortedCubes.forEach(cube => {
            const layer = layerMap.get(cube);
            newLayers[layer].push(cube);
        });
    
        setLayers(newLayers);
    }, [cubes]);

    // 添加新的 useEffect 来更新 ref
    useEffect(() => {
        toggleFullScreenRef.current = toggleFullScreen;
    }, [toggleFullScreen]);


    // --- Event Handlers ---
    const handleMouseDown = useCallback((e) => {
        isMouseDown.current = true;
        mousePosition.current = {
            x: e.clientX,
            y: e.clientY
        };
    }, []);

    const handleMouseUp = useCallback(() => {
        isMouseDown.current = false;
    }, []);


    const handleMouseMove = useCallback((e) => {

        e.preventDefault();
        // iOS 设备的滑动退出处理
        if (isIOS && isFullScreen) {
            const deltaY = e.touches[0].clientY - mousePosition.current.y;
            // 降低退出阈值为屏幕高度的四分之一
            const threshold = window.innerHeight / 4;
            console.log('Delta Y:', deltaY, 'Threshold:', threshold); // 调试输出
            
            if (deltaY > threshold) {
                toggleFullScreen();
                return;
            }
        }

        if (!isMouseDown.current || !cameraRef.current) return;

        // 如果不是自由视角模式，第一次拖动时切换到自由模式
        if (viewMode !== 'free') {
            setViewMode('free');
            // 重要：重置相机的 up 向量为默认值
            cameraRef.current.up.set(0, 1, 0);
        }

    
        const deltaX = e.clientX - mousePosition.current.x;
        const deltaY = e.clientY - mousePosition.current.y;
    
        cameraRotation.current.x += deltaY * 0.01;
        cameraRotation.current.y += deltaX * 0.01;


        // 限制垂直旋转角度以避免翻转
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
    }, [isFullScreen, isIOS, toggleFullScreen, viewMode]);
    
    
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
        const minRadius = 5;
        const maxRadius = 50;
        
        if (newRadius >= minRadius && newRadius <= maxRadius) {
        const scale = newRadius / radius;
        camera.position.multiplyScalar(scale);
        camera.lookAt(0, 0, 0);
        }
    }, []);

    const handleTouchStart = useCallback((e) => {
        e.preventDefault();
        isMouseDown.current = true;
        
        if (e.touches.length === 2) {
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const distance = Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
                );
            
            mousePosition.current = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
                initialPinchDistance: distance
            };
            } else {
            mousePosition.current = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };
        }
    }, []);


    const handleTouchEnd = useCallback(() => {
        isMouseDown.current = false;
    }, []);


    const handleSpaceSizeChange = useCallback((dimension, value) => {
            const numValue = parseFloat(value);
            if (!isNaN(numValue) && numValue > 0) {
                setSpaceSize(prev => ({
                    ...prev,
                    [dimension]: numValue
                }));
        
                if (sceneRef.current && rendererRef.current && cameraRef.current) {
                    const camera = cameraRef.current;
                    const renderer = rendererRef.current;
                    
                    // 保存相机状态
                    const currentRotation = {
                        x: cameraRotation.current.x || 0,  // 添加默认值
                        y: cameraRotation.current.y || 0   // 添加默认值
                    };
                    const currentRadius = camera.position.length();
                    
                    // 更新坐标轴和标签
                    const axisLength = Math.max(
                        dimension === 'x' ? numValue : spaceSize.x,
                        dimension === 'y' ? numValue : spaceSize.y,
                        dimension === 'z' ? numValue : spaceSize.z
                    );

                    // 临时移除事件监听器
                    renderer.domElement.removeEventListener('mousedown', handleMouseDown);
                    renderer.domElement.removeEventListener('wheel', handleWheel);
                    renderer.domElement.removeEventListener('touchstart', handleTouchStart);
                    window.removeEventListener('mouseup', handleMouseUp);
                    window.removeEventListener('mousemove', handleMouseMove);
                    
                    // 清除和重建场景
                    while(sceneRef.current.children.length > 0) {
                        sceneRef.current.remove(sceneRef.current.children[0]);
                    }
                    
                    // 重新创建场景内容
                    const modelGroup = new THREE.Group();
                    sceneRef.current.add(modelGroup);
                    sceneRef.current.modelGroup = modelGroup;
                    
                    const lightGroup = new THREE.Group();
                    sceneRef.current.add(lightGroup);
                    const light = new THREE.DirectionalLight(0xffffff, 1);
                    light.position.set(1, 1, 1);
                    lightGroup.add(light);
                    lightGroup.add(new THREE.AmbientLight(0x404040));
                    sceneRef.current.lightGroup = lightGroup;
                    
                    createThickAxis(sceneRef.current, axisLength, false);
                    addAxisLabels(sceneRef.current, axisLength);
                    
                    // 恢复相机位置和旋转 - 这里使用默认视角
                    if (currentRotation.x === 0 && currentRotation.y === 0) {
                        // 如果是初始状态，使用默认的倾斜视角
                        camera.position.set(15, 10, 15);
                    } else {
                        // 否则使用保存的旋转状态
                        camera.position.x = currentRadius * Math.cos(currentRotation.y) * Math.cos(currentRotation.x);
                        camera.position.y = currentRadius * Math.sin(currentRotation.x);
                        camera.position.z = currentRadius * Math.sin(currentRotation.y) * Math.cos(currentRotation.x);
                    }
                    camera.lookAt(0, 0, 0);

                    // 重新绑定事件监听器
                    renderer.domElement.addEventListener('mousedown', handleMouseDown);
                    renderer.domElement.addEventListener('wheel', handleWheel, { passive: false });
                    renderer.domElement.addEventListener('touchstart', handleTouchStart, { passive: false });
                    window.addEventListener('mouseup', handleMouseUp);
                    window.addEventListener('mousemove', handleMouseMove);
                    
                    // 重新启动渲染循环
                    if (frameIdRef.current) {
                        cancelAnimationFrame(frameIdRef.current);
                    }
                    
                    const animate = () => {
                        frameIdRef.current = requestAnimationFrame(animate);
                        renderer.render(sceneRef.current, camera);
                    };
                    animate();
                }
            }
        }, [
            spaceSize, 
            createThickAxis, 
            addAxisLabels, 
            handleMouseDown, 
            handleMouseUp, 
            handleMouseMove, 
            handleWheel, 
            handleTouchStart
        ]);
    
    const handleCoordinateChange = useCallback((axis, value) => {
        const numValue = parseFloat(value) || 0;
        
        if (axis === 'x' && numValue + dimensions.width > spaceSize.x) return;
        if (axis === 'y' && numValue + dimensions.height > spaceSize.y) return;
        if (axis === 'z' && numValue + dimensions.depth > spaceSize.z) return;     
        if (numValue >= 0) {

            setCoordinates(prev => ({
            ...prev,
            [axis]: numValue
        
        }));
    }
    }, [dimensions, spaceSize]);
    
    const handleDimensionChange = useCallback((dimension, value) => {
        if (value === '' || value === '.' || value === '0.' || value.startsWith('0.')) {
            setDimensions(prev => ({
            ...prev,
            [dimension]: value
            }));
            return;
        }

        if (!/^[0-9]*\.?[0-9]*$/.test(value)) {
            return;
        }

        const numValue = parseFloat(value);
        
        if (!isNaN(numValue)) {
            if (dimension === 'width' && numValue > spaceSize.x) return;
            if (dimension === 'height' && numValue > spaceSize.y) return;
            if (dimension === 'depth' && numValue > spaceSize.z) return;
            if (numValue <= 0) return;
        }

        setDimensions(prev => ({
            ...prev,
            [dimension]: value
        }));
    }, [spaceSize]);



    // 修改视图切换函数
    const handleViewChange = useCallback((view) => {
        if (!cameraRef.current) return;

        const camera = cameraRef.current;
        const distance = Math.max(spaceSize.x, spaceSize.y, spaceSize.z) * 2;

        // 保存当前视图模式
        setViewMode(view);

        switch (view) {
            case 'front':
                camera.position.set(0, 0, distance);
                camera.up.set(0, 1, 0);
                break;
            case 'side':
                camera.position.set(distance, 0, 0);
                camera.up.set(0, 1, 0);
                break;
            case 'top':
                camera.position.set(0, distance, 0);
                camera.up.set(0, 0, -1);
                break;
            case 'free':
                // 恢复到默认的自由视角
                camera.position.set(15, 10, 15);
                camera.up.set(0, 1, 0);
                break;
            default:
                break;
        }

        // 重置旋转状态
        cameraRotation.current = { x: 0, y: 0 };
        camera.lookAt(0, 0, 0);

    }, [spaceSize]);



    // 修改处理全屏变化的 Effect
    useEffect(() => {
        const handleFullScreenChange = () => {
            const isCurrentlyFullScreen = !!document.fullscreenElement;
            setIsFullScreen(isCurrentlyFullScreen);
            
            // 在全屏状态变化时重新创建轴线和标签
            if (sceneRef.current) {
                const scene = sceneRef.current;
                setTimeout(() => {
                    handleResize();
                    // 清除现有的轴线和标签
                    scene.children = scene.children.filter(child => 
                        !(child instanceof THREE.Line) && 
                        !(child instanceof THREE.Mesh && child.geometry?.type === 'TextGeometry')
                    );
                    // 重新创建轴线和标签
                    createThickAxis(scene, spaceSize, false);
                    addAxisLabels(scene, Math.max(spaceSize.x, spaceSize.y, spaceSize.z));
                }, 100);
            }
        };
    
        document.addEventListener('fullscreenchange', handleFullScreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullScreenChange);
        
        return () => {
            document.removeEventListener('fullscreenchange', handleFullScreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullScreenChange);
        };
    }, [handleResize, createThickAxis, addAxisLabels, spaceSize]);


    // Main Scene Setup Effect
    useEffect(() => {
        if (!mountRef.current) return;

        const mountNode = mountRef.current; // 在 effect 中保存引用

        // Scene setup
        const scene = new THREE.Scene();
        sceneRef.current = scene;
        scene.background = new THREE.Color(0xf0f0f0);

        // Model group
        const modelGroup = new THREE.Group();
        scene.add(modelGroup);
        sceneRef.current.modelGroup = modelGroup;
        
        // Camera setup
        const camera = new THREE.PerspectiveCamera(75, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
        cameraRef.current = camera;
        camera.position.set(15, 10, 15);
        camera.lookAt(0, 0, 0);

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        rendererRef.current = renderer;
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        renderer.setSize(width, height);

        mountRef.current.appendChild(renderer.domElement);

        // Axis and labels
        const axisLength = Math.max(spaceSize.x, spaceSize.y, spaceSize.z);
        createThickAxis(scene, axisLength, false);
        addAxisLabels(scene, axisLength);

        // Lights
        const lightGroup = new THREE.Group();
        scene.add(lightGroup);
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(1, 1, 1);
        lightGroup.add(light);
        lightGroup.add(new THREE.AmbientLight(0x404040));
        sceneRef.current.lightGroup = lightGroup;

        // 首次渲染轴线和标签
        const initialAxisLength = Math.max(spaceSize.x, spaceSize.y, spaceSize.z);
        createThickAxis(scene, spaceSize, false);
        addAxisLabels(scene, initialAxisLength);

        // Animation loop
        const animate = () => {
        frameIdRef.current = requestAnimationFrame(animate);
        renderer.render(scene, camera);
        };
        animate();

        // Cleanup
        return () => {
            if (frameIdRef.current) {
                cancelAnimationFrame(frameIdRef.current);
            }
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
    // }, [createThickAxis, addAxisLabels, spaceSize.x, spaceSize.y, spaceSize.z]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    


    // Event Listeners Effect
    useEffect(() => {
        if (!rendererRef.current?.domElement) return;
        const renderer = rendererRef.current;

        // 添加滚轮事件监听
        renderer.domElement.addEventListener('wheel', handleWheel, { passive: false });
        
        // Add event listeners
        renderer.domElement.addEventListener('mousedown', handleMouseDown);
        renderer.domElement.addEventListener('touchstart', handleTouchStart, { passive: false });
        renderer.domElement.addEventListener('touchmove', handleTouchMove, { passive: false });
        renderer.domElement.addEventListener('touchend', handleTouchEnd);
        
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleTouchMove);
        window.addEventListener('touchend', handleTouchEnd);
        
        // Cleanup
        return () => {
        renderer.domElement.removeEventListener('mousedown', handleMouseDown);
        renderer.domElement.removeEventListener('touchstart', handleTouchStart);
        renderer.domElement.removeEventListener('touchmove', handleTouchMove);
        renderer.domElement.removeEventListener('touchend', handleTouchEnd);
        renderer.domElement.removeEventListener('wheel', handleWheel);

        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [
        handleWheel,
        handleMouseDown,
        handleMouseUp,
        handleMouseMove,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd
    ]);


    // 在这里添加新的 useEffect
    // 在组件挂载时添加全局触摸事件监听
    useEffect(() => {
        if (isIOS && isFullScreen) {
            const handleGlobalTouchMove = (e) => {
                if (e.touches.length === 1) {
                    handleTouchMove(e);
                }
            };
            
            document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
            
            return () => {
                document.removeEventListener('touchmove', handleGlobalTouchMove);
            };
        }
    }, [isIOS, isFullScreen, handleTouchMove]);


    // 添加新的 effect 来计算层级
    useEffect(() => {
        calculateLayers();
    }, [cubes, calculateLayers]);

    // 在 useEffect(() => { ... }, [coordinates, dimensions, cubes]) 中添加:
    useEffect(() => {
        if (!sceneRef.current) return;
    
        cubes.forEach((cube, index) => {
            if (cube.mesh) {
                // 更新位置
                cube.mesh.position.set(
                    cube.x + cube.width / 2,
                    cube.y + cube.height / 2,
                    cube.z + cube.depth / 2
                );
                // console.log(`Cube ${index}: x=${cube.x}, y=${cube.y}, z=${cube.z}`);
                // 更新透明度 - 双重条件：层级和序号
                const isInCurrentLayer = currentLayer === -1 || layers.findIndex(layer => layer.includes(cube)) === currentLayer;
                const isCurrentModel = currentModelIndex === -1 || currentModelIndex === index;
                // console.log(`Cube ${index}: isInCurrentLayer=${isInCurrentLayer}, isCurrentModel=${isCurrentModel}`);
                
                cube.mesh.material.opacity = isInCurrentLayer ? (isCurrentModel ? 0.8 : 0.3) : 0.3;
            }
        });
    }, [coordinates, dimensions, cubes, currentLayer, layers, currentModelIndex]);

    // 处理全屏变化
    useEffect(() => {
        if (!sceneRef.current || !rendererRef.current || !mountRef.current) return;
        
        const scene = sceneRef.current;
        
        // 改为 false，让网格始终显示
        createThickAxis(scene, spaceSize, false);
        addAxisLabels(scene, spaceSize);
        
        handleResize();
        
        if (cameraRef.current) {
            cameraRef.current.lookAt(0, 0, 0);
        }
    }, [isFullScreen, createThickAxis, addAxisLabels, spaceSize, handleResize]);


    useEffect(() => {
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [handleResize]);



    return (
        <>
            <Box sx={{ 
                display: 'flex', 
                height: '100vh',
                bgcolor: '#f5f5f5',
                position: 'relative'
            }}>

                {/* 左侧控制面板 */}
                <Box sx={{ 
                    position: 'absolute',  
                    top: 24,
                    left: 24,
                    width: 320,
                    zIndex: 999999,
                    border: '5px solid rgba(0, 0, 0, 0.4)',
                    bgcolor: 'white'
                }}>
                    <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
                        <Typography variant="h6">3D Scene Controls</Typography>
                    </Box>
                    {/* 所有已有内容 */}
                    <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                        {/* 空间设置面板 */}
                        <Accordion defaultExpanded>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <SettingsIcon sx={{ mr: 1 }} />
                                    <Typography>Space Settings</Typography>
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Box sx={{ '& > :not(style)': { mb: 2 } }}>
                                    <TextField
                                        sx={textFieldStyle}
                                        fullWidth
                                        label="Width (X)"
                                        type="number"
                                        value={spaceSize.x}
                                        onChange={(e) => handleSpaceSizeChange('x', e.target.value)}
                                        size="small"
                                    />
                                    <TextField
                                        sx={textFieldStyle}  // 直接使用样式常量
                                        fullWidth
                                        label="Height (Y)"
                                        type="number"
                                        value={spaceSize.y}
                                        onChange={(e) => handleSpaceSizeChange('y', e.target.value)}
                                        size="small"
                                    />
                                    <TextField
                                        sx={textFieldStyle}
                                        fullWidth
                                        label="Depth (Z)"
                                        type="number"
                                        value={spaceSize.z}
                                        onChange={(e) => handleSpaceSizeChange('z', e.target.value)}
                                        size="small"
                                    />
                                </Box>
                            </AccordionDetails>
                        </Accordion>

                        {/* 模型控制面板 */}
                        <Accordion sx={{ mt: 2 }} defaultExpanded>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <ViewInArIcon sx={{ mr: 1 }} />
                                        <Typography>Model Controls</Typography>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Tabs 
                                        value={tabValue} 
                                        onChange={(e, newValue) => setTabValue(newValue)}
                                        sx={{ mb: 2 }}
                                    >
                                        <Tab label="Position" />
                                        <Tab label="Size" />
                                    </Tabs>

                                    {tabValue === 0 && (
                                        <Box sx={{ '& > :not(style)': { mb: 2 } }}>
                                            <TextField
                                                sx={textFieldStyle}
                                                fullWidth
                                                label="X Position"
                                                type="number"
                                                value={coordinates.x}
                                                onChange={(e) => handleCoordinateChange('x', e.target.value)}
                                                size="small"
                                            />
                                            <TextField
                                                sx={textFieldStyle}
                                                fullWidth
                                                label="Y Position"
                                                type="number"
                                                value={coordinates.y}
                                                onChange={(e) => handleCoordinateChange('y', e.target.value)}
                                                size="small"
                                            />
                                            <TextField
                                                sx={textFieldStyle}
                                                fullWidth
                                                label="Z Position"
                                                type="number"
                                                value={coordinates.z}
                                                onChange={(e) => handleCoordinateChange('z', e.target.value)}
                                                size="small"
                                            />
                                        </Box>
                                    )}

                                    {tabValue === 1 && (
                                        <Box sx={{ '& > :not(style)': { mb: 2 } }}>
                                            <TextField
                                                sx={textFieldStyle}
                                                fullWidth
                                                label="Width"
                                                type="number"
                                                value={dimensions.width}
                                                onChange={(e) => handleDimensionChange('width', e.target.value)}
                                                size="small"
                                            />
                                            <TextField
                                                sx={textFieldStyle}
                                                fullWidth
                                                label="Height"
                                                type="number"
                                                value={dimensions.height}
                                                onChange={(e) => handleDimensionChange('height', e.target.value)}
                                                size="small"
                                            />
                                            <TextField
                                                sx={textFieldStyle}
                                                fullWidth
                                                label="Depth"
                                                type="number"
                                                value={dimensions.depth}
                                                onChange={(e) => handleDimensionChange('depth', e.target.value)}
                                                size="small"
                                            />
                                        </Box>
                                    )}

                                    <Button 
                                        variant="contained"
                                        fullWidth
                                        onClick={() => {
                                                    const newCube = {
                                                        x: coordinates.x,
                                                        y: coordinates.y,
                                                        z: coordinates.z,
                                                        width: dimensions.width,
                                                        height: dimensions.height,
                                                        depth: dimensions.depth,
                                                        color: getRandomColor(),
                                                    };

                                                    if (isSpaceAvailable(newCube)) {
                                                        setCubes((prev) => [...prev, newCube]);
                                                        const geometry = new THREE.BoxGeometry(
                                                            newCube.width,
                                                            newCube.height,
                                                            newCube.depth
                                                        );
                                                        const material = new THREE.MeshPhongMaterial({
                                                            color: newCube.color,
                                                            transparent: true,
                                                            opacity: (currentLayer === -1 || layers.length === 0) && 
                                                                    (currentModelIndex === -1 || currentModelIndex === cubes.length)
                                                                ? 0.8 
                                                                : 0.3
                                                        });
                                                        const cubeMesh = new THREE.Mesh(geometry, material);
                                                        cubeMesh.position.set(
                                                            newCube.x + newCube.width / 2,
                                                            newCube.y + newCube.height / 2,
                                                            newCube.z + newCube.depth / 2
                                                        );
                                                        sceneRef.current.modelGroup.add(cubeMesh);
                                                        newCube.mesh = cubeMesh;
                                                    } else {
                                                        alert("空间不足或与其他长方体冲突！");
                                                    }
                                                }}
                                            >
                                            Add Cube
                                    </Button>
                                </AccordionDetails>
                        </Accordion>
                    </Box>
                </Box>


                {/* 主渲染区域 */}
                <Box sx={{ flex: 1, position: 'relative' }}>

                    {/* Three.js 渲染容器 */}
                    <Box
                        ref={mountRef}
                        sx={{ 
                            width: '100%',
                            height: '100%',
                            bgcolor: 'grey.100'
                        }}
                    />

                    {/* 视图控制 */}
                    <Box sx={{
                        position: 'absolute',
                        bottom: '24px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: '4px',
                        bgcolor: 'rgba(0, 0, 0, 0.4)',
                        zIndex: 9999,           // 加个超大优先级
                        pointerEvents: 'auto',  // 确保可以点击
                        p: '4px',
                        borderRadius: '4px'
                        }}>

                        <Button
                            variant={viewMode === 'front' ? "contained" : "text"}
                            size="small"
                            onClick={() => handleViewChange('front')}
                            sx={{ color: 'white' }}
                        >
                            Front
                        </Button>
                        <Button
                            variant={viewMode === 'side' ? "contained" : "text"}
                            size="small"
                            onClick={() => handleViewChange('side')}
                            sx={{ color: 'white' }}
                        >
                            Side
                        </Button>
                        <Button
                            variant={viewMode === 'top' ? "contained" : "text"}
                            size="small"
                            onClick={() => handleViewChange('top')}
                            sx={{ color: 'white' }}
                        >
                            Top
                        </Button>
                        {viewMode !== 'free' && (
                            <Button
                                variant="contained"
                                size="small"
                                onClick={() => handleViewChange('free')}
                                color="primary"
                            >
                                Free View
                            </Button>
                        )}
                    </Box>



                    {/* 层级控制 */}
                    <Box sx={{
                        position: 'absolute',
                        // left: 24,
                        right: '24px',             // 固定到最右侧

                        top: '50%',
                        transform: 'translateY(-50%)',
                        bgcolor: 'rgba(0, 0, 0, 0.4)',
                        p: '6px',
                        borderRadius: '4px',
                        pointerEvents: interactionMode === 'model' ? 'none' : 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}>
                        <Button
                            size="small"
                            onClick={() => {
                                setCurrentLayer(-1);
                                setInteractionMode(null);
                            }}
                            sx={{
                                mb: 1,
                                color: 'white',
                                borderColor: 'white'
                            }}
                        >
                            Reset
                        </Button>
                        <Box sx={{ height: 192 }}>
                            <Slider
                                orientation="vertical"
                                min={-1}
                                max={layers.length - 1}
                                value={currentLayer}
                                onChange={(e, value) => {
                                    setCurrentLayer(value);
                                    if (value === -1) {
                                        setInteractionMode(null);
                                    } else {
                                        setInteractionMode('layer');
                                    }
                                    setCurrentModelIndex(-1);
                                }}
                                sx={{ 
                                    height: '100%',
                                    color: 'white',
                                    '& .MuiSlider-thumb': {
                                        bgcolor: 'white'
                                    }
                                }}
                            />
                        </Box>
                    </Box>

                    {/* 模型列表 */}
                    <Card sx={{
                        position: 'absolute',
                        right: '24px',
                        top: '24px',
                        width: '192px',
                        bgcolor: 'rgba(0, 0, 0, 0.4)',
                        pointerEvents: interactionMode === 'layer' ? 'none' : 'auto',
                        }}>
                        <CardContent>
                            <Typography variant="subtitle1" sx={{ color: 'white', mb: 1 }}>
                                Models
                            </Typography>
                            <Box sx={{ 
                                maxHeight: 192, 
                                overflow: 'auto',
                                '& > :not(:last-child)': { mb: 0.5 }
                                }}>
                            {cubes.map((cube, index) => (
                                <Button
                                    key={index}
                                    variant={currentModelIndex === index ? "contained" : "text"}
                                    size="small"
                                    onClick={() => {
                                        // console.log(`Clicked on Model ${index + 1}`);
                                        if (currentModelIndex === index) {
                                            // 第二次点击同一个 Model
                                            // alert(`再次点击了 model${index + 1}，将取消选中`);
                                            // console.log(`取消选中 model${index + 1}`);
                                            setCurrentModelIndex(-1);
                                            setInteractionMode(null);

                                        } else {
                                            // 第一次点击选中
                                            setCurrentModelIndex(index);
                                            setInteractionMode('model');
                                            setCurrentLayer(-1); // 取消层级选择
                                        }
                                    }}
                                    fullWidth
                                    sx={{ 
                                        justifyContent: 'flex-start',
                                        color: 'white'
                                    }}
                                >
                                    Model {index + 1}
                                </Button>
                            ))}
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
            </Box>

            {/* 全屏按钮 */}
            <Box
                sx={{
                    position: 'fixed',
                    bottom: 24,
                    right: 24,
                    zIndex: 999999
                }}
            >
                <Button
                    variant="outlined"
                    onClick={toggleFullScreen}
                    sx={{
                        minWidth: 'auto',
                        p: 1,
                        bgcolor: 'rgba(0, 0, 0, 0.4)',
                        color: 'white',
                        '&:hover': {
                            bgcolor: 'rgba(0, 0, 0, 0.6)'
                        }
                    }}
                >
                    {isFullScreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                </Button>
            </Box>
        </>
    );
};

export default ThreeScene;