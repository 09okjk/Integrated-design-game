<script setup lang="ts">
import { ref, onMounted } from 'vue';
import soundService from '../services/SoundService';

// 音乐状态
const isMusicMuted = ref(false);

// 组件挂载时自动播放背景音乐
onMounted(() => {
  // 默认打开音乐
  soundService.setMusicMuted(false);
  soundService.playBackgroundMusic();
  
  // 初始化状态
  isMusicMuted.value = soundService.getMusicMuted();
});

// 切换音乐状态
const toggleMusic = () => {
  isMusicMuted.value = soundService.toggleMusicMute();
};
</script>

<template>
  <div class="music-control">
    <button 
      class="music-button" 
      @click="toggleMusic" 
      :title="isMusicMuted ? '打开背景音乐' : '关闭背景音乐'"
    >
      <div class="music-icon" :class="{ 'muted': isMusicMuted }">
        <span v-if="!isMusicMuted" class="music-waves">
          <span class="wave wave1"></span>
          <span class="wave wave2"></span>
          <span class="wave wave3"></span>
        </span>
        <span v-else class="mute-line"></span>
      </div>
    </button>
  </div>
</template>

<style scoped>
.music-control {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
}

.music-button {
  background: rgba(255, 255, 255, 0.8);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.music-button:hover {
  background: rgba(255, 255, 255, 1);
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.music-icon {
  position: relative;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
}

.music-icon:before {
  content: '';
  position: absolute;
  width: 8px;
  height: 8px;
  background: #4a6fa5;
  border-radius: 50%;
  left: 0;
}

.music-icon:after {
  content: '';
  position: absolute;
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
  border-right: 8px solid #4a6fa5;
  left: 4px;
}

.music-waves {
  position: absolute;
  display: flex;
  align-items: center;
  left: 14px;
}

.wave {
  position: absolute;
  background: #4a6fa5;
  width: 2px;
  border-radius: 1px;
  animation: wave-animation 1s infinite ease-in-out;
}

.wave1 {
  height: 10px;
  left: 0;
  animation-delay: 0s;
}

.wave2 {
  height: 14px;
  left: 4px;
  animation-delay: 0.2s;
}

.wave3 {
  height: 8px;
  left: 8px;
  animation-delay: 0.4s;
}

@keyframes wave-animation {
  0%, 100% {
    transform: scaleY(1);
  }
  50% {
    transform: scaleY(0.6);
  }
}

.mute-line {
  position: absolute;
  width: 20px;
  height: 2px;
  background: #e74c3c;
  transform: rotate(-45deg);
  left: 6px;
  border-radius: 1px;
}

.muted:before, .muted:after {
  background: #a0a0a0;
  border-right-color: #a0a0a0;
}
</style>
