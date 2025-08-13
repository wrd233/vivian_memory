import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();

// CORS中间件
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});
const PORT = 3001;

// 解析JSON中间件
app.use(express.json());

// 静态文件服务
app.use('/data', express.static(path.join(__dirname, 'data')));

// 获取随机记忆
app.get('/api/random-memory', async (req, res) => {
  try {
    // 读取记忆索引
    const memoriesPath = path.join(__dirname, 'data', 'memories.json');
    const memoriesData = fs.readFileSync(memoriesPath, 'utf8');
    const memories = JSON.parse(memoriesData);
    
    if (memories.length === 0) {
      return res.status(404).json({ error: 'No memories found' });
    }
    
    // 随机选择一个记忆
    const randomIndex = Math.floor(Math.random() * memories.length);
    const selectedMemory = memories[randomIndex];
    
    // 读取故事内容
    const storyPath = path.join(__dirname, selectedMemory.storyPath);
    const story = fs.readFileSync(storyPath, 'utf8');
    
    // 返回记忆数据
    res.json({
      id: selectedMemory.id,
      imageUrl: selectedMemory.imagePath,
      story: story
    });
    
  } catch (error) {
    console.error('Error serving random memory:', error);
    res.status(500).json({ error: 'Failed to load memory' });
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  GET /api/random-memory - Get a random memory');
  console.log('  GET /api/health - Health check');
  console.log('  GET /data/* - Static files');
});