import * as THREE from 'three';
import TWEEN from 'three/examples/jsm/libs/tween.module.js';
import { MemoryStorage } from './MemoryStorage.js';

/**
 * 交互管理器 - 实现三阶段交互设计
 * 
 * 阶段一："悬停" - 粒子高亮与反馈
 * 阶段二："聚焦" - 镜头拉近动画
 * 阶段三："阅读" - 2D信息界面呈现
 */
export class InteractionManager {
  constructor(scene, camera, renderer, particleSystem, controls) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.particleSystem = particleSystem;
    this.controls = controls;
    this.memoryStorage = new MemoryStorage();
    
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoveredParticle = null;
    this.selectedParticle = null;
    this.isAnimating = false;
    
    // 存储原始粒子属性用于恢复
    this.originalColors = new Float32Array(this.particleSystem.particleCount * 3);
    this.originalSizes = new Float32Array(this.particleSystem.particleCount);
    
    // 高亮效果参数
    this.highlightColor = new THREE.Color(1, 1, 1);
    this.highlightScale = 1.5;
    this.hoverDistance = 8; // 悬停检测半径 - 减少以提高精度
    
    // 保存相机原始状态
    this.originalCameraPosition = new THREE.Vector3();
    this.originalCameraTarget = new THREE.Vector3();
    
