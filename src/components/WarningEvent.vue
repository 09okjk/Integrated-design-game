<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useGameStore } from '../store/gameStore';
import type { WarningEventType } from '../types';

// 游戏状态管理
const gameStore = useGameStore();

// 警告事件状态
const activeWarnings = ref<{
  position: { x: number, y: number },
  type: WarningEventType,
  severity: number,
  id: number
}[]>([]);

// 生成唯一ID
let nextWarningId = 1;

// 警告事件图标和颜色
const warningTypeInfo = computed(() => ({
  flood: {
    icon: '🌊',
    color: '#3b82f6', // 蓝色
    label: '洪水警告'
  },
  drought: {
    icon: '🏜️',
    color: '#f59e0b', // 橙色
    label: '干旱警告'
  },
  wildfire: {
    icon: '🔥',
    color: '#ef4444', // 红色
    label: '野火警告'
  },
  blizzard: {
    icon: '❄️',
    color: '#a1a1aa', // 灰色
    label: '暴风雪警告'
  }
}));

// 处理新的警告事件
const handleWarningEvent = (event: CustomEvent) => {
  const { position, type, severity } = event.detail;
  
  // 添加到活跃警告列表
  activeWarnings.value.push({
    position,
    type,
    severity,
    id: nextWarningId++
  });
  
  // 播放警告音效（可选）
  playWarningSound(type);
};

// 处理文明迁徙事件
const handleCivilizationMigrated = (event: CustomEvent) => {
  const { id, from, to, reason } = event.detail;
  
  // 可以在这里添加迁徙动画或其他视觉效果
  console.log(`文明 ${id} 因为 ${reason} 从 (${from.x}, ${from.y}) 迁徙到 (${to.x}, ${to.y})`);
};

// 播放警告音效
const playWarningSound = (type: WarningEventType) => {
  // 这里可以添加音效播放逻辑
};

// 计算警告事件在屏幕上的位置
const getWarningPosition = (x: number, y: number) => {
  // 获取单元格大小
  const cellSize = 60; // 与游戏地图中的单元格大小保持一致
  
  // 计算警告事件的位置
  return {
    left: `${x * cellSize + cellSize / 2}px`,
    top: `${y * cellSize + cellSize / 2}px`
  };
};

// 更新警告事件状态
const updateWarnings = () => {
  // 检查地图上的警告事件
  const currentWarnings: typeof activeWarnings.value = [];
  
  for (let y = 0; y < gameStore.map.length; y++) {
    for (let x = 0; x < gameStore.map[0].length; x++) {
      const cell = gameStore.map[y][x];
      
      if (cell.warningEvent) {
        // 添加到当前警告列表
        currentWarnings.push({
          position: { x, y },
          type: cell.warningEvent.type,
          severity: cell.warningEvent.severity,
          id: nextWarningId++
        });
      }
    }
  }
  
  // 更新活跃警告列表
  activeWarnings.value = currentWarnings;
};

// 定时器引用
let updateInterval: number | null = null;

// 生命周期钩子
onMounted(() => {
  // 监听警告事件
  window.addEventListener('warning-event', handleWarningEvent as EventListener);
  window.addEventListener('civilization-migrated', handleCivilizationMigrated as EventListener);
  
  // 初始化警告事件状态
  updateWarnings();
  
  // 定期更新警告事件状态
  updateInterval = setInterval(updateWarnings, 5000);
});

onUnmounted(() => {
  // 清理事件监听器
  window.removeEventListener('warning-event', handleWarningEvent as EventListener);
  window.removeEventListener('civilization-migrated', handleCivilizationMigrated as EventListener);
  
  // 清理定时器
  if (updateInterval !== null) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
});
</script>

<template>
  <div class="warning-events-container">
    <!-- 警告事件图标 -->
    <div 
      v-for="warning in activeWarnings" 
      :key="warning.id"
      class="warning-event"
      :style="{
        left: getWarningPosition(warning.position.x, warning.position.y).left,
        top: getWarningPosition(warning.position.x, warning.position.y).top,
        '--warning-color': warningTypeInfo[warning.type].color
      }"
      :title="`${warningTypeInfo[warning.type].label} - 严重程度: ${warning.severity}%`"
    >
      <div class="warning-icon">{{ warningTypeInfo[warning.type].icon }}</div>
      <div class="warning-pulse"></div>
    </div>
  </div>
</template>

<style scoped>
.warning-events-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 50;
}

.warning-event {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 51;
}

.warning-icon {
  font-size: 24px;
  filter: drop-shadow(0 0 5px var(--warning-color));
  animation: bounce 1s infinite alternate;
  z-index: 52;
}

.warning-pulse {
  position: absolute;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: transparent;
  border: 2px solid var(--warning-color);
  animation: pulse 2s infinite;
  z-index: 51;
}

@keyframes pulse {
  0% {
    transform: scale(0.5);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

@keyframes bounce {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-5px);
  }
}
</style>
