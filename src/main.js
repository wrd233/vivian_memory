import { SceneManager } from './lib/SceneManager.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ParticleSystem } from './lib/ParticleSystem.js';
import { InteractionManager } from './lib/InteractionManager.js';
import TWEEN from 'three/examples/jsm/libs/tween.module.js';

/**
 * 互动粒子星海 - 主入口文件
 * 
 * 这是一个数字化的情感景观，由无数光点组成的"记忆之海"
 * 用户可以通过鼠标自由探索这个由程序化算法生成的世界
 */

class InteractiveParticleSea {
  constructor() {
    this.sceneManager = null;
    this.particleSystem = null;
    this.interactionManager = null;
    this.animationId = null;
    this.controls = null;
    
    this.init();
  }

  /**
   * 初始化应用
   */
  init() {
    const container = document.getElementById('app');
    if (!container) {
      console.error('Container element not found');
      return;
    }

    // 初始化场景管理器
    console.log('Initializing SceneManager...');
    this.sceneManager = new SceneManager(container);
    console.log('SceneManager initialized');
    
    // 初始化粒子系统
    const scene = this.sceneManager.getScene();
    console.log('Initializing ParticleSystem...');
    this.particleSystem = new ParticleSystem(scene);
    console.log('ParticleSystem initialized');
    
    // 设置相机控制 - 阶段3：视觉升华
    this.setupControls();
    
    // 设置交互管理器
    this.setupInteractionManager();
    
    // 开始渲染循环
    this.animate();
    
    console.log('Interactive Particle Sea initialized successfully');
  }

  /**
   * 设置相机控制 - 阶段3：视觉升华
   * 
   * 使用OrbitControls允许用户通过鼠标拖拽、滚轮缩放来自由探索
   */
  setupControls() {
    const camera = this.sceneManager.getCamera();
    const renderer = this.sceneManager.getRenderer();
    
    this.controls = new OrbitControls(camera, renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 200;
    this.controls.maxPolarAngle = Math.PI / 2;
    this.controls.autoRotate = false;
    this.controls.autoRotateSpeed = 0.5;
  }

  /**
   * 设置交互管理器 - 三阶段交互系统
   */
  setupInteractionManager() {
    const scene = this.sceneManager.getScene();
    const camera = this.sceneManager.getCamera();
    const renderer = this.sceneManager.getRenderer();
    
    this.interactionManager = new InteractionManager(
      scene,
      camera,
      renderer,
      this.particleSystem,
      this.controls
    );
  }

  /**
   * 动画循环 - 阶段4：优化与部署
   */
  animate() {
    let frameCount = 0;
    const animate = (currentTime) => {
      this.animationId = requestAnimationFrame(animate);
      const time = currentTime * 0.001;
      
      // 调试输出 - 每100帧打印一次
      if (frameCount % 100 === 0) {
        console.log('Rendering frame', frameCount, 'at time', time);
      }
      frameCount++;
      
      // 更新控制器
      if (this.controls) {
        this.controls.update();
      }
      
      // 更新粒子系统
      if (this.particleSystem) {
        this.particleSystem.update(time);
      }
      
      // 更新交互管理器
      if (this.interactionManager) {
        this.interactionManager.update(time);
      }
      
      // 渲染场景
      if (this.sceneManager) {
        this.sceneManager.render();
      }
    };
    
    animate(0);
  }

  /**
   * 清理资源
   */
  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    if (this.particleSystem) {
      this.particleSystem.dispose();
    }
    
    if (this.interactionManager) {
      this.interactionManager.dispose();
    }
    
    if (this.sceneManager) {
      this.sceneManager.dispose();
    }
  }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
  window.app = new InteractiveParticleSea();
});

// 处理页面卸载
window.addEventListener('beforeunload', () => {
  if (window.app) {
    window.app.dispose();
  }
});