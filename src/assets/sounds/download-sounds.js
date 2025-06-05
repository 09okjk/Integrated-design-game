// 这个脚本用于下载游戏所需的音效文件
// 使用方法：在命令行中运行 node download-sounds.js

const fs = require('fs');
const https = require('https');
const path = require('path');

// 音效文件URL列表
const soundUrls = {
  // 鼠标悬停音效 - 可爱的点击声
  'hover.mp3': 'https://assets.mixkit.co/sfx/preview/mixkit-select-click-1109.mp3',
  
  // 下雨音效 - 轻柔的雨声
  'rain.mp3': 'https://assets.mixkit.co/sfx/preview/mixkit-light-rain-loop-2393.mp3',
  
  // 村民请求提醒音效 - 可爱的提示音
  'villager.mp3': 'https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3'
};

// 确保目录存在
const dir = path.join(__dirname);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// 下载文件函数
function downloadFile(url, filename) {
  const filePath = path.join(dir, filename);
  const file = fs.createWriteStream(filePath);
  
  console.log(`开始下载: ${filename}`);
  
  https.get(url, (response) => {
    response.pipe(file);
    
    file.on('finish', () => {
      file.close();
      console.log(`下载完成: ${filename}`);
    });
  }).on('error', (err) => {
    fs.unlink(filePath, () => {}); // 删除不完整的文件
    console.error(`下载失败: ${filename}`, err.message);
  });
}

// 下载所有音效文件
Object.entries(soundUrls).forEach(([filename, url]) => {
  downloadFile(url, filename);
});

console.log('正在下载所有音效文件，请稍候...');
