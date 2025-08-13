/**
 * 记忆上传管理器 - 创建上传界面和信纸样式表单
 * 提供优雅的牛皮纸质感的记忆输入界面
 */
// 移除MemoryStorage导入，改为使用服务端API

export class MemoryUploadManager {
  constructor() {
    this.isUploadOpen = false;
    this.selectedColor = '#8B4513'; // 默认牛皮纸颜色
    this.uploadedImage = null;
    this.memoryText = '';
    this.apiUrl = 'http://localhost:3001/api';
    
    this.init();
  }

  init() {
    this.createUploadButton();
    this.createUploadInterface();
  }

  /**
   * 创建上传按钮 - 位于界面下方中间位置
   */
  createUploadButton() {
    const uploadButton = document.createElement('button');
    uploadButton.id = 'memory-upload-btn';
    uploadButton.innerHTML = '✨ 记录新记忆';
    uploadButton.style.cssText = `
      position: fixed;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%);
      padding: 12px 24px;
      background: linear-gradient(135deg, rgba(139, 69, 19, 0.8), rgba(160, 82, 45, 0.8));
      color: #f4f1e8;
      border: none;
      border-radius: 25px;
      font-family: 'Georgia', serif;
      font-size: 16px;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
      z-index: 1001;
      letter-spacing: 0.5px;
    `;

    // 悬停效果
    uploadButton.addEventListener('mouseenter', () => {
      uploadButton.style.transform = 'translateX(-50%) translateY(-2px)';
      uploadButton.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.4)';
    });

    uploadButton.addEventListener('mouseleave', () => {
      uploadButton.style.transform = 'translateX(-50%)';
      uploadButton.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
    });

    uploadButton.addEventListener('click', () => {
      this.openUploadInterface();
    });

