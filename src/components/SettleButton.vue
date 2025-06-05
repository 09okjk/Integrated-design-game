<script setup lang="ts">
import { ref } from 'vue';
import { useGameStore } from '../store/gameStore';

// const gameStore = useGameStore();

// 定义事件
const emit = defineEmits(['settle']);

// 按钮状态
const isHovered = ref(false);
const isAnimating = ref(false);

// 处理结算按钮点击
const handleSettlement = () => {
  if (isAnimating.value) return;
  
  isAnimating.value = true;
  
  // 播放点击动画
  setTimeout(() => {
    isAnimating.value = false;
    // 触发结算事件
    emit('settle');
  }, 300);
};
</script>

<template>
  <div 
    class="settle-button" 
    :class="{ 'button-hover': isHovered, 'button-click': isAnimating }"
    @click="handleSettlement"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <div class="button-icon">📜</div>
    <div class="button-text">结算本局</div>
  </div>
</template>

<style scoped>
.settle-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #f6d365, #fda085);
  border-radius: 50%;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 100;
  user-select: none;
}

.button-hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3);
  background: linear-gradient(135deg, #f6d365, #ff7b54);
}

.button-click {
  transform: scale(0.9);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.button-icon {
  font-size: 28px;
  margin-bottom: 5px;
}

.button-text {
  font-size: 12px;
  font-weight: bold;
  color: #333;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.5);
}

@media (max-width: 768px) {
  .settle-button {
    width: 60px;
    height: 60px;
    bottom: 15px;
    right: 15px;
  }
  
  .button-icon {
    font-size: 22px;
  }
  
  .button-text {
    font-size: 10px;
  }
}
</style>
