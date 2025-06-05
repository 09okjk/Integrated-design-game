<template>
  <div v-if="showWarning" class="extreme-environment-warning" :class="{ 'pulse': remainingSeconds <= 10 }">
    <div class="warning-content">
      <div class="warning-icon">⚠️</div>
      <div class="warning-text">
        <h3>极端环境警告</h3>
        <p>沙漠化严重！生态系统即将崩溃</p>
        <p>倒计时: <span class="countdown">{{ formatTime(remainingSeconds) }}</span></p>
      </div>
    </div>
    <div class="warning-description">
      <p>当前地图上有 <span class="highlight">{{ desertCount }}</span> 个沙漠地块</p>
      <p>如果极端环境持续，文明将在倒计时结束后灭亡</p>
      <p>请立即采取行动，降低沙漠地块数量低于 {{ threshold }} 个</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useGameStore } from '../store/gameStore';

const gameStore = useGameStore();

// 计算属性：是否显示警告
const showWarning = computed(() => gameStore.showExtremeEnvironmentWarning);

// 计算属性：沙漠地块数量
const desertCount = computed(() => {
  let count = 0;
  for (let y = 0; y < gameStore.map.length; y++) {
    for (let x = 0; x < gameStore.map[y].length; x++) {
      if (gameStore.map[y][x].terrain === 'desert') {
        count++;
      }
    }
  }
  return count;
});

// 计算属性：阈值
const threshold = computed(() => gameStore.extremeEnvironmentThreshold);

// 剩余秒数
const remainingSeconds = ref(60);

// 格式化时间
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

// 更新倒计时
const updateCountdown = () => {
  if (!showWarning.value) return;
  
  const now = Date.now();
  const elapsed = now - gameStore.extremeEnvironmentCountdownStart;
  const remaining = Math.max(0, Math.floor((gameStore.extremeEnvironmentDuration - elapsed) / 1000));
  
  remainingSeconds.value = remaining;
};

// 计时器
let countdownTimer: number | null = null;

// 生命周期钩子
onMounted(() => {
  // 启动倒计时更新
  countdownTimer = window.setInterval(updateCountdown, 1000);
});

onUnmounted(() => {
  // 清除计时器
  if (countdownTimer !== null) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
});

// 监听警告状态变化
watch(showWarning, (newValue) => {
  if (newValue) {
    // 重置倒计时
    updateCountdown();
  }
});
</script>

<style scoped>
.extreme-environment-warning {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(185, 28, 28, 0.85));
  border: 2px solid rgba(248, 113, 113, 0.6);
  border-radius: 10px;
  padding: 15px 20px;
  color: white;
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.5);
  z-index: 1000;
  max-width: 450px;
  backdrop-filter: blur(4px);
  animation: slide-in 0.5s ease-out forwards;
}

.warning-content {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.warning-icon {
  font-size: 32px;
  margin-right: 15px;
}

.warning-text {
  flex: 1;
}

.warning-text h3 {
  margin: 0 0 5px 0;
  font-size: 18px;
  font-weight: 600;
}

.warning-text p {
  margin: 3px 0;
  font-size: 14px;
}

.countdown {
  font-weight: bold;
  font-size: 16px;
  font-family: monospace;
}

.warning-description {
  border-top: 1px solid rgba(255, 255, 255, 0.3);
  padding-top: 10px;
  font-size: 13px;
}

.warning-description p {
  margin: 5px 0;
  line-height: 1.4;
}

.highlight {
  color: #fef08a;
  font-weight: bold;
}

.pulse {
  animation: pulse 0.7s infinite alternate;
}

@keyframes slide-in {
  from {
    transform: translateX(-50%) translateY(-50px);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}

@keyframes pulse {
  from {
    box-shadow: 0 4px 15px rgba(239, 68, 68, 0.5);
  }
  to {
    box-shadow: 0 4px 25px rgba(239, 68, 68, 0.9);
  }
}
</style>
