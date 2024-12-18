import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';

const ThreeScene = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const frameIdRef = useRef(null);
  
  const [coordinates, setCoordinates] = useState({ x: 0, y: 0, z: 0 });
  const [dimensions, setDimensions] = useState({ width: 1, height: 1, depth: 1 });
  const [cubes, setCubes] = useState([]); // 存储所有长方体
  const colorSet = new Set(); // 用于存储颜色，防止重复

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

  const isMouseDown = useRef(false);
  const mousePosition = useRef({ x: 0, y: 0 });
  const cameraRotation = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!mountRef.current) return;


    const mountNode = mountRef.current; // 保存 mountRef.current 的值

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0xf0f0f0);
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current = renderer;
    
    renderer.setSize(800, 600);
    // mountRef.current.appendChild(renderer.domElement);
    mountNode.appendChild(renderer.domElement); // 使用局部变量 mountNode

    const createThickAxis = (scene, length) => {
      const axisMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 }); // 黑色轴线
    
      // X轴
      const xGeometry = new THREE.CylinderGeometry(0.05, 0.05, length, 16);
      const xAxis = new THREE.Mesh(xGeometry, axisMaterial);
      xAxis.rotation.z = -Math.PI / 2;
      xAxis.position.set(length / 2, 0, 0);
      scene.add(xAxis);
    
      // Y轴
      const yGeometry = new THREE.CylinderGeometry(0.05, 0.05, length, 16);
      const yAxis = new THREE.Mesh(yGeometry, axisMaterial);
      yAxis.position.set(0, length / 2, 0);
      scene.add(yAxis);
    
      // Z轴
      const zGeometry = new THREE.CylinderGeometry(0.05, 0.05, length, 16);
      const zAxis = new THREE.Mesh(zGeometry, axisMaterial);
      zAxis.rotation.x = -Math.PI / 2;
      zAxis.position.set(0, 0, length / 2);
      scene.add(zAxis);
    
      // 添加刻度线和数字
      const addTicks = (axis, length, direction) => {
        const tickMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
        const fontLoader = new FontLoader();
        const tickInterval = 2; // 每隔2个单位添加一个刻度
    
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
    
          // 添加刻度数字
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
      };
    
      // 调用添加刻度
      addTicks("x", length);
      addTicks("y", length);
      addTicks("z", length);
    };
    

    const addAxisLabels = (scene, length) => {
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
      };
      

    // 创建坐标轴
    const axisLength = 10;
    // const axesHelper = new THREE.AxesHelper(axisLength);
    // scene.add(axesHelper);
    createThickAxis(scene, axisLength);
    addAxisLabels(scene, axisLength);

    // 创建第一象限的网格
    const size = 10;
    const divisions = 10;
    
    // XY平面的网格（前面）
    const gridXY = new THREE.GridHelper(size, divisions);
    gridXY.rotation.x = -Math.PI / 2;  // 旋转到XY平面
    gridXY.position.set(size/2, size/2, 0);  // 移动到第一象限
    scene.add(gridXY);

    // XZ平面的网格（底部）
    const gridXZ = new THREE.GridHelper(size, divisions);
    gridXZ.position.set(size/2, 0, size/2);  // 移动到第一象限
    scene.add(gridXZ);

    // YZ平面的网格（侧面）
    const gridYZ = new THREE.GridHelper(size, divisions);
    gridYZ.rotation.z = Math.PI / 2; // 旋转到YZ平面
    gridYZ.position.set(0, size / 2, size / 2); // 移动到第一象限
    scene.add(gridYZ);


    // const geometry = new THREE.BoxGeometry(
    //   dimensions.width,
    //   dimensions.height,
    //   dimensions.depth
    // );
    // const material = new THREE.MeshPhongMaterial({
    //   color: getRandomColor(),
    //   transparent: true,
    //   opacity: 0.8,
    // });
    // const cubeMesh = new THREE.Mesh(geometry, material);
    // cubeMesh.position.set(
    //   coordinates.x + dimensions.width / 2,
    //   coordinates.y + dimensions.height / 2,
    //   coordinates.z + dimensions.depth / 2
    // );
    
    // // 添加到场景
    // sceneRef.current.add(cubeMesh);
    
    // // 添加新长方体对象到状态
    // const newCube = {
    //   x: coordinates.x,
    //   y: coordinates.y,
    //   z: coordinates.z,
    //   width: dimensions.width,
    //   height: dimensions.height,
    //   depth: dimensions.depth,
    //   mesh: cubeMesh, // 将 cubeMesh 赋值到 mesh
    // };
    // setCubes((prev) => [...prev, newCube]);
    
    

    // 灯光设置
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 1, 1);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040));

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

      camera.position.x = radius * Math.sin(cameraRotation.current.y) * Math.cos(cameraRotation.current.x);
      camera.position.y = radius * Math.sin(cameraRotation.current.x);
      camera.position.z = radius * Math.cos(cameraRotation.current.y) * Math.cos(cameraRotation.current.x);

      camera.lookAt(0, 0, 0);
      
      mousePosition.current = {
        x: e.clientX,
        y: e.clientY
      };
    };

    const handleTouchStart = (e) => {
      isMouseDown.current = true;
      // 使用 `touches[0]` 获取第一个触摸点
      mousePosition.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    };
    
    const handleTouchEnd = () => {
      isMouseDown.current = false;
    };
    
    const handleTouchMove = (e) => {
      if (!isMouseDown.current) return;
    
      // 触摸点变化
      const deltaX = e.touches[0].clientX - mousePosition.current.x;
      const deltaY = e.touches[0].clientY - mousePosition.current.y;
    
      cameraRotation.current.x += deltaY * 0.01;
      cameraRotation.current.y += deltaX * 0.01;
    
      const radius = Math.sqrt(
        camera.position.x ** 2 +
        camera.position.y ** 2 +
        camera.position.z ** 2
      );
    
      camera.position.x = radius * Math.sin(cameraRotation.current.y) * Math.cos(cameraRotation.current.x);
      camera.position.y = radius * Math.sin(cameraRotation.current.x);
      camera.position.z = radius * Math.cos(cameraRotation.current.y) * Math.cos(cameraRotation.current.x);
    
      camera.lookAt(0, 0, 0);
    
      mousePosition.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    };
    

    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('touchstart', handleTouchStart); // 新增触摸事件
    
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
      

      if (mountNode && renderer.domElement) { // 使用局部变量 mountNode
        mountNode.removeChild(renderer.domElement);
      }
      
      if (sceneRef.current) {
        sceneRef.current.clear();
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [dimensions]);

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
    if (numValue >= 0) {
      setCoordinates(prev => ({
        ...prev,
        [axis]: numValue
      }));
    }
  };

  const handleDimensionChange = (dimension, value) => {
    const numValue = parseFloat(value) || 0;
    if (numValue > 0) {
      setDimensions(prev => ({
        ...prev,
        [dimension]: numValue
      }));
    }
  };

  return (
    <div className="w-full h-full flex">
      <div className="w-64 p-4 bg-gray-100">
        <h2 className="text-lg font-bold mb-4">参数控制</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-md font-semibold mb-2">起始位置</h3>
            <div className="space-y-2">
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
          
          <div>
            <h3 className="text-md font-semibold mb-2">长方体尺寸</h3>
            <div className="space-y-2">
              <div>
                <label className="block text-sm font-medium">Width</label>
                <input
                  type="number"
                  min="0.1"
                  max="10"
                  value={dimensions.width}
                  onChange={(e) => handleDimensionChange('width', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Height</label>
                <input
                  type="number"
                  min="0.1"
                  max="10"
                  value={dimensions.height}
                  onChange={(e) => handleDimensionChange('height', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Depth</label>
                <input
                  type="number"
                  min="0.1"
                  max="10"
                  value={dimensions.depth}
                  onChange={(e) => handleDimensionChange('depth', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
            </div>
          </div>
          <div><button
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
                sceneRef.current.add(cubeMesh);
              } else {
                alert("空间不足或与其他长方体冲突！");
              }
            }}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
          >
            添加长方体
          </button>
          </div>
        </div>
        <div><div className="space-y-2">
      </div>
      </div>
      </div>
      <div ref={mountRef} className="flex-1" />
    </div>
  );
};

export default ThreeScene;







