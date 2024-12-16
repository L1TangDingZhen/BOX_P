import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const ThreeScene = () => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const cubeRef = useRef(null);
  const frameIdRef = useRef(null);

  const [parameters, setParameters] = useState({
    x: 0, y: 0, z: 0, // 起始位置
    width: 1, height: 1, depth: 1, // 长方体尺寸
  });

  // 初始化场景、相机和渲染器
  useEffect(() => {
    if (!mountRef.current) return;

    // 清空 mountRef 避免重复渲染
    while (mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild);
    }

    // 场景
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // 相机
    const camera = new THREE.PerspectiveCamera(75, (window.innerWidth - 256) / window.innerHeight, 0.1, 1000);
    camera.position.set(10, 10, 10);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth - 256, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 坐标轴和网格
    const axesHelper = new THREE.AxesHelper(10);
    scene.add(axesHelper);

    const gridXZ = new THREE.GridHelper(10, 10);
    gridXZ.position.set(5, 0, 5);
    scene.add(gridXZ);

    // 灯光
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(10, 10, 10);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040));

    // 添加默认长方体
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({ color: 0x4169e1, transparent: true, opacity: 0.8 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    cubeRef.current = cube;

    // 动画
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // 窗口自适应
    const handleResize = () => {
      camera.aspect = (window.innerWidth - 256) / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth - 256, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
      renderer.dispose();
      scene.clear();
    };
  }, []);

  // 更新长方体位置和尺寸
  useEffect(() => {
    if (!cubeRef.current) return;

    // 更新几何体
    cubeRef.current.geometry.dispose();
    cubeRef.current.geometry = new THREE.BoxGeometry(
      parameters.width,
      parameters.height,
      parameters.depth
    );

    // 更新位置
    cubeRef.current.position.set(
      parameters.x + parameters.width / 2,
      parameters.y + parameters.height / 2,
      parameters.z + parameters.depth / 2
    );
  }, [parameters]);

  // 输入框更新参数
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setParameters((prev) => ({
      ...prev,
      [name]: parseFloat(value) || 0,
    }));
  };

  return (
    <div className="w-full h-full flex">
      {/* 左侧控制面板 */}
      <div className="w-64 p-4 bg-gray-100">
        <h2 className="text-lg font-bold mb-4">参数控制</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-md font-semibold mb-2">起始位置</h3>
            <label>X: <input type="number" name="x" value={parameters.x} onChange={handleInputChange} /></label>
            <label>Y: <input type="number" name="y" value={parameters.y} onChange={handleInputChange} /></label>
            <label>Z: <input type="number" name="z" value={parameters.z} onChange={handleInputChange} /></label>
          </div>
          <div>
            <h3 className="text-md font-semibold mb-2">长方体尺寸</h3>
            <label>Width: <input type="number" name="width" value={parameters.width} onChange={handleInputChange} /></label>
            <label>Height: <input type="number" name="height" value={parameters.height} onChange={handleInputChange} /></label>
            <label>Depth: <input type="number" name="depth" value={parameters.depth} onChange={handleInputChange} /></label>
          </div>
        </div>
      </div>

      {/* Three.js 渲染器 */}
      <div ref={mountRef} className="flex-1" style={{ minHeight: '600px' }} />
    </div>
  );
};

export default ThreeScene;




// 问题
// x,y,z定义问题
// 后端是否返回起始坐标
// 是否设置起始空间大小



//代办
// 用作分层的进度条
// 拖拽？
// 前一个物体变为灰色
// 三视图角度
// 物理的放置的顺序和列表
// 是否两个进度条，一个用作排放顺序，一个用作层数控制
