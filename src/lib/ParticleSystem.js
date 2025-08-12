import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

/**
 * 粒子系统 - 负责创建和管理粒子海洋
 * 使用程序化噪音生成动态地形和粒子效果
 */
export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = null;
    this.particleCount = 5000; // 粒子数量
    this.geometry = null;
    this.material = null;
    this.noise2D = createNoise2D();
    
    this.init();
  }

  /**
   * 初始化粒子系统
   */
  init() {
    this.createParticles();
    this.createParticleMesh();
  }

  /**
   * 创建粒子数据 - 阶段1：粒子基础系统
   * 
   * 创建由大量粒子组成的静态系统，摒弃立方体
   * 使用BufferGeometry定义粒子位置，形成有机地形
   */
  createParticles() {
    this.geometry = new THREE.BufferGeometry();
    
    // 创建粒子属性数组
    const positions = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);
    const sizes = new Float32Array(this.particleCount);
    const opacities = new Float32Array(this.particleCount);
    const originalY = new Float32Array(this.particleCount); // 原始Y坐标
    const waveOffsets = new Float32Array(this.particleCount); // 波动偏移
    const flickerPhases = new Float32Array(this.particleCount); // 闪烁相位
    
    const gridSize = 150; // 阶段1：定义粒子分布范围
    
    for (let i = 0; i < this.particleCount; i++) {
      // 阶段1：在二维平面上随机生成X和Z坐标
      const x = (Math.random() - 0.5) * gridSize;
      const z = (Math.random() - 0.5) * gridSize;
      
      // 阶段2：使用噪点函数计算Y坐标（高度）
      const y = this.getTerrainHeight(x, z);
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      
      // 保存原始Y坐标用于动画
      originalY[i] = y;
      
      // 为每个粒子生成独特的波动偏移和闪烁相位
      waveOffsets[i] = Math.random() * Math.PI * 2;
      flickerPhases[i] = Math.random() * Math.PI * 2;
      
      // 阶段3：基于高度和位置计算颜色
      const color = this.calculateColor(y, x, z);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      
      // 阶段3：基于高度和噪点计算大小
      sizes[i] = this.calculateSize(y, x, z);
      
      // 阶段3：基于高度计算透明度
      opacities[i] = this.calculateOpacity(y, x, z);
    }
    
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    this.geometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));
    this.geometry.setAttribute('originalY', new THREE.BufferAttribute(originalY, 1));
    this.geometry.setAttribute('waveOffset', new THREE.BufferAttribute(waveOffsets, 1));
    this.geometry.setAttribute('flickerPhase', new THREE.BufferAttribute(flickerPhases, 1));
  }

  /**
   * 使用Simplex Noise生成有机地形
   * 阶段2：注入灵魂 - 有机地形与噪点
   */
  getTerrainHeight(x, z) {
    // 主要地形特征 - 大尺度起伏
    const baseNoise = this.noise2D(x * 0.005, z * 0.005) * 15;
    
    // 中等尺度细节 - 山丘和山谷
    const detailNoise = this.noise2D(x * 0.02, z * 0.02) * 8;
    
    // 小细节 - 地表纹理
    const microNoise = this.noise2D(x * 0.08, z * 0.08) * 3;
    
    // 混合多个尺度的噪点，创造丰富的地形层次
    const height = baseNoise + detailNoise + microNoise;
    
    return height;
  }

  /**
   * 基于高度计算粒子颜色
   * 阶段3：视觉升华 - 氛围与美学
   */
  calculateColor(height, x, z) {
    const color = new THREE.Color();
    
    // 基于高度创建自然的颜色渐变
    const normalizedHeight = (height + 25) / 50; // 归一化到0-1
    const heightRatio = Math.max(0, Math.min(1, normalizedHeight));
    
    // 使用噪点创建颜色变化
    const colorNoise = (this.noise2D(x * 0.03, z * 0.03) + 1) * 0.5;
    
    // 创建金黄色调的海
    const hue = 0.1 + colorNoise * 0.1; // 金色到琥珀色
    const saturation = 0.6 + heightRatio * 0.3; // 高处更饱和
    const lightness = 0.3 + heightRatio * 0.5; // 高处更亮
    
    color.setHSL(hue, saturation, lightness);
    return color;
  }

  /**
   * 计算粒子大小
   * 阶段3：视觉升华 - 氛围与美学
   */
  calculateSize(height, x, z) {
    // 基于高度和噪点变化大小
    const heightRatio = (height + 25) / 50;
    const sizeNoise = (this.noise2D(x * 0.1, z * 0.1) + 1) * 0.5;
    
    return 1.5 + heightRatio * 2 + sizeNoise * 1;
  }

  /**
   * 计算粒子透明度
   * 阶段3：视觉升华 - 氛围与美学
   */
  calculateOpacity(height, x, z) {
    const heightRatio = (height + 25) / 50;
    const opacityNoise = (this.noise2D(x * 0.05, z * 0.05) + 1) * 0.5;
    
    // 低处的粒子更透明，创造深度感
    return 0.4 + heightRatio * 0.5 + opacityNoise * 0.2;
  }

  /**
   * 创建粒子网格 - 阶段3：视觉升华与氛围
   * 
   * 增强粒子外观，添加发光效果和混合模式
   */
  createParticleMesh() {
    // 使用自定义着色器材质实现更高级的效果
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        size: { value: 3.0 },
        pixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
      },
      vertexShader: `
        attribute float size;
        attribute float opacity;
        varying float vOpacity;
        varying vec3 vColor;
        
        void main() {
          vOpacity = opacity;
          vColor = color;
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vOpacity;
        varying vec3 vColor;
        
        void main() {
          float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
          float alpha = 1.0 - smoothstep(0.0, 0.5, distanceToCenter);
          
          gl_FragColor = vec4(vColor, alpha * vOpacity);
        }
      `,
      transparent: true,
      depthTest: false, // 阶段3：禁用深度测试提升性能
      blending: THREE.AdditiveBlending, // 阶段3：应用混合模式
      vertexColors: true
    });
    
    this.particles = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.particles);
  }

  /**
   * 更新粒子系统
   * 添加微妙的动画效果：上下飘动和闪烁
   */
  update(time) {
    if (!this.particles) return;
    
    const positions = this.geometry.attributes.position.array;
    const colors = this.geometry.attributes.color.array;
    const opacities = this.geometry.attributes.opacity.array;
    const waveOffsets = this.geometry.attributes.waveOffset.array;
    const flickerPhases = this.geometry.attributes.flickerPhase.array;
    
    for (let i = 0; i < this.particleCount; i++) {
      const x = positions[i * 3];
      const z = positions[i * 3 + 2];
      
      // 基础地形高度 - 沉稳缓慢的地形波动
      const baseY = this.getTerrainHeight(x + Math.sin(time * 0.05) * 8, z + Math.cos(time * 0.05) * 8);
      
      // 添加上下飘动效果 - 沉稳微妙的波动
      const floatAmplitude = 0.3; // 飘动幅度（大幅减小）
      const floatFrequency = 0.2; // 飘动频率（大幅减慢）
      const waveOffset = waveOffsets[i];
      const floatY = baseY + Math.sin(time * floatFrequency + waveOffset) * floatAmplitude;
      
      positions[i * 3 + 1] = floatY;
      
      // 添加闪烁效果 - 沉稳微妙的光度变化
      const flickerAmplitude = 0.08; // 闪烁幅度（大幅减小）
      const flickerFrequency = 0.8; // 闪烁频率（大幅减慢）
      const flickerPhase = flickerPhases[i];
      const flickerValue = Math.sin(time * flickerFrequency + flickerPhase) * 0.5 + 0.5;
      
      // 更新透明度（带有闪烁效果）
      const baseOpacity = this.calculateOpacity(floatY, x, z);
      const flickeredOpacity = baseOpacity * (1.0 + flickerValue * flickerAmplitude);
      opacities[i] = Math.min(1.0, Math.max(0.2, flickeredOpacity));
      
      // 更新颜色亮度（带有闪烁效果）
      const _heightRatio = (floatY + 25) / 50;
      const baseColor = this.calculateColor(floatY, x, z);
      
      // 根据闪烁值调整亮度
      const brightnessBoost = flickerValue * 0.1;
      colors[i * 3] = Math.min(1.0, baseColor.r + brightnessBoost);
      colors[i * 3 + 1] = Math.min(1.0, baseColor.g + brightnessBoost * 0.8);
      colors[i * 3 + 2] = Math.min(1.0, baseColor.b + brightnessBoost * 0.6);
    }
    
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.opacity.needsUpdate = true;
    
    // 沉稳缓慢的整体旋转
    this.particles.rotation.y = time * 0.002; // 极其缓慢的旋转
  }

  /**
   * 添加鼠标悬停效果
   */
  onMouseMove(mouseX, mouseY) {
    if (!this.particles) return;
    
    // 计算鼠标在场景中的位置
    const _mouse = new THREE.Vector2(
      (mouseX / window.innerWidth) * 2 - 1,
      -(mouseY / window.innerHeight) * 2 + 1
    );
    
    // 这里可以添加更多交互效果
    // 例如：根据鼠标位置调整附近粒子的亮度或大小
  }

  /**
   * 获取粒子位置数据
   */
  getParticlePositions() {
    return this.geometry.attributes.position.array;
  }

  /**
   * 获取粒子数量
   */
  getParticleCount() {
    return this.particleCount;
  }

  /**
   * 通过射线投射获取点击的粒子索引
   */
  getParticleAt(mouse, camera) {
    if (!this.particles) return null;

    // 创建射线
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    // 获取粒子位置数据
    const positions = this.geometry.attributes.position.array;
    
    // 检查每个粒子是否与射线相交
    const particle = new THREE.Vector3();
    const closest = { index: -1, distance: Infinity };

    for (let i = 0; i < this.particleCount; i++) {
      particle.set(
        positions[i * 3],
        positions[i * 3 + 1],
        positions[i * 3 + 2]
      );

      // 计算粒子到射线的距离
      const distance = raycaster.ray.distanceToPoint(particle);
      
      if (distance < 10 && distance < closest.distance) { // 10是检测半径
        closest.index = i;
        closest.distance = distance;
      }
    }

    return closest.index >= 0 ? closest.index : null;
  }

  /**
   * 获取指定粒子的世界坐标
   */
  getParticleWorldPosition(index) {
    if (index < 0 || index >= this.particleCount) return null;

    const positions = this.geometry.attributes.position.array;
    return new THREE.Vector3(
      positions[index * 3],
      positions[index * 3 + 1],
      positions[index * 3 + 2]
    );
  }

  /**
   * 高亮指定粒子
   */
  highlightParticle(index) {
    if (index < 0 || index >= this.particleCount) return;

    const colors = this.geometry.attributes.color.array;
    
    // 临时改变被点击粒子的颜色
    colors[index * 3] = 1;     // R
    colors[index * 3 + 1] = 1; // G
    colors[index * 3 + 2] = 1; // B
    
    this.geometry.attributes.color.needsUpdate = true;

    // 2秒后恢复原始颜色
    setTimeout(() => {
      const positions = this.geometry.attributes.position.array;
      const y = positions[index * 3 + 1];
      const heightRatio = (y + 10) / 20;
      
      colors[index * 3] = Math.min(0.8, Math.max(0.2, heightRatio));
      colors[index * 3 + 1] = Math.min(0.8, Math.max(0.2, heightRatio)) * 0.8;
      colors[index * 3 + 2] = Math.min(0.8, Math.max(0.2, heightRatio)) * 0.6;
      
      this.geometry.attributes.color.needsUpdate = true;
    }, 2000);
  }

  /**
   * 清理资源
   */
  dispose() {
    if (this.geometry) {
      this.geometry.dispose();
    }
    if (this.material) {
      this.material.dispose();
    }
    if (this.particles) {
      this.scene.remove(this.particles);
    }
  }
}