<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { WarningEventType } from '../types';

// 定义组件属性
const props = defineProps<{
  visible: boolean;
  type?: WarningEventType;
  onClose: () => void;
}>();

// 教程内容
const tutorialContent = computed(() => {
  if (!props.type) return { title: '', content: '', icon: '' };
  
  switch (props.type) {
    case 'flood':
      return {
        title: '洪水警告',
        icon: '🌊',
        content: `
          <p>洪水警告表示该地区即将被淹没！</p>
          <ul>
            <li>洪水会迫使文明迁徙到更安全的地区</li>
            <li>洪水过后，平原可能会变成水域</li>
            <li>农耕文明受洪水影响最大，他们会寻找新的平原定居</li>
          </ul>
          <p>提示：尝试使用天气控制工具降低湿度，可以减少洪水发生的概率。</p>
        `
      };
    case 'drought':
      return {
        title: '干旱警告',
        icon: '🏜️',
        content: `
          <p>干旱警告表示该地区水资源严重不足！</p>
          <ul>
            <li>干旱会导致文明的食物产量大幅下降</li>
            <li>文明会被迫迁徙到湿度更高的地区</li>
            <li>长期干旱会导致平原变成沙漠</li>
          </ul>
          <p>提示：尝试使用天气控制工具增加湿度，可以缓解干旱。</p>
        `
      };
    case 'wildfire':
      return {
        title: '野火警告',
        icon: '🔥',
        content: `
          <p>野火警告表示该地区正在发生火灾！</p>
          <ul>
            <li>野火会摧毁文明的资源和住所</li>
            <li>文明会迅速迁徙到安全地区</li>
            <li>高温和低湿度增加野火发生的概率</li>
          </ul>
          <p>提示：尝试使用天气控制工具降低温度或增加湿度，可以预防野火。</p>
        `
      };
    case 'blizzard':
      return {
        title: '暴风雪警告',
        icon: '❄️',
        content: `
          <p>暴风雪警告表示该地区正在遭受极寒天气！</p>
          <ul>
            <li>暴风雪会导致文明的活动受限</li>
            <li>文明会迁徙到温度更高的地区</li>
            <li>低温会减缓文明的发展速度</li>
          </ul>
          <p>提示：尝试使用天气控制工具增加温度，可以缓解暴风雪的影响。</p>
        `
      };
    default:
      return { title: '', content: '', icon: '' };
  }
});

// 动画状态
const animationState = ref('entering');

// 处理关闭
const handleClose = () => {
  animationState.value = 'leaving';
  setTimeout(() => {
    props.onClose();
  }, 300);
};

// 生命周期钩子
onMounted(() => {
  // 添加键盘事件监听
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  // 移除键盘事件监听
  window.removeEventListener('keydown', handleKeyDown);
});

// 处理键盘事件
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.visible) {
    handleClose();
  }
};
</script>

<template>
  <div v-if="visible" class="tutorial-overlay" :class="animationState">
    <div class="tutorial-popup">
      <div class="tutorial-header">
        <div class="tutorial-icon">{{ tutorialContent.icon }}</div>
        <h2>{{ tutorialContent.title }}</h2>
        <button class="close-button" @click="handleClose">×</button>
      </div>
      <div class="tutorial-content" v-html="tutorialContent.content"></div>
      <div class="tutorial-footer">
        <button class="tutorial-button" @click="handleClose">我知道了</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tutorial-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.tutorial-popup {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  width: 500px;
  max-width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.tutorial-header {
  background-color: #f0f0f0;
  padding: 15px 20px;
  border-bottom: 1px solid #ddd;
  display: flex;
  align-items: center;
  position: relative;
}

.tutorial-icon {
  font-size: 24px;
  margin-right: 10px;
}

.tutorial-header h2 {
  margin: 0;
  font-size: 18px;
  color: #333;
  flex-grow: 1;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.tutorial-content {
  padding: 20px;
  line-height: 1.6;
  color: #333;
}

.tutorial-content ul {
  padding-left: 20px;
}

.tutorial-content li {
  margin-bottom: 8px;
}

.tutorial-footer {
  padding: 15px 20px;
  border-top: 1px solid #ddd;
  text-align: right;
}

.tutorial-button {
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.tutorial-button:hover {
  background-color: #45a049;
}

/* 动画 */
.entering {
  animation: fadeIn 0.3s ease-out forwards;
}

.leaving {
  animation: fadeOut 0.3s ease-in forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
</style>
