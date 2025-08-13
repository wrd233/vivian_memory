import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
// 日志文件路径
const logFilePath = path.join(__dirname, 'server.log');

// 清空日志文件
fs.writeFileSync(logFilePath, `Server started at ${new Date().toISOString()}\n`, 'utf8');

// 日志函数
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage.trim());
  fs.appendFileSync(logFilePath, logMessage, 'utf8');
}

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
    log('Serving random memory');
    
    // 读取记忆索引
    const memoriesPath = path.join(__dirname, 'data', 'memories.json');
    const memoriesData = fs.readFileSync(memoriesPath, 'utf8');
    const memories = JSON.parse(memoriesData);
    
    if (memories.length === 0) {
      log('No memories found');
      return res.status(404).json({ error: 'No memories found' });
    }
    
    // 随机选择一个记忆
    const randomIndex = Math.floor(Math.random() * memories.length);
    const selectedMemory = memories[randomIndex];
    
    // 读取故事内容
    const storyPath = path.join(__dirname, selectedMemory.storyPath);
    const story = fs.readFileSync(storyPath, 'utf8');
    
    // 返回记忆数据
    const response = {
      id: selectedMemory.id,
      imageUrl: selectedMemory.imagePath,
      story: story
    };
    
    log(`Served memory: ${selectedMemory.id}`);
    res.json(response);
    
  } catch (error) {
    log(`Error serving random memory: ${error.message}`);
    res.status(500).json({ error: 'Failed to load memory' });
  }
});

// 上传新记忆
app.post('/api/upload-memory', async (req, res) => {
  try {
    const { text, image } = req.body;
    
    if (!text || !text.trim()) {
      log('Upload failed: missing text');
      return res.status(400).json({ error: 'Memory text is required' });
    }
    
    log(`Uploading new memory: ${text.substring(0, 50)}...`);
    
    // 创建新记忆ID
    const memoryId = `memory-${Date.now()}`;
    const memoryDir = path.join(__dirname, 'data', 'memories', memoryId);
    
    // 创建目录
    fs.mkdirSync(memoryDir, { recursive: true });
    
    // 保存故事文本
    const storyPath = path.join(memoryDir, 'story.txt');
    fs.writeFileSync(storyPath, text.trim(), 'utf8');
    
    // 处理图片（如果有）
    let imagePath = '/data/memories/' + memoryId + '/image.jpg';
    if (image && image.startsWith('data:image')) {
      // 处理base64图片
      const base64Data = image.replace(/^data:image\/jpeg;base64,/, "");
      const imageBuffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(path.join(memoryDir, 'image.jpg'), imageBuffer);
    } else {
      // 使用默认图片
      imagePath = '/data/memories/memory-001/image.jpg'; // 默认图片
    }
    
    // 更新索引
    const memoriesPath = path.join(__dirname, 'data', 'memories.json');
    const memoriesData = fs.readFileSync(memoriesPath, 'utf8');
    const memories = JSON.parse(memoriesData);
    
    memories.push({
      id: memoryId,
      imagePath: imagePath,
      storyPath: '/data/memories/' + memoryId + '/story.txt'
    });
    
    fs.writeFileSync(memoriesPath, JSON.stringify(memories, null, 2), 'utf8');
    
    log(`Successfully uploaded memory: ${memoryId}`);
    res.json({ 
      success: true, 
      id: memoryId,
      message: 'Memory uploaded successfully' 
    });
    
  } catch (error) {
    log(`Error uploading memory: ${error.message}`);
    res.status(500).json({ error: 'Failed to upload memory' });
  }
});

// 下载memories压缩包
app.get('/api/download-memories', async (req, res) => {
  try {
    log('Preparing memories archive download');
    
    const memoriesDir = path.join(__dirname, 'data', 'memories');
    const outputPath = path.join(__dirname, 'memories-archive.zip');
    
    // 检查memories目录是否存在
    if (!fs.existsSync(memoriesDir)) {
      log('Memories directory not found');
      return res.status(404).json({ error: 'No memories found' });
    }
    
    // 设置响应头
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="memories-archive.zip"');
    
    // 创建压缩包
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    // 处理压缩完成
    archive.on('end', () => {
      log(`Archive created successfully: ${archive.pointer()} total bytes`);
    });
    
    // 处理错误
    archive.on('error', (err) => {
      log(`Archive creation error: ${err.message}`);
      res.status(500).json({ error: 'Failed to create archive' });
    });
    
    // 将压缩包流直接发送到响应
    archive.pipe(res);
    
    // 添加memories目录到压缩包
    if (fs.existsSync(memoriesDir)) {
      archive.directory(memoriesDir, 'memories');
    }
    
    // 添加索引文件
    const indexPath = path.join(__dirname, 'data', 'memories.json');
    if (fs.existsSync(indexPath)) {
      archive.file(indexPath, { name: 'memories-index.json' });
    }
    
    // 完成压缩
    archive.finalize();
    
  } catch (error) {
    log(`Error creating archive: ${error.message}`);
    res.status(500).json({ error: 'Failed to create archive' });
  }
});

// 请求日志中间件
app.use((req, res, next) => {
  log(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 启动服务器
app.listen(PORT, () => {
  log(`Server running on http://localhost:${PORT}`);
  log('Available endpoints:');
  log('  GET /api/random-memory - Get a random memory');
  log('  GET /api/download-memories - Download memories archive');
  log('  POST /api/upload-memory - Upload new memory');
  log('  GET /api/health - Health check');
  log('  GET /data/* - Static files');
});