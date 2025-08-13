/**
 * 服务端记忆存储系统 - 从服务器获取随机记忆
 * 使用本地文件存储记忆，通过API随机获取
 */
export class MemoryStorage {
  constructor() {
    // 检测运行环境
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isLocalhost) {
      // 本地开发环境
      this.apiUrl = 'http://localhost:3001/api';
      this.serverUrl = 'http://localhost:3001';
    } else {
      // 云端部署环境 - 使用当前域名
      const baseUrl = window.location.origin;
      this.apiUrl = `${baseUrl}/api`;
      this.serverUrl = baseUrl;
    }
  }

  /**
   * 从服务端获取随机记忆
   * @returns {Promise<Object>} 随机记忆
   */
  async getRandomMemory() {
    try {
      const response = await fetch(`${this.apiUrl}/random-memory`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const memory = await response.json();
      
      // 确保返回格式统一
      return {
        id: memory.id,
        text: memory.story,
        image: `${this.serverUrl}${memory.imageUrl}`,
        color: '#8B4513', // 默认颜色
        createdAt: new Date().toISOString(),
        viewCount: 0
      };
    } catch (error) {
      console.error('获取记忆失败:', error);
      return this.getDefaultMemory();
    }
  }

  /**
   * 获取默认记忆（当服务端不可用时）
   * @returns {Object} 默认记忆
   */
  getDefaultMemory() {
    return {
      id: 'default',
      text: '这是一片由无数记忆组成的星海，每一个光点都承载着一个故事...\n\n服务端似乎暂时无法连接，但记忆仍在继续。',
      color: '#8B4513',
      image: null,
      createdAt: new Date().toISOString(),
      viewCount: 0
    };
  }

  /**
   * 检查服务端是否可用
   * @returns {Promise<boolean>} 服务端状态
   */
  async checkServerStatus() {
    try {
      const response = await fetch(`${this.apiUrl}/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}