<script setup lang="ts">
import { ref, watch } from 'vue';
import soundService from '../services/SoundService';

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits(['close']);

// 音量设置
const musicVolume = ref(30); // 默认30%
const soundVolume = ref(50); // 默认50%
const brightness = ref(100); // 默认100%

// 监听音量变化
watch(musicVolume, (newValue) => {
  soundService.setMusicVolume(newValue / 100);
});

watch(soundVolume, (newValue) => {
  soundService.setVolume(newValue / 100);
});

// 监听亮度变化
watch(brightness, (newValue) => {
  document.documentElement.style.filter = `brightness(${newValue}%)`;
});

// 关闭设置面板
const closeSettings = () => {
  emit('close');
};
</script>

<template>
  <div v-if="visible" class="settings-overlay">
    <div class="settings-panel">
      <h2>游戏设置</h2>
      
      <div class="settings-group">
        <label for="music-volume">背景音乐音量: {{ musicVolume }}%</label>
        <input 
          id="music-volume" 
          type="range" 
          min="0" 
          max="100" 
          v-model="musicVolume" 
          class="slider"
        />
      </div>
      
      <div class="settings-group">
        <label for="sound-volume">音效音量: {{ soundVolume }}%</label>
        <input 
          id="sound-volume" 
          type="range" 
          min="0" 
          max="100" 
          v-model="soundVolume" 
          class="slider"
        />
      </div>
      
      <div class="settings-group">
        <label for="brightness">屏幕亮度: {{ brightness }}%</label>
        <input 
          id="brightness" 
          type="range" 
          min="50" 
          max="150" 
          v-model="brightness" 
          class="slider"
        />
      </div>
      
      <button @click="closeSettings" class="close-button">确定</button>
    </div>
  </div>
</template>

<style scoped>
.settings-overlay {
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

.settings-panel {
  background-color: rgba(255, 255, 255, 0.9);
  border: 2px solid rgba(147, 197, 253, 0.7);
  border-radius: 16px;
  padding: 2rem;
  width: 400px;
  max-width: 90%;
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

.settings-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 1rem;
  color: rgba(30, 41, 59, 0.8);
}

.slider {
  width: 100%;
  height: 8px;
  background: rgba(219, 234, 254, 0.5);
  border-radius: 4px;
  outline: none;
  -webkit-appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.9), rgba(59, 130, 246, 0.9));
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid white;
}

.slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.9), rgba(59, 130, 246, 0.9));
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid white;
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
