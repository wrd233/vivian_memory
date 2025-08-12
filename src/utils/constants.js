/**
 * 项目全局常量配置
 */

// 粒子系统配置
export const PARTICLE_CONFIG = {
  COUNT: 5000,        // 粒子总数 (减少一个数量级)
  SIZE: 3,            // 基础粒子大小 (稍大一些)
  GRID_SIZE: 150,     // 粒子分布网格大小
  SPACING: 3,         // 粒子间距
  OPACITY: 0.9,       // 粒子透明度
};

// 场景配置
export const SCENE_CONFIG = {
  BACKGROUND_COLOR: 0x0a0a0a,  // 场景背景色 - 深邃的暗色
  AMBIENT_LIGHT_COLOR: 0x404040, // 环境光颜色
  AMBIENT_LIGHT_INTENSITY: 0.4,  // 环境光强度
  DIRECTIONAL_LIGHT_COLOR: 0xffffff, // 方向光颜色
  DIRECTIONAL_LIGHT_INTENSITY: 0.8,  // 方向光强度
};

// 相机配置
export const CAMERA_CONFIG = {
  FOV: 75,            // 视角
  NEAR: 0.1,          // 近裁剪面
  FAR: 1000,          // 远裁剪面
  POSITION: { x: 0, y: 50, z: 100 }, // 初始位置
};

// 颜色配置
export const COLOR_CONFIG = {
  HUE: 0.1,           // 主色调 (金色/琥珀色)
  SATURATION: 0.8,    // 饱和度
  MIN_LIGHTNESS: 0.2, // 最小亮度
  MAX_LIGHTNESS: 0.8, // 最大亮度
};

// 动画配置
export const ANIMATION_CONFIG = {
  ROTATION_SPEED: 0.01,     // 旋转速度
  TERRAIN_ANIMATION_SPEED: 0.1, // 地形动画速度
  TERRAIN_ANIMATION_AMPLITUDE: 10, // 地形动画幅度
};

// 交互配置
export const INTERACTION_CONFIG = {
  HOVER_RADIUS: 20,   // 鼠标悬停检测半径
  HIGHLIGHT_SCALE: 1.5, // 高亮时的缩放比例
  HIGHLIGHT_BRIGHTNESS: 1.3, // 高亮时的亮度增益
};