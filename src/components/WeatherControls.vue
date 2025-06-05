<script setup lang="ts">
import { computed } from 'vue';
import type { Coordinate } from '../types';

const props = defineProps<{
  position: Coordinate;
  cellSize: number;
}>();

const emit = defineEmits(['apply-weather', 'close']);

// 计算浮窗位置
const popupStyle = computed(() => {
  const x = props.position.x * props.cellSize;
  const y = props.position.y * props.cellSize;
  
  return {
    left: `${x + props.cellSize / 2}px`,
    top: `${y + props.cellSize / 2}px`,
  };
});

// 应用天气效果
const applyWeather = (effect: string) => {
  emit('apply-weather', effect);
};

// 关闭浮窗
const closeControls = () => {
  emit('close');
};
</script>

<template>
  <div class="weather-controls" :style="popupStyle">
    <div class="weather-popup">
      <div class="popup-header">
        <h3>调节天气</h3>
        <button class="close-btn" @click="closeControls">×</button>
      </div>
      
      <div class="weather-buttons">
        <button 
          class="weather-btn hot-btn" 
          @click="applyWeather('hot')"
          title="炎热"
        >
          <span class="effect-icon">H</span>
        </button>
        
        <button 
          class="weather-btn cold-btn" 
          @click="applyWeather('cold')"
          title="寒冷"
        >
          <span class="effect-icon">C</span>
        </button>
        
        <button 
          class="weather-btn dry-btn" 
          @click="applyWeather('dry')"
          title="干旱"
        >
          <span class="effect-icon">D</span>
        </button>
        
        <button 
          class="weather-btn wet-btn" 
          @click="applyWeather('wet')"
          title="潮湿"
        >
          <span class="effect-icon">W</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.weather-controls {
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 100;
}

.weather-popup {
  background-color: rgba(17, 24, 39, 0.95); /* 马卡龙深色背景 */
  border: 2px solid rgba(191, 219, 254, 0.7); /* 马卡龙浅蓝色边框 */
  border-radius: 10px;
  padding: 15px;
  width: 200px;
  font-family: 'Courier New', monospace;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
  box-shadow: 0 4px 15px rgba(30, 64, 175, 0.5), /* 蓝色阴影 */
              0 0 20px rgba(96, 165, 250, 0.4); /* 发光效果 */
  backdrop-filter: blur(4px); /* 模糊效果 */
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
  border-bottom: 1px solid rgba(147, 197, 253, 0.3); /* 马卡龙浅蓝色分隔线 */
  padding-bottom: 10px;
}

.popup-header h3 {
  margin: 0;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.95);
  text-transform: uppercase;
  letter-spacing: 1.5px;
  text-shadow: 0 0 8px rgba(96, 165, 250, 0.5); /* 蓝色光晕文字 */
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: rgba(147, 197, 253, 0.8); /* 马卡龙浅蓝色 */
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  color: rgba(255, 255, 255, 0.95);
  background-color: rgba(37, 99, 235, 0.4); /* 马卡龙半透明蓝色 */
  transform: rotate(90deg);
}

.weather-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.weather-btn {
  border: 2px solid rgba(255, 255, 255, 0.8);
  width: 70px;
  height: 70px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  font-family: 'Courier New', monospace;
  font-weight: bold;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
}

.weather-btn:hover {
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 7px 10px rgba(0, 0, 0, 0.3),
              0 0 15px rgba(255, 255, 255, 0.2);
}

.weather-btn:active {
  transform: scale(0.95);
  box-shadow: 0 2px 3px rgba(0, 0, 0, 0.2);
}

/* 马卡龙色系控制按钮 */
.hot-btn {
  background: linear-gradient(145deg, rgba(251, 113, 133, 0.8), rgba(244, 63, 94, 0.8)); /* 马卡龙粉色 */
  color: rgba(255, 255, 255, 0.95);
  border-color: rgba(253, 164, 175, 0.8); /* 浅粉色边框 */
  text-shadow: 0 0 10px rgba(254, 202, 202, 0.7); /* 粉色光晕 */
}

.cold-btn {
  background: linear-gradient(145deg, rgba(186, 230, 253, 0.8), rgba(125, 211, 252, 0.8)); /* 马卡龙浅蓝色 */
  color: rgba(3, 7, 18, 0.8);
  border-color: rgba(224, 242, 254, 0.8); /* 浅蓝色边框 */
  text-shadow: 0 0 8px rgba(186, 230, 253, 0.7); /* 浅蓝色光晕 */
}

.dry-btn {
  background: linear-gradient(145deg, rgba(252, 211, 77, 0.8), rgba(251, 191, 36, 0.8)); /* 马卡龙黄色 */
  color: rgba(3, 7, 18, 0.8);
  border-color: rgba(254, 240, 138, 0.8); /* 浅黄色边框 */
  text-shadow: 0 0 8px rgba(254, 240, 138, 0.7); /* 黄色光晕 */
}

.wet-btn {
  background: linear-gradient(145deg, rgba(134, 239, 172, 0.8), rgba(74, 222, 128, 0.8)); /* 马卡龙绿色 */
  color: rgba(3, 7, 18, 0.8);
  border-color: rgba(187, 247, 208, 0.8); /* 浅绿色边框 */
  text-shadow: 0 0 8px rgba(187, 247, 208, 0.7); /* 绿色光晕 */
}

.effect-icon {
  font-size: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.15);
  box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.1);
  animation: iconPulse 2s infinite ease-in-out;
}

@keyframes iconPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

/* 按钮点击后的光效动画 - 马卡龙风格 */
.weather-btn::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  background: rgba(255, 255, 255, 0.9);
  opacity: 0;
  border-radius: 100%;
  transform: scale(1, 1) translate(-50%, -50%);
  transform-origin: 50% 50%;
  filter: blur(1px);
}

.weather-btn:active::after {
  animation: macaronPulse 1s cubic-bezier(0.165, 0.84, 0.44, 1);
}

/* 马卡龙风格的按钮动画 */
@keyframes macaronPulse {
  0% {
    transform: scale(0.2, 0.2) translate(-50%, -50%);
    opacity: 0.9;
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.8);
  }
  50% {
    opacity: 0.5;
  }
  100% {
    transform: scale(3, 3) translate(-50%, -50%);
    opacity: 0;
    box-shadow: 0 0 0 rgba(255, 255, 255, 0);
  }
}
</style>
