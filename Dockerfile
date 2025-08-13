# 使用Node.js官方镜像作为基础
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制项目文件
COPY . .

# 创建数据目录
RUN mkdir -p /app/data/memories

# 暴露端口
EXPOSE 3001 5173

# 启动命令
CMD ["npm", "run", "dev:full"]