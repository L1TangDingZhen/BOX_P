import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { Maximize2, X, Minimize2 } from 'lucide-react';

const ThreeScene = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const frameIdRef = useRef(null);
  
  const [coordinates, setCoordinates] = useState({ x: 0, y: 0, z: 0 });
  const [dimensions, setDimensions] = useState({ width: 1, height: 1, depth: 1 });
  const [cubes, setCubes] = useState([]); // 存储所有长方体
  const colorSet = new Set(); // 用于存储颜色，防止重复
  const [spaceSize, setSpaceSize] = useState({ x: 10, y: 10, z: 10 });

  const handleSpaceSizeChange = (dimension, value) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) { // 只要大于0即可
      setSpaceSize(prev => ({
        ...prev,
        [dimension]: numValue
      }));
      
      // 更新坐标系和网格，使用新的尺寸更新
      // if (sceneRef.current) {
      //   createThickAxis(sceneRef.current, spaceSize, isFullScreen);
      //   addAxisLabels(sceneRef.current, spaceSize);
      // }
      if (sceneRef.current) {
        const axisLength = Math.max(spaceSize.x, spaceSize.y, spaceSize.z);
        createThickAxis(sceneRef.current, axisLength, false);
        addAxisLabels(sceneRef.current, axisLength);
      }
    }
  };

  // const isIPhone = /iPhone/.test(navigator.userAgent);

  const cameraRef = useRef(null);
  // 随机生成颜色
  const getRandomColor = () => {
    let color;
    do {
      color = Math.floor(Math.random() * 16777215).toString(16);
    } while (colorSet.has(color));
    colorSet.add(color);
    return `#${color}`;
  };

  // 检查是否有空间放置新长方体
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
        return false; // 存在重叠
      }
    }
    return true;
  };
  const handleResize = () => {
    if (rendererRef.current && mountRef.current) {
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      rendererRef.current.setSize(width, height);
      if (cameraRef.current) {
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
      }
    }
  };


  // 添加滚轮事件处理函数
  const handleWheel = (e) => {
    const camera = cameraRef.current;
    if (!camera) return;

    const zoomSpeed = 0.1;
    const direction = e.deltaY > 0 ? 1 : -1;

    // 计算当前相机到原点的距离
    const radius = Math.sqrt(
      camera.position.x ** 2 + 
      camera.position.y ** 2 + 
      camera.position.z ** 2
    );

    // 计算新的半径（缩放后的距离）
    const newRadius = radius * (1 + direction * zoomSpeed);

    // 限制缩放范围
    const minRadius = 5;  // 最小距离
    const maxRadius = 50; // 最大距离
    if (newRadius < minRadius || newRadius > maxRadius) return;

    // 根据新半径更新相机位置
    const scale = newRadius / radius;
    camera.position.multiplyScalar(scale);
    camera.lookAt(0, 0, 0);
  };

  const isMouseDown = useRef(false);
  const mousePosition = useRef({ x: 0, y: 0 });
  const cameraRotation = useRef({ x: 0, y: 0 });

  const [isFullScreen, setIsFullScreen] = useState(false);

  const toggleFullScreen = async () => {
    setIsFullScreen((prev) => !prev);
  
    // 检查是否是 iOS 设备
    const isIOS = /iPhone/.test(navigator.userAgent); // 只针对 iPhone，不包括 iPad
    
    try {
      if (!isFullScreen) {
        if (isIOS) {
          // iPhone 设备使用特殊处理
          if (mountRef.current) {
            mountRef.current.style.position = 'fixed';
            mountRef.current.style.top = '0';
            mountRef.current.style.left = '0';
            mountRef.current.style.width = '100vw';
            mountRef.current.style.height = '100vh';
            mountRef.current.style.zIndex = '9999';
            // 在这里添加退出全屏按钮
            const exitButton = document.createElement('button');
            exitButton.innerText = 'X';
            exitButton.style.position = 'fixed';
            exitButton.style.top = '20px';
            exitButton.style.left = '20px';
            exitButton.style.zIndex = '10000';
            exitButton.addEventListener('click', toggleFullScreen);
            mountRef.current.appendChild(exitButton);
  
            // 添加滑动退出的处理
            let touchStartY = 0;
            const handleFullscreenTouchStart = (e) => {
              touchStartY = e.touches[0].clientY;
            };
  
            const handleFullscreenTouchMove = (e) => {
              const touchY = e.touches[0].clientY;
              const deltaY = touchY - touchStartY;
  
              // 如果向下滑动超过 100px，退出全屏
              if (deltaY > 200) {
                toggleFullScreen();
                // 清除事件监听器
                mountRef.current.removeEventListener('touchstart', handleFullscreenTouchStart);
                mountRef.current.removeEventListener('touchmove', handleFullscreenTouchMove);
              }
            };
  
            mountRef.current.addEventListener('touchstart', handleFullscreenTouchStart);
            mountRef.current.addEventListener('touchmove', handleFullscreenTouchMove);
            // 退出全屏时移除按钮和事件监听器
            return () => {
              if (mountRef.current.contains(exitButton)) {
                mountRef.current.removeChild(exitButton);
              }
              mountRef.current.removeEventListener('touchstart', handleFullscreenTouchStart);
              mountRef.current.removeEventListener('touchmove', handleFullscreenTouchMove);
            };
          }
        } else {
          // 其他设备使用标准全屏 API
          if (mountRef.current.requestFullscreen) {
            await mountRef.current.requestFullscreen();
          } else if (mountRef.current.webkitRequestFullscreen) {
            await mountRef.current.webkitRequestFullscreen();
          }
        }
      } else {
        if (isIOS) {
          // iPhone 设备退出全屏
          if (mountRef.current) {
            mountRef.current.style.position = '';
            mountRef.current.style.top = '';
            mountRef.current.style.left = '';
            mountRef.current.style.width = '';
            mountRef.current.style.height = '';
            mountRef.current.style.zIndex = '';
          }
        } else {
          // 其他设备退出全屏
          if (document.exitFullscreen) {
            await document.exitFullscreen();
          } else if (document.webkitExitFullscreen) {
            await document.webkitExitFullscreen();
          }
        }
      }
      handleResize();
    } catch (err) {
      console.error('Error toggling fullscreen:', err);
    }
  };



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
          const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
          const textGeometry = new TextGeometry(i.toString(), {
            font: font,
            size: 0.3,
            height: 0.05,
          });

          const textMesh = new THREE.Mesh(textGeometry, textMaterial);
          if (axis === "x") textMesh.position.set(i, -0.5, 0);
          if (axis === "y") textMesh.position.set(-0.5, i, 0);
          if (axis === "z") textMesh.position.set(0, -0.5, i);
          scene.add(textMesh);
        }
      );
    }
  }, []);

  const createGrids = useCallback((scene, spaceSize, visible = true) => {
    const gridGroup = new THREE.Group();
    gridGroup.visible = visible;
    scene.add(gridGroup);
    
    const gridMaterial = new THREE.LineBasicMaterial({ color: 0x000000, opacity: 0.2, transparent: true });
    
    // XY平面（前面）网格
    const xyGeometry = new THREE.BufferGeometry();
    const xyVertices = [];
    // 垂直线
    for (let x = 0; x <= spaceSize.x; x++) {
      xyVertices.push(x, 0, 0);
      xyVertices.push(x, spaceSize.y, 0);
    }
    // 水平线
    for (let y = 0; y <= spaceSize.y; y++) {
      xyVertices.push(0, y, 0);
      xyVertices.push(spaceSize.x, y, 0);
    }
    xyGeometry.setAttribute('position', new THREE.Float32BufferAttribute(xyVertices, 3));
    const xyGrid = new THREE.LineSegments(xyGeometry, gridMaterial);
    gridGroup.add(xyGrid);

    // XZ平面（底部）网格
    const xzGeometry = new THREE.BufferGeometry();
    const xzVertices = [];
    // X方向的线
    for (let x = 0; x <= spaceSize.x; x++) {
      xzVertices.push(x, 0, 0);
      xzVertices.push(x, 0, spaceSize.z);
    }
    // Z方向的线
    for (let z = 0; z <= spaceSize.z; z++) {
      xzVertices.push(0, 0, z);
      xzVertices.push(spaceSize.x, 0, z);
    }
    xzGeometry.setAttribute('position', new THREE.Float32BufferAttribute(xzVertices, 3));
    const xzGrid = new THREE.LineSegments(xzGeometry, gridMaterial);
    gridGroup.add(xzGrid);

    // YZ平面（侧面）网格
    const yzGeometry = new THREE.BufferGeometry();
    const yzVertices = [];
    // Y方向的线
    for (let y = 0; y <= spaceSize.y; y++) {
      yzVertices.push(0, y, 0);
      yzVertices.push(0, y, spaceSize.z);
    }
    // Z方向的线
    for (let z = 0; z <= spaceSize.z; z++) {
      yzVertices.push(0, 0, z);
      yzVertices.push(0, spaceSize.y, z);
    }
    yzGeometry.setAttribute('position', new THREE.Float32BufferAttribute(yzVertices, 3));
    const yzGrid = new THREE.LineSegments(yzGeometry, gridMaterial);
    gridGroup.add(yzGrid);

    scene.gridGroup = gridGroup;
  }, []);


  const createThickAxis = useCallback((scene, length, onlyAxis = false) => {
    // 清空场景
  // while (scene.children.length > 0) {
  //   scene.remove(scene.children[0]);
  // }

  scene.children = scene.children.filter(child => 
    (child === scene.modelGroup) ||
    (child instanceof THREE.Light) || 
    (child === scene.lightGroup) ||
    (child.type === 'Mesh' && child.geometry.type === 'TextGeometry') || // 保留文字标签
    (child === scene.gridGroup) // 保留网格组
  );
  // scene.children.forEach((child) => {
  //   if (child !== scene.modelGroup && !(child instanceof THREE.Light) && child !== scene.lightGroup) {
  //     scene.remove(child);
  //   }
  // });
  const axisMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 }); // 黑色轴线

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

  createGrids(scene, spaceSize, !onlyAxis);

    // 添加刻度
    addTicks(scene, "x", spaceSize.x);
    addTicks(scene, "y", spaceSize.y);
    addTicks(scene, "z", spaceSize.z);
  }, [createGrids, addTicks, spaceSize]);



  const addAxisLabels = useCallback((scene, length) => {
    const loader = new FontLoader(); // 从 examples 加载的 FontLoader
    loader.load(
      'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
      (font) => {
        const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
  
        // X轴标签
        const xTextGeometry = new TextGeometry('Width (X)', {
          font: font,
          size: 0.5,
          height: 0.1,
        });
        const xText = new THREE.Mesh(xTextGeometry, textMaterial);
        xText.position.set(length + 0.5, 0, 0);
        scene.add(xText);
  
        // Y轴标签
        const yTextGeometry = new TextGeometry('Height (Y)', {
          font: font,
          size: 0.5,
          height: 0.1,
        });
        const yText = new THREE.Mesh(yTextGeometry, textMaterial);
        yText.position.set(0, length + 0.5, 0);
        scene.add(yText);
  
        // Z轴标签
        const zTextGeometry = new TextGeometry('Depth (Z)', {
          font: font,
          size: 0.5,
          height: 0.1,
        });
        const zText = new THREE.Mesh(zTextGeometry, textMaterial);
        zText.position.set(0, 0, length + 0.5);
        scene.add(zText);
      }
    );
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;

    
    const mountNode = mountRef.current; // 保存 mountRef.current 的值

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0xf0f0f0);

    // model group
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    // save model group to sceneRef
    sceneRef.current.modelGroup = modelGroup;
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current = renderer;


    // 使用父元素的尺寸初始化渲染器
    const width = mountNode.clientWidth;
    const height = mountNode.clientHeight;

    renderer.setSize(width, height);
    mountNode.appendChild(renderer.domElement);
    
    const axisLength = Math.max(spaceSize.x, spaceSize.y, spaceSize.z);
    createThickAxis(scene, axisLength, false);
    addAxisLabels(scene, axisLength);

    window.addEventListener('resize', handleResize);

    // 创建光源组
    const lightGroup = new THREE.Group();
    scene.add(lightGroup);

    // 添加定向光源到光源组
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 1, 1);
    lightGroup.add(light);

    // 添加环境光到光源组
    lightGroup.add(new THREE.AmbientLight(0x404040));

    // 保存光源组引用到场景
    sceneRef.current.lightGroup = lightGroup;

    // 设置相机初始位置
    camera.position.set(15, 10, 15);
    camera.lookAt(0, 0, 0);

    // 鼠标事件处理
    const handleMouseDown = (e) => {
      isMouseDown.current = true;
      mousePosition.current = {
        x: e.clientX,
        y: e.clientY
      };
    };

    const handleMouseUp = () => {
      isMouseDown.current = false;
    };

    const handleMouseMove = (e) => {
      if (!isMouseDown.current) return;

      const deltaX = e.clientX - mousePosition.current.x;
      const deltaY = e.clientY - mousePosition.current.y;

      cameraRotation.current.x += deltaY * 0.01;
      cameraRotation.current.y += deltaX * 0.01;

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
    };


    // 修改 touchstart 事件处理
    const handleTouchStart = (e) => {
      e.preventDefault(); // 阻止默认行为
      isMouseDown.current = true;
      
      // 处理双指触控
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
    };
      
    const handleTouchEnd = () => {
      isMouseDown.current = false;
    };
    


      // 修改 touchmove 事件处理
    const handleTouchMove = (e) => {
      e.preventDefault(); // 阻止默认行为
      if (!isMouseDown.current) return;

      // 处理双指缩放
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

          // 限制缩放范围
          const minRadius = 5;
          const maxRadius = 50;
          if (newRadius >= minRadius && newRadius <= maxRadius) {
            const scaleFactor = newRadius / radius;
            camera.position.multiplyScalar(scaleFactor);
          }
          camera.lookAt(0, 0, 0);
        }
        mousePosition.current.initialPinchDistance = currentDistance;
      } 
      // 处理单指旋转
      else if (e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - mousePosition.current.x;
        const deltaY = e.touches[0].clientY - mousePosition.current.y;


        // 灵敏度调整
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
    };
      

    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    renderer.domElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    renderer.domElement.addEventListener('touchend', handleTouchEnd);
    
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleTouchEnd); // 新增触摸事件
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove); // 新增触摸事件
    


    // Animation
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();


    // 添加滚轮事件监听
    const handleWheelWrapper = (e) => {
      e.preventDefault();
      handleWheel(e);
    };
    mountRef.current.addEventListener('wheel', handleWheelWrapper, { passive: false });

    // Cleanup
    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
      if (renderer.domElement) {
        renderer.domElement.removeEventListener('mousedown', handleMouseDown);
        renderer.domElement.removeEventListener('touchstart', handleTouchStart); // 移除触摸事件
      }

      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleTouchEnd); // 移除触摸事件
      
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove); // 移除触摸事件
      // mountRef.current?.removeEventListener('wheel', handleWheelWrapper);

      renderer.domElement.removeEventListener('touchstart', handleTouchStart);
      renderer.domElement.removeEventListener('touchmove', handleTouchMove);
      renderer.domElement.removeEventListener('touchend', handleTouchEnd);

      if (mountNode && renderer.domElement) { // 使用局部变量 mountNode
        mountNode.removeChild(renderer.domElement);
      }
      
      if (sceneRef.current) {
        sceneRef.current.clear();
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      // window.removeEventListener('resize', handleResize);
    };
  }, [createThickAxis, addAxisLabels, spaceSize.x, spaceSize.y, spaceSize.z]);


  // 更新长方体位置和大小
  useEffect(() => {
    if (!sceneRef.current) return;
  
    cubes.forEach((cube) => {
      if (cube.mesh) {
        cube.mesh.position.set(
          cube.x + cube.width / 2,
          cube.y + cube.height / 2,
          cube.z + cube.depth / 2
        );
      }
    });
  }, [coordinates, dimensions, cubes]);
  

  const handleCoordinateChange = (axis, value) => {
    const numValue = parseFloat(value) || 0;
    
    // 检查是否超出空间大小
    if (axis === 'x' && numValue + dimensions.width > spaceSize.x) return;
    if (axis === 'y' && numValue + dimensions.height > spaceSize.y) return;
    if (axis === 'z' && numValue + dimensions.depth > spaceSize.z) return;
  
    if (numValue >= 0) {
      setCoordinates(prev => ({
        ...prev,
        [axis]: numValue
      }));
    }
  };

  const handleDimensionChange = (dimension, value) => {
    // 允许空值
    if (value === '') {
      setDimensions(prev => ({
        ...prev,
        [dimension]: value
      }));
      return;
    }
  
    // 允许输入中间过程，比如 "0." 或者 "."
    if (value === '.' || value === '0.' || value.startsWith('0.')) {
      setDimensions(prev => ({
        ...prev,
        [dimension]: value
      }));
      return;
    }
  
    // 验证数字格式，允许 0.x 格式
    if (!/^[0-9]*\.?[0-9]*$/.test(value)) {
      return;
    }
  
    const numValue = parseFloat(value);
    
    // 检查数值范围（只在有实际数值时检查）
    if (!isNaN(numValue)) {
      // 检查是否超过空间大小
      if (dimension === 'width' && numValue > spaceSize.x) return;
      if (dimension === 'height' && numValue > spaceSize.y) return;
      if (dimension === 'depth' && numValue > spaceSize.z) return;
  
      if (numValue <= 0) return;
    }
  
    // 更新尺寸，保留原始输入值
    setDimensions(prev => ({
      ...prev,
      [dimension]: value
    }));
  };


  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
  
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullScreenChange);
    document.addEventListener('mozfullscreenchange', handleFullScreenChange);
    document.addEventListener('MSFullscreenChange', handleFullScreenChange);
  
    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullScreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullScreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullScreenChange);
    };
  }, []);


  useEffect(() => {
    if (!sceneRef.current || !rendererRef.current || !mountRef.current) return;
    
    const scene = sceneRef.current;
    
    // 使用空间实际尺寸而不是最大值
    createThickAxis(scene, spaceSize, !isFullScreen);
    addAxisLabels(scene, spaceSize);
    
    handleResize();
    
    if (cameraRef.current) {
      cameraRef.current.lookAt(0, 0, 0);
    }
  }, [isFullScreen, createThickAxis, addAxisLabels, spaceSize]);
  // }, [isFullScreen, createThickAxis, addAxisLabels, spaceSize.x, spaceSize.y, spaceSize.z]);



  

  return (
    
    <div className="w-full h-full flex">
      {/* 左侧控制面板 */}
      <div className="w-64 p-4 bg-gray-100">
        <h2 className="text-lg font-bold mb-4">参数控制</h2>
        <div className="space-y-6">
          {/* 在这里添加空间尺寸控制 */}
          <div>
            <h3 className="text-md font-semibold mb-2">空间尺寸</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-sm font-medium">X轴长度</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={spaceSize.x}
                  onChange={(e) => handleSpaceSizeChange('x', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Y轴长度</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={spaceSize.y}
                  onChange={(e) => handleSpaceSizeChange('y', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Z轴长度</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={spaceSize.z}
                  onChange={(e) => handleSpaceSizeChange('z', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
            </div>
          </div>


          {/* 起始位置控制 */}
          <div>
            <h3 className="text-md font-semibold mb-2">起始位置</h3>
            <div className="space-y-2">
              {/* X坐标输入 */}
              <div>
                <label className="block text-sm font-medium">Width (X)</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={coordinates.x}
                  onChange={(e) => handleCoordinateChange('x', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
              {/* Y坐标输入 */}
              <div>
                <label className="block text-sm font-medium">Height (Y)</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={coordinates.y}
                  onChange={(e) => handleCoordinateChange('y', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
              {/* Z坐标输入 */}
              <div>
                <label className="block text-sm font-medium">Depth (Z)</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={coordinates.z}
                  onChange={(e) => handleCoordinateChange('z', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
            </div>
          </div>
          
          {/* 长方体尺寸控制 */}
          <div>
            <h3 className="text-md font-semibold mb-2">长方体尺寸</h3>
            <div className="space-y-2">
              {/* Width输入 */}
              <div>
                <label className="block text-sm font-medium">Width</label>
                <input
                  type="number"
                  min="0.1"
                  max={spaceSize.x}
                  step="0.1"
                  value={dimensions.width}
                  onChange={(e) => handleDimensionChange('width', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
              {/* Height输入 */}
              <div>
                <label className="block text-sm font-medium">Height</label>
                <input
                  type="number"
                  min="0.1"
                  max={spaceSize.y}
                  step="0.1"
                  value={dimensions.height}
                  onChange={(e) => handleDimensionChange('height', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
              {/* Depth输入 */}
              <div>
                <label className="block text-sm font-medium">Depth</label>
                <input
                  type="number"
                  min="0.1"
                  max={spaceSize.z}
                  step="0.1"
                  value={dimensions.depth}
                  onChange={(e) => handleDimensionChange('depth', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
            </div>
          </div>
  
          {/* 添加长方体按钮 */}
          <button
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
                  opacity: 0.8,
                });
                const cubeMesh = new THREE.Mesh(geometry, material);
                cubeMesh.position.set(
                  newCube.x + newCube.width / 2,
                  newCube.y + newCube.height / 2,
                  newCube.z + newCube.depth / 2
                );

                // save mesh to cube object
                sceneRef.current.modelGroup.add(cubeMesh);
              } else {
                alert("空间不足或与其他长方体冲突！");
              }
            }}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded w-full"
          >
            添加长方体
          </button>
        </div>
      </div>
  
      {/* 右侧Three.js渲染区域 */}
      <div className="flex-1 relative">
        

        <button
          onClick={toggleFullScreen}
          className="absolute bottom-4 right-4 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded z-50 transition-all"
          >
          {isFullScreen ? (<Minimize2 className="w-6 h-6" />) : (<Maximize2 className="w-6 h-6" />)}
        </button>
        {/* exit */}
        {isFullScreen && (
          <button onClick = {toggleFullScreen} className="absolute top-4 right-4 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-2 rounded z-50 transition-all">
            <X className="w-6 h-6" />
          </button>
        )}
        
        <div 
          ref={mountRef} 
          className="w-full h-full" 
          style={{ minHeight: '600px' }}
        />
      </div>
    </div>
  );
};
export default ThreeScene;