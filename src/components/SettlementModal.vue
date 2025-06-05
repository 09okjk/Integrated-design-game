<script setup lang="ts">
// import { ref, computed, onMounted } from 'vue';
import { useGameStore } from '../store/gameStore';

// const gameStore = useGameStore();

// 定义属性
const props = defineProps<{
  visible: boolean;
  outcomeTitle: string;
  outcomeDescription: string;
  outcomeComment: string;
  posterImage: string;
}>();

// 定义事件
const emit = defineEmits(['close', 'restart']);

// 保存海报
const savePoster = () => {
  // 创建一个链接元素
  const link = document.createElement('a');
  link.href = props.posterImage;
  link.download = `${props.outcomeTitle.replace(/\s+/g, '-')}-${new Date().getTime()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 分享到社交媒体
const shareToTwitter = () => {
  const text = `我在"集成设计游戏"中获得了"${props.outcomeTitle}"结局！${props.outcomeDescription}`;
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
};

// 关闭模态框
const closeModal = () => {
  emit('close');
};

// 重新开始游戏
const restartGame = () => {
  emit('restart');
};
</script>

<template>
  <div class="settlement-modal-backdrop" v-if="visible">
    <div class="settlement-modal">
      <div class="modal-header">
        <h2 class="outcome-title">{{ outcomeTitle }}</h2>
        <button class="close-button" @click="closeModal">×</button>
      </div>
      
      <div class="modal-body">
        <div class="outcome-description">
          <p>{{ outcomeDescription }}</p>
        </div>
        
        <div class="civilization-comment">
          <h3>文明评语</h3>
          <p>{{ outcomeComment }}</p>
        </div>
        
        <div class="poster-container">
          <img :src="posterImage" alt="结算海报" class="settlement-poster">
        </div>
        
        <div class="action-buttons">
          <button class="save-button" @click="savePoster">
            <span class="button-icon">💾</span>
            <span>保存海报</span>
          </button>
          
          <button class="share-button" @click="shareToTwitter">
            <span class="button-icon">🐦</span>
            <span>分享结果</span>
          </button>
          
          <button class="restart-button" @click="restartGame">
            <span class="button-icon">🔄</span>
            <span>重新开始</span>
          </button>
        </div>
      </div>
      
      <div class="modal-footer">
        <div class="ai-watermark">AI生成内容 | 集成设计游戏 © 2025</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settlement-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.settlement-modal {
  width: 80%;
  max-width: 800px;
  max-height: 90vh;
  background: linear-gradient(135deg, #f5f7fa, #c3cfe2);
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  overflow: auto;
  display: flex;
  flex-direction: column;
  animation: modal-appear 0.5s ease-out;
}

@keyframes modal-appear {
  0% {
    opacity: 0;
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-header {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  background: linear-gradient(90deg, #a8edea, #fed6e3);
  border-radius: 12px 12px 0 0;
}

.outcome-title {
  margin: 0;
  font-size: 24px;
  color: #333;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.5);
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #555;
  transition: color 0.2s;
}

.close-button:hover {
  color: #000;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
}

.outcome-description {
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 20px;
  padding: 15px;
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.civilization-comment {
  margin-bottom: 20px;
  padding: 15px;
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.civilization-comment h3 {
  margin-top: 0;
  color: #4a6fa5;
  font-size: 18px;
}

.poster-container {
  display: flex;
  justify-content: center;
  margin: 20px 0;
  padding: 10px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.settlement-poster {
  max-width: 100%;
  max-height: 400px;
  object-fit: contain;
  border-radius: 4px;
  image-rendering: pixelated;
}

.action-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

.action-buttons button {
  flex: 1;
  min-width: 120px;
  padding: 10px 15px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.button-icon {
  margin-right: 8px;
  font-size: 18px;
}

.save-button {
  background-color: #4caf50;
  color: white;
}

.save-button:hover {
  background-color: #45a049;
  transform: translateY(-2px);
}

.share-button {
  background-color: #1da1f2;
  color: white;
}

.share-button:hover {
  background-color: #0d95e8;
  transform: translateY(-2px);
}

.restart-button {
  background-color: #f44336;
  color: white;
}

.restart-button:hover {
  background-color: #e53935;
  transform: translateY(-2px);
}

.modal-footer {
  padding: 10px 20px;
  text-align: center;
  font-size: 12px;
  color: #777;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 0 0 12px 12px;
}

.ai-watermark {
  font-style: italic;
}

@media (max-width: 768px) {
  .settlement-modal {
    width: 95%;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .action-buttons button {
    width: 100%;
    margin-bottom: 10px;
  }
}
</style>