    document.body.appendChild(uploadButton);
  }

  /**
   * 创建上传界面 - 信纸样式
   */
  createUploadInterface() {
    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.id = 'memory-upload-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(5px);
      z-index: 1002;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
    `;

    // 创建信纸容器
    const paperContainer = document.createElement('div');
    paperContainer.id = 'memory-paper';
    paperContainer.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.9);
      width: 600px;
      max-width: 90vw;
      max-height: 80vh;
      background: linear-gradient(135deg, #d2b48c 0%, #c19a6b 100%);
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      overflow-y: auto;
      transition: all 0.3s ease;
      z-index: 1003;
      opacity: 0;
      visibility: hidden;
    `;

    // 创建信纸内容
    paperContainer.innerHTML = `
      <div style="position: relative; min-height: 400px;">
        <!-- 关闭按钮 -->
        <button id="close-memory-upload" style="
          position: absolute;
          top: -10px;
          right: -10px;
          width: 30px;
          height: 30px;
          background: #8B4513;
          color: #f4f1e8;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1004;
        ">×</button>

        <!-- 上传区域 -->
        <div style="display: flex; gap: 30px; margin-bottom: 30px;">
          <!-- 左侧：图片/颜色选择 -->
          <div style="flex: 1; max-width: 200px;">
            <div style="margin-bottom: 15px; font-family: 'Georgia', serif; color: #5D4037; font-size: 14px;">
              选择图片或颜色
            </div>
            
            <!-- 图片上传区域 -->
            <div id="image-upload-area" style="
              width: 150px;
              height: 150px;
              border: 2px dashed #8B4513;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              transition: all 0.3s ease;
              margin-bottom: 15px;
              position: relative;
              background: rgba(255, 255, 255, 0.1);
            ">
              <div id="upload-placeholder" style="text-align: center; color: #8B4513;">
                <div style="font-size: 24px; margin-bottom: 5px;">📷</div>
                <div style="font-size: 12px;">上传图片</div>
              </div>
              <img id="preview-image" style="
                width: 100%;
                height: 100%;
                object-fit: cover;
                border-radius: 6px;
                display: none;
              ">
              <input type="file" id="image-input" accept="image/*" style="display: none;">
            </div>

            <!-- 颜色选择器 -->
            <div style="display: flex; gap: 5px; flex-wrap: wrap;">
              <button class="color-option" data-color="#8B4513" style="
                width: 25px;
                height: 25px;
                border: 2px solid #8B4513;
                border-radius: 50%;
                background: #8B4513;
                cursor: pointer;
                transition: transform 0.2s;
              "></button>
              <button class="color-option" data-color="#CD853F" style="
                width: 25px;
                height: 25px;
                border: 1px solid #ccc;
                border-radius: 50%;
                background: #CD853F;
                cursor: pointer;
                transition: transform 0.2s;
              "></button>
              <button class="color-option" data-color="#DEB887" style="
                width: 25px;
                height: 25px;
                border: 1px solid #ccc;
                border-radius: 50%;
                background: #DEB887;
                cursor: pointer;
                transition: transform 0.2s;
              "></button>
              <button class="color-option" data-color="#F4A460" style="
                width: 25px;
                height: 25px;
                border: 1px solid #ccc;
                border-radius: 50%;
                background: #F4A460;
                cursor: pointer;
                transition: transform 0.2s;
              "></button>
            </div>
          </div>

          <!-- 右侧：文本输入 -->
          <div style="flex: 2;">
            <div style="margin-bottom: 15px; font-family: 'Georgia', serif; color: #5D4037; font-size: 14px;">
              记录记忆
            </div>
            
            <!-- 行线背景 -->
            <div style="
              position: relative;
              background: repeating-linear-gradient(
                to bottom,
                transparent 0px,
                transparent 24px,
                rgba(139, 69, 19, 0.1) 24px,
                rgba(139, 69, 19, 0.1) 25px
              );
              padding: 20px;
              border-radius: 4px;
              min-height: 300px;
            ">
              <textarea id="memory-textarea" placeholder="我记得..." style="
                width: 100%;
                height: 300px;
                background: transparent;
                border: none;
                outline: none;
                font-family: 'Georgia', serif;
                font-size: 16px;
                line-height: 25px;
                color: #5D4037;
                resize: none;
                padding: 0;
              "></textarea>
            </div>
          </div>
        </div>

        <!-- 提交按钮 -->
        <div style="text-align: center; margin-top: 30px;">
          <button id="submit-memory" style="
            padding: 12px 30px;
            background: linear-gradient(135deg, #8B4513, #A0522D);
            color: #f4f1e8;
            border: none;
            border-radius: 25px;
            font-family: 'Georgia', serif;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s ease;
            letter-spacing: 0.5px;
          ">保存记忆</button>
        </div>
      </div>
    `;

    overlay.appendChild(paperContainer);
    document.body.appendChild(overlay);

    // 绑定事件
    this.bindEvents(overlay, paperContainer);
  }

  /**
   * 绑定事件处理
   */
  bindEvents(overlay, paperContainer) {
    // 关闭按钮
    const closeBtn = document.getElementById('close-memory-upload');
    closeBtn.addEventListener('click', () => this.closeUploadInterface());

    // 点击遮罩关闭
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.closeUploadInterface();
      }
    });

    // 图片上传
    const uploadArea = document.getElementById('image-upload-area');
    const imageInput = document.getElementById('image-input');
    const previewImage = document.getElementById('preview-image');
    const uploadPlaceholder = document.getElementById('upload-placeholder');

    uploadArea.addEventListener('click', () => imageInput.click());

    imageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          previewImage.src = e.target.result;
          previewImage.style.display = 'block';
          uploadPlaceholder.style.display = 'none';
          this.uploadedImage = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    });

    // 颜色选择
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
      option.addEventListener('click', () => {
        colorOptions.forEach(opt => opt.style.border = '1px solid #ccc');
        option.style.border = '2px solid #8B4513';
        this.selectedColor = option.dataset.color;
        
        // 如果有图片，隐藏图片显示颜色
        if (previewImage.style.display === 'block') {
          previewImage.style.display = 'none';
          uploadPlaceholder.style.display = 'block';
        }
      });
    });

    // 文本输入
    const textarea = document.getElementById('memory-textarea');
    textarea.addEventListener('input', (e) => {
      this.memoryText = e.target.value;
    });

    // 提交按钮
    const submitBtn = document.getElementById('submit-memory');
    submitBtn.addEventListener('click', () => {
      this.submitMemory();
    });
  }

  /**
   * 打开上传界面
   */
  openUploadInterface() {
    this.isUploadOpen = true;
    const overlay = document.getElementById('memory-upload-overlay');
    const paper = document.getElementById('memory-paper');

    overlay.style.opacity = '1';
    overlay.style.visibility = 'visible';
    
    paper.style.opacity = '1';
    paper.style.visibility = 'visible';
    paper.style.transform = 'translate(-50%, -50%) scale(1)';

    // 隐藏上传按钮
    const uploadBtn = document.getElementById('memory-upload-btn');
    uploadBtn.style.opacity = '0';
  }

  /**
   * 关闭上传界面
   */
  closeUploadInterface() {
    this.isUploadOpen = false;
    const overlay = document.getElementById('memory-upload-overlay');
    const paper = document.getElementById('memory-paper');

    overlay.style.opacity = '0';
    overlay.style.visibility = 'hidden';
    
    paper.style.opacity = '0';
    paper.style.visibility = 'hidden';
    paper.style.transform = 'translate(-50%, -50%) scale(0.9)';

    // 显示上传按钮
    const uploadBtn = document.getElementById('memory-upload-btn');
    uploadBtn.style.opacity = '1';

    // 重置表单
    this.resetForm();
  }

  /**
   * 提交记忆到服务端
   */
  async submitMemory() {
    if (!this.memoryText.trim()) {
      alert('请输入您的记忆内容');
      return;
    }

    const memoryData = {
      text: this.memoryText,
      image: this.uploadedImage,
      color: this.selectedColor
    };

    try {
      const response = await fetch(`${this.apiUrl}/upload-memory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(memoryData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('记忆已保存到服务端:', result.id);
        this.closeUploadInterface();
        this.showSuccessMessage();
      } else {
        alert('保存失败: ' + (result.error || '未知错误'));
      }
    } catch (error) {
      console.error('上传失败:', error);
      alert('保存失败，请检查网络连接');
    }
  }

  /**
   * 重置表单
   */
  resetForm() {
    this.uploadedImage = null;
    this.memoryText = '';
    this.selectedColor = '#8B4513';

    // 重置UI
    const previewImage = document.getElementById('preview-image');
    const uploadPlaceholder = document.getElementById('upload-placeholder');
    const textarea = document.getElementById('memory-textarea');
    const colorOptions = document.querySelectorAll('.color-option');

    previewImage.style.display = 'none';
    uploadPlaceholder.style.display = 'block';
    textarea.value = '';
    
    colorOptions.forEach(option => {
      option.style.border = '1px solid #ccc';
    });
    colorOptions[0].style.border = '2px solid #8B4513';
  }

  /**
   * 显示成功提示
   */
  showSuccessMessage() {
    const message = document.createElement('div');
    message.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(139, 69, 19, 0.9);
      color: #f4f1e8;
      padding: 20px 40px;
      border-radius: 25px;
      font-family: 'Georgia', serif;
      z-index: 1005;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    message.textContent = '记忆已保存 ✨';

    document.body.appendChild(message);
    
    setTimeout(() => {
      message.style.opacity = '1';
    }, 100);

    setTimeout(() => {
      message.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(message);
      }, 300);
    }, 2000);
  }

  /**
   * 清理资源
   */
  dispose() {
    const uploadBtn = document.getElementById('memory-upload-btn');
    const overlay = document.getElementById('memory-upload-overlay');
    
    if (uploadBtn) {
      document.body.removeChild(uploadBtn);
    }
    
    if (overlay) {
      document.body.removeChild(overlay);
    }
  }
}