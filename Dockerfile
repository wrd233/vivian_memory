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

# 安装构建工具
RUN npm install -g vite

# 构建前端
RUN npm run build

# 暴露端口
EXPOSE 8080

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=8080

# 启动命令
CMD ["npm", "run", "server"]