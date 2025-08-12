import * as THREE from 'three';

/**
 * 场景管理器 - 负责初始化和管理整个3D场景
 * 包括场景、相机、渲染器等核心组件
 */
export class SceneManager {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.raycaster = null;
    this.mouse = null;
    this.isTransitioning = false;
    
    this.init();
    this.setupEventListeners();
  }

  /**
   * 初始化场景、相机和渲染器
   */
  init() {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0a); // 深邃的暗色背景

    // 创建透视相机
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    this.camera.position.set(0, 50, 100);
    this.camera.lookAt(0, 0, 0);

    // 创建WebGL渲染器
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    // 添加环境光和方向光
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 100, 50);
    this.scene.add(directionalLight);

    // 初始化射线投射器和鼠标向量
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    window.addEventListener('resize', () => this.onWindowResize());
  }

  /**
   * 窗口大小改变时的处理
   */
  onWindowResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * 渲染场景
   */
  render() {
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * 获取场景对象
   */
  getScene() {
    return this.scene;
  }

  /**
   * 获取相机对象
   */
  getCamera() {
    return this.camera;
  }

  /**
   * 获取渲染器对象
   */
  getRenderer() {
    return this.renderer;
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    window.addEventListener('resize', () => this.onWindowResize());
  }

  /**
   * 窗口大小改变时的处理
   */
  onWindowResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * 获取射线投射器
   */
  getRaycaster() {
    return this.raycaster;
  }

  /**
   * 获取鼠标向量
   */
  getMouseVector() {
    return this.mouse;
  }

  /**
   * 更新鼠标位置
   */
  updateMousePosition(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  /**
   * 平滑移动相机到指定位置
   */
  moveCameraTo(targetPosition, duration = 1000) {
    if (this.isTransitioning) return;
    
    this.isTransitioning = true;
    const startPosition = this.camera.position.clone();
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // 使用缓动函数使移动更自然
      const easeProgress = this.easeInOutCubic(progress);
      
      this.camera.position.lerpVectors(startPosition, targetPosition, easeProgress);
      this.camera.lookAt(0, 0, 0);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.isTransitioning = false;
      }
    };
    
    animate();
  }

  /**
   * 缓动函数
   */
  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * 获取场景对象
   */
  getScene() {
    return this.scene;
  }

  /**
   * 获取相机对象
   */
  getCamera() {
    return this.camera;
  }

  /**
   * 获取渲染器对象
   */
  getRenderer() {
    return this.renderer;
  }

  /**
   * 清理资源
   */
  dispose() {
    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}