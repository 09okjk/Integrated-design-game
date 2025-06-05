<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
// import { useGameStore } from '../store/gameStore';

// const gameStore = useGameStore();

// 特效状态
const effects = ref<Array<{
  id: number;
  x: number;
  y: number;
  active: boolean;
}>>([]);

let nextEffectId = 0;

// 播放文明生成特效
const playCivilizationEffect = (event: CustomEvent) => {
  const { position } = event.detail;
  
  // 创建新的特效
  const newEffect = {
    id: nextEffectId++,
    x: position.x,
    y: position.y,
    active: true
  };
  
  effects.value.push(newEffect);
  
  // 3秒后移除特效
  setTimeout(() => {
    const index = effects.value.findIndex(e => e.id === newEffect.id);
    if (index !== -1) {
      effects.value[index].active = false;
      
      // 再等1秒完全移除（等待淡出动画完成）
      setTimeout(() => {
        effects.value = effects.value.filter(e => e.id !== newEffect.id);
      }, 1000);
    }
  }, 3000);
};

// 生命周期钩子
onMounted(() => {
  // 监听文明生成特效事件
  window.addEventListener('play-civilization-effect', playCivilizationEffect as EventListener);
});

onUnmounted(() => {
  // 移除事件监听
  window.removeEventListener('play-civilization-effect', playCivilizationEffect as EventListener);
});
</script>

<template>
  <div class="civilization-effects-container">
    <div 
      v-for="effect in effects" 
      :key="effect.id"
      class="civilization-effect"
      :class="{ 'effect-active': effect.active, 'effect-fade': !effect.active }"
      :style="{
        left: `${effect.x * 60}px`,
        top: `${effect.y * 60}px`
      }"
    >
      <div class="effect-rays"></div>
      <div class="effect-circle"></div>
      <div class="effect-particles"></div>
    </div>
  </div>
</template>

<style scoped>
.civilization-effects-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 100;
}

.civilization-effect {
  position: absolute;
  width: 60px;
  height: 60px;
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: opacity 0.5s ease;
}

.effect-active {
  opacity: 1;
}

.effect-fade {
  opacity: 0;
}

.effect-rays {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100px;
  height: 100px;
  background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%);
  transform: translate(-50%, -50%);
  animation: pulse 2s ease-in-out infinite;
}

.effect-circle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40px;
  height: 40px;
  background: radial-gradient(circle, rgba(144,238,144,0.9) 0%, rgba(144,238,144,0) 70%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: pulse 1.5s ease-in-out infinite alternate;
}

.effect-particles {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 60px;
  height: 60px;
  transform: translate(-50%, -50%);
}

.effect-particles::before,
.effect-particles::after {
  content: '';
  position: absolute;
  width: 8px;
  height: 8px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  animation: particle 2s ease-out infinite;
}

.effect-particles::before {
  animation-delay: 0.3s;
}

.effect-particles::after {
  animation-delay: 0.6s;
}

@keyframes pulse {
  0% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0.5;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 0.8;
  }
  100% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0.5;
  }
}

@keyframes particle {
  0% {
    transform: translate(0, 0);
    opacity: 1;
  }
  100% {
    transform: translate(
      calc(cos(var(--random-angle, 45deg)) * 30px),
      calc(sin(var(--random-angle, 45deg)) * 30px)
    );
    opacity: 0;
  }
}
</style>
