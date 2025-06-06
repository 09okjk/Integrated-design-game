<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits(['close']);

// 关闭菜单
const closeMenu = () => {
  emit('close');
};
</script>

<template>
  <div v-if="visible" class="menu-overlay">
    <div class="menu-panel">
      <h2>游戏介绍</h2>
      
      <div class="menu-content">
        <p>《自然协奏曲：原始时代》是一款关于人与自然和谐共存的模拟游戏。</p>
        <p>你将扮演"气候之神"，通过调节局部天气参数（炎热、寒冷、干旱、潮湿），间接影响水文、地形及长期气候趋势，体验人类活动对自然的影响。</p>
        
        <h3>游戏目标</h3>
        <p>引导人类文明与自然和谐发展，避免极端环境灾害，帮助文明繁荣发展。</p>
        
        <h3>游戏特色</h3>
        <ul>
          <li>动态地形变化：天气会影响地形，如沙漠化、洪水等</li>
          <li>多种文明类型：游牧、农耕、渔猎等不同文明类型</li>
          <li>村民互动：满足村民需求，获得奖励</li>
          <li>气候系统：调节温度和湿度，影响环境变化</li>
        </ul>
      </div>
      
      <button @click="closeMenu" class="close-button">返回</button>
    </div>
  </div>
</template>

<style scoped>
.menu-overlay {
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

.menu-panel {
  background-color: rgba(255, 255, 255, 0.9);
  border: 2px solid rgba(147, 197, 253, 0.7);
  border-radius: 16px;
  padding: 2rem;
  width: 600px;
  max-width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 8px 30px rgba(147, 197, 253, 0.4),
              0 0 15px rgba(167, 243, 208, 0.5);
  backdrop-filter: blur(8px);
}

h2 {
  font-size: 1.8rem;
  color: rgba(37, 99, 235, 0.9);
  margin-bottom: 1.5rem;
  text-align: center;
}

h3 {
  font-size: 1.3rem;
  color: rgba(74, 222, 128, 0.9);
  margin-top: 1.5rem;
  margin-bottom: 0.8rem;
}

.menu-content {
  margin-bottom: 2rem;
  line-height: 1.6;
  color: rgba(30, 41, 59, 0.8);
}

.menu-content p {
  margin-bottom: 1rem;
}

ul {
  padding-left: 1.5rem;
  margin-bottom: 1rem;
}

li {
  margin-bottom: 0.5rem;
}

.close-button {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.9), rgba(59, 130, 246, 0.9));
  color: rgba(255, 255, 255, 0.95);
  border: 2px solid rgba(191, 219, 254, 0.8);
  border-radius: 8px;
  padding: 0.6rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: block;
  margin: 0 auto;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
}

.close-button:hover {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(96, 165, 250, 0.9));
  transform: scale(1.05);
  box-shadow: 0 6px 15px rgba(59, 130, 246, 0.7);
}
</style>