    // 拖动检测相关
    this.isDragging = false;
    this.mouseDownPos = new THREE.Vector2();
    this.mouseDownTime = 0;
    this.dragThreshold = 5; // 像素
    this.longPressThreshold = 200; // 毫秒
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.createInfoInterface();
    this.saveOriginalParticleData();
  }

  /**
   * 保存粒子原始数据用于恢复
   */
  saveOriginalParticleData() {
    const colors = this.particleSystem.geometry.attributes.color.array;
    const sizes = this.particleSystem.geometry.attributes.size.array;
    
    for (let i = 0; i < this.particleSystem.particleCount; i++) {
      this.originalColors[i * 3] = colors[i * 3];
      this.originalColors[i * 3 + 1] = colors[i * 3 + 1];
      this.originalColors[i * 3 + 2] = colors[i * 3 + 2];
      this.originalSizes[i] = sizes[i];
    }
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.renderer.domElement.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.renderer.domElement.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.renderer.domElement.addEventListener('click', this.onClick.bind(this));
    document.addEventListener('keydown', this.onKeyDown.bind(this));
    
    // 监听窗口大小变化
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  /**
   * 鼠标移动事件 - 阶段一：悬停
   */
  onMouseMove(event) {
    if (this.isAnimating) return;

    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // 检测是否正在拖动
    if (this.mouseDownPos.x !== 0 || this.mouseDownPos.y !== 0) {
      const deltaX = Math.abs(event.clientX - this.mouseDownPos.x);
      const deltaY = Math.abs(event.clientY - this.mouseDownPos.y);
      const deltaTime = Date.now() - this.mouseDownTime;
      
      if (deltaX > this.dragThreshold || deltaY > this.dragThreshold || deltaTime > this.longPressThreshold) {
        this.isDragging = true;
      }
    }

    // 检测悬停的粒子
    const hoveredIndex = this.getHoveredParticle();
    
    if (hoveredIndex !== this.hoveredParticle) {
      // 恢复之前悬停粒子的状态
      if (this.hoveredParticle !== null) {
        this.restoreParticleState(this.hoveredParticle);
      }
      
      // 高亮新的悬停粒子
      if (hoveredIndex !== null && !this.isDragging) {
        this.highlightParticle(hoveredIndex, false); // false表示悬停状态
      }
      
      this.hoveredParticle = hoveredIndex;
    }
  }

  /**
   * 鼠标按下事件
   */
  onMouseDown(event) {
    this.mouseDownPos.set(event.clientX, event.clientY);
    this.mouseDownTime = Date.now();
    this.isDragging = false;
  }

  /**
   * 鼠标抬起事件
   */
  onMouseUp(event) {
    this.mouseDownPos.set(0, 0);
    this.mouseDownTime = 0;
    
    // 短暂延迟后重置拖动状态，给点击事件处理留出时间
    setTimeout(() => {
      this.isDragging = false;
    }, 10);
  }

  /**
   * 鼠标点击事件 - 阶段二：聚焦
   */
  onClick(event) {
    if (this.isAnimating || this.isDragging) return;

    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    const clickedIndex = this.getHoveredParticle();
    
    if (clickedIndex !== null) {
      this.startFocusAnimation(clickedIndex);
    } else if (this.selectedParticle !== null) {
      // 点击空白区域，退出阅读模式
      this.exitReadingMode();
    }
  }

  /**
   * 键盘事件 - ESC键退出阅读模式
   */
  onKeyDown(event) {
    if (event.key === 'Escape' && this.selectedParticle !== null) {
      this.exitReadingMode();
    }
  }

  /**
   * 获取悬停的粒子索引 - 使用射线投射优化精度
   */
  getHoveredParticle() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
    const positions = this.particleSystem.geometry.attributes.position.array;
    const particle = new THREE.Vector3();
    let closestIndex = null;
    let closestDistance = this.hoverDistance;

    // 获取相机相关参数以提高精度
    const cameraDirection = new THREE.Vector3();
    this.camera.getWorldDirection(cameraDirection);
    
    for (let i = 0; i < this.particleSystem.particleCount; i++) {
      particle.set(
        positions[i * 3],
        positions[i * 3 + 1],
        positions[i * 3 + 2]
      );

      // 计算粒子到射线的3D距离
      const distance = this.raycaster.ray.distanceToPoint(particle);
      
      // 同时计算屏幕空间距离作为辅助判断
      const screenPosition = particle.clone().project(this.camera);
      const screenDistance = Math.sqrt(
        Math.pow(screenPosition.x - this.mouse.x, 2) + 
        Math.pow(screenPosition.y - this.mouse.y, 2)
      );

      // 综合3D距离和屏幕距离进行判断
      if (distance < closestDistance && screenDistance < closestDistance * 2) {
        closestDistance = Math.min(distance, screenDistance);
        closestIndex = i;
      }
    }

    return closestIndex;
  }

  /**
   * 高亮粒子 - 阶段一：悬停效果
   * @param {number} index - 粒子索引
   * @param {boolean} isSelected - 是否为选中状态（影响强度）
   */
  highlightParticle(index, isSelected = false) {
    const colors = this.particleSystem.geometry.attributes.color.array;
    const sizes = this.particleSystem.geometry.attributes.size.array;
    
    const intensity = isSelected ? 1.0 : 0.7;
    const scale = isSelected ? this.highlightScale * 1.2 : this.highlightScale;
    
    // 平滑过渡到高亮状态
    const originalColor = new THREE.Color(
      this.originalColors[index * 3],
      this.originalColors[index * 3 + 1],
      this.originalColors[index * 3 + 2]
    );
    
    // 混合原始颜色和高亮色
    colors[index * 3] = THREE.MathUtils.lerp(originalColor.r, this.highlightColor.r, intensity);
    colors[index * 3 + 1] = THREE.MathUtils.lerp(originalColor.g, this.highlightColor.g, intensity);
    colors[index * 3 + 2] = THREE.MathUtils.lerp(originalColor.b, this.highlightColor.b, intensity);
    
    // 放大粒子
    sizes[index] = this.originalSizes[index] * scale;
    
    this.particleSystem.geometry.attributes.color.needsUpdate = true;
    this.particleSystem.geometry.attributes.size.needsUpdate = true;
  }

  /**
   * 恢复粒子原始状态
   */
  restoreParticleState(index) {
    const colors = this.particleSystem.geometry.attributes.color.array;
    const sizes = this.particleSystem.geometry.attributes.size.array;
    
    colors[index * 3] = this.originalColors[index * 3];
    colors[index * 3 + 1] = this.originalColors[index * 3 + 1];
    colors[index * 3 + 2] = this.originalColors[index * 3 + 2];
    sizes[index] = this.originalSizes[index];
    
    this.particleSystem.geometry.attributes.color.needsUpdate = true;
    this.particleSystem.geometry.attributes.size.needsUpdate = true;
  }

  /**
   * 开始聚焦动画 - 阶段二：镜头拉近 (手动动画版本)
   */
  startFocusAnimation(particleIndex) {
    if (this.isAnimating) {
      console.log('动画已在进行中，跳过');
      return;
    }
    
    this.isAnimating = true;
    this.selectedParticle = particleIndex;
    
    // 保存相机原始状态
    this.originalCameraPosition.copy(this.camera.position);
    this.originalCameraTarget.copy(this.controls.target);
    
    // 获取粒子世界坐标
    const particlePosition = this.particleSystem.getParticleWorldPosition(particleIndex);
    if (!particlePosition) {
      console.error('无法获取粒子位置:', particleIndex);
      this.isAnimating = false;
      return;
    }
    
    console.log('开始聚焦动画，粒子位置:', particlePosition);
    
    // 计算相机目标位置：让粒子位于屏幕中央并占据约三分之一面积
    // 基于fov和屏幕尺寸计算合适的距离
    const fov = this.camera.fov * (Math.PI / 180);
    const particleSize = 1.0; // 假设粒子基础尺寸
    const targetScreenHeightRatio = 0.33; // 占据屏幕高度的三分之一
    
    // 计算目标距离：距离 = 粒子尺寸 / (2 * tan(fov/2) * 目标屏幕比例)
    const targetDistance = (particleSize / (2 * Math.tan(fov / 2) * targetScreenHeightRatio));
    
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    direction.normalize();
    
    // 沿视线方向移动到计算出的合适距离
    const targetPosition = particlePosition.clone().sub(direction.multiplyScalar(Math.max(targetDistance, 2)));
    
    // 禁用控制器
    this.controls.enabled = false;
    
    try {
      // 使用手动动画代替TWEEN
      const duration = 1500; // 1.5秒
      const startTime = Date.now();
      const startCameraPos = this.camera.position.clone();
      const startTarget = this.controls.target.clone();
      
      const animate = () => {
        if (!this.isAnimating) return;
        
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // 缓动函数
        const easeProgress = progress < 0.5 
          ? 4 * progress * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        // 更新相机位置（保持视角方向不变）
        this.camera.position.lerpVectors(startCameraPos, targetPosition, easeProgress);
        
        // 保持相机目标不变，仅移动位置
        this.controls.update();
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          console.log('手动动画完成，进入阅读模式');
          this.enterReadingMode(particleIndex);
        }
      };
      
      // 启动动画
      animate();
      
      // 高亮选中的粒子
      this.highlightParticle(particleIndex, true);
      
    } catch (error) {
      console.error('动画创建失败:', error);
      this.controls.enabled = true;
      this.isAnimating = false;
    }
  }

  /**
   * 进入阅读模式 - 阶段三：2D信息界面
   */
  enterReadingMode(particleIndex) {
    console.log('进入阅读模式，粒子索引:', particleIndex);
    
    try {
      // 应用背景模糊效果
      this.applyDepthOfField();
      
      // 显示信息界面（异步）
      this.showInfoInterface(particleIndex);
      
      // 注意：showInfoInterface现在是异步的，但不需要等待
      // 因为界面会立即显示加载状态
      
      this.isAnimating = false;
      console.log('阅读模式已启动');
    } catch (error) {
      console.error('进入阅读模式失败:', error);
      this.controls.enabled = true;
      this.isAnimating = false;
    }
  }

  /**
   * 退出阅读模式
   */
  exitReadingMode() {
    if (this.isAnimating || this.selectedParticle === null) {
      console.log('退出条件阻止:', { isAnimating: this.isAnimating, selectedParticle: this.selectedParticle });
      return;
    }
    
    console.log('开始退出阅读模式');
    this.isAnimating = true;
    
    // 隐藏信息界面
    this.hideInfoInterface();
    
    // 移除背景模糊
    this.removeDepthOfField();
    
    // 恢复粒子状态
    if (this.selectedParticle !== null) {
      this.restoreParticleState(this.selectedParticle);
    }
    
    // 使用手动动画实现镜头后退效果
    const duration = 1000; // 稍短的动画时间
    const startTime = Date.now();
    const startCameraPos = this.camera.position.clone();
    
    // 计算前进位置：沿当前视线方向前进一定距离
    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    direction.normalize();
    
    const advanceDistance = 5; // 前进距离
    const advancePosition = startCameraPos.clone().add(direction.multiplyScalar(advanceDistance));
    
    const animate = () => {
      if (!this.isAnimating) return;
      
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // 缓动函数 - 使用更平缓的缓动
      const easeProgress = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      // 前进相机位置
      this.camera.position.lerpVectors(startCameraPos, advancePosition, easeProgress);
      
      // 保持相机目标不变，仅移动位置
      this.controls.update();
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        console.log('后退动画完成，启用控制器');
        this.controls.enabled = true;
        this.selectedParticle = null;
        this.isAnimating = false;
      }
    };
    
    animate();
  }

  /**
   * 应用景深模糊效果
   */
  applyDepthOfField() {
    // 这里可以添加后期处理效果
    // 目前通过调整粒子透明度来模拟模糊效果
    const colors = this.particleSystem.geometry.attributes.color.array;
    const opacities = this.particleSystem.geometry.attributes.opacity.array;
    
    for (let i = 0; i < this.particleSystem.particleCount; i++) {
      if (i !== this.selectedParticle) {
        colors[i * 3] *= 0.3;
        colors[i * 3 + 1] *= 0.3;
        colors[i * 3 + 2] *= 0.3;
        opacities[i] *= 0.3;
      }
    }
    
    this.particleSystem.geometry.attributes.color.needsUpdate = true;
    this.particleSystem.geometry.attributes.opacity.needsUpdate = true;
  }

  /**
   * 移除景深模糊效果
   */
  removeDepthOfField() {
    const colors = this.particleSystem.geometry.attributes.color.array;
    const opacities = this.particleSystem.geometry.attributes.opacity.array;
    
    for (let i = 0; i < this.particleSystem.particleCount; i++) {
      colors[i * 3] = this.originalColors[i * 3];
      colors[i * 3 + 1] = this.originalColors[i * 3 + 1];
      colors[i * 3 + 2] = this.originalColors[i * 3 + 2];
      opacities[i] = this.particleSystem.calculateOpacity(
        this.particleSystem.geometry.attributes.position.array[i * 3 + 1],
        this.particleSystem.geometry.attributes.position.array[i * 3],
        this.particleSystem.geometry.attributes.position.array[i * 3 + 2]
      );
    }
    
    this.particleSystem.geometry.attributes.color.needsUpdate = true;
    this.particleSystem.geometry.attributes.opacity.needsUpdate = true;
  }

  /**
   * 创建信息界面
   */
  createInfoInterface() {
    // 创建信息容器
    this.infoContainer = document.createElement('div');
    this.infoContainer.id = 'particle-info';
    this.infoContainer.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 400px;
      max-width: 90vw;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
      z-index: 1000;
      font-family: 'Georgia', serif;
      color: #333;
    `;

    // 创建内容结构
    this.infoContainer.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 20px;">
        <div style="display: flex; align-items: flex-start; gap: 20px;">
          <div style="flex-shrink: 0;">
            <img id="particle-image" src="" alt="Memory" 
                 style="width: 80px; height: 80px; border-radius: 8px; object-fit: cover;">
          </div>
          <div style="flex: 1;">
            <h2 id="particle-title" style="margin: 0 0 10px 0; font-size: 24px; color: #222;">
              记忆碎片
            </h2>
            <p id="particle-story" style="margin: 0; line-height: 1.6; font-size: 16px; color: #555;">
              这是一个被遗忘的记忆，在星海中静静漂浮...
            </p>
          </div>
        </div>
        <button id="close-info" style="
          align-self: flex-end;
          padding: 8px 16px;
          background: #f0f0f0;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s;
        " onmouseover="this.style.background='#e0e0e0'" onmouseout="this.style.background='#f0f0f0'">
          关闭
        </button>
      </div>
    `;

    document.body.appendChild(this.infoContainer);

    // 绑定关闭按钮事件
    this.infoContainer.querySelector('#close-info').addEventListener('click', () => {
      this.exitReadingMode();
    });

    // 点击背景区域关闭
    this.infoContainer.addEventListener('click', (e) => {
      if (e.target === this.infoContainer) {
        this.exitReadingMode();
      }
    });
  }

  /**
   * 显示信息界面
   */
  async showInfoInterface(particleIndex) {
    try {
      // 显示加载状态
      document.getElementById('particle-title').textContent = '加载中...';
      document.getElementById('particle-story').textContent = '正在唤醒这段记忆...';
      
      // 淡入显示
      this.infoContainer.style.opacity = '1';
      this.infoContainer.style.visibility = 'visible';
      this.infoContainer.style.transform = 'translate(-50%, -50%) scale(1)';
      
      // 获取随机记忆（异步）
      const memory = await this.memoryStorage.getRandomMemory();
      
      // 更新界面内容
      if (memory.image) {
        document.getElementById('particle-image').src = memory.image;
        document.getElementById('particle-image').style.display = 'block';
      } else {
        // 如果没有图片，使用颜色背景
        document.getElementById('particle-image').src = this.generateColorImage(memory.color);
        document.getElementById('particle-image').style.display = 'block';
      }
      
      document.getElementById('particle-title').textContent = '记忆碎片';
      document.getElementById('particle-story').textContent = memory.text;
      
    } catch (error) {
      console.error('显示记忆失败:', error);
      document.getElementById('particle-title').textContent = '记忆读取失败';
      document.getElementById('particle-story').textContent = '无法连接到记忆服务器，请检查网络连接。';
    }
  }

  /**
   * 隐藏信息界面
   */
  hideInfoInterface() {
    this.infoContainer.style.opacity = '0';
    this.infoContainer.style.visibility = 'hidden';
    this.infoContainer.style.transform = 'translate(-50%, -50%) scale(0.9)';
  }


  /**
   * 窗口大小调整处理
   */
  onWindowResize() {
    // 重新计算鼠标坐标
  }

  /**
   * 更新交互管理器（已移除TWEEN依赖）
   */
  update() {
    // TWEEN已替换为手动动画，这里不再需要更新
    // 保留此方法用于未来扩展
  }

  /**
   * 清理资源
   */
  dispose() {
    if (this.infoContainer) {
      document.body.removeChild(this.infoContainer);
    }
    
    this.renderer.domElement.removeEventListener('mousemove', this.onMouseMove.bind(this));
    this.renderer.domElement.removeEventListener('mousedown', this.onMouseDown.bind(this));
    this.renderer.domElement.removeEventListener('mouseup', this.onMouseUp.bind(this));
    this.renderer.domElement.removeEventListener('click', this.onClick.bind(this));
    document.removeEventListener('keydown', this.onKeyDown.bind(this));
    window.removeEventListener('resize', this.onWindowResize.bind(this));
  }
}