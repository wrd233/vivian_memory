import { SceneManager } from './lib/SceneManager.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ParticleSystem } from './lib/ParticleSystem.js';

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
    this.sceneManager = new SceneManager(container);
    
    // 初始化粒子系统
    const scene = this.sceneManager.getScene();
    this.particleSystem = new ParticleSystem(scene);
    
    // 设置相机控制 - 阶段3：视觉升华
    this.setupControls();
    
    // 设置鼠标交互（可选，因为OrbitControls已提供）
    this.setupMouseInteraction();
    
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
   * 设置鼠标交互 - 可选增强功能
   */
  setupMouseInteraction() {
    // OrbitControls已提供基础交互，这里可以添加额外功能
    // 如：鼠标悬停提示、粒子信息显示等
  }

  /**
   * 动画循环 - 阶段4：优化与部署
   */
  animate() {
    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      
      // 更新控制器
      if (this.controls) {
        this.controls.update();
      }
      
      // 更新粒子系统材质时间
      if (this.particleSystem && this.particleSystem.material.uniforms) {
        this.particleSystem.material.uniforms.time.value = Date.now() * 0.001;
      }
      
      // 渲染场景
      if (this.sceneManager) {
        this.sceneManager.render();
      }
    };
    
    animate();
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