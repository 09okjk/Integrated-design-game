<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useGameStore } from '../store/gameStore';

// 游戏状态管理
const gameStore = useGameStore();

// 活跃的迁徙动画
const activeMigrations = ref<{
  id: number;
  from: { x: number, y: number };
  to: { x: number, y: number };
  progress: number;
  type: string;
  reason: string;
  startTime: number;
}[]>([]);

// 生成唯一ID
let nextMigrationId = 1;

// 单元格大小
const cellSize = 60; // 与地图单元格大小保持一致

// 处理文明迁徙事件
const handleCivilizationMigrated = (event: CustomEvent) => {
  const { id, from, to, reason } = event.detail;
  
  // 获取文明类型
  const civ = gameStore.civilizations.find(c => c.id === id);
  const type = civ ? civ.type : 'unknown';
  
  // 添加到活跃迁徙列表
  activeMigrations.value.push({
    id: nextMigrationId++,
    from,
    to,
    progress: 0,
    type,
    reason,
    startTime: Date.now()
  });
  
  console.log(`添加迁徙动画: 从 (${from.x}, ${from.y}) 到 (${to.x}, ${to.y})`);
};

// 计算迁徙图标
const getMigrationIcon = (type: string) => {
  switch (type) {
    case 'agriculture':
      return '🏡';
    case 'nomad':
      return '⛺';
    case 'fishing':
      return '🛶';
    default:
      return '👥';
  }
};

// 计算动画位置
const getMigrationPosition = (migration: typeof activeMigrations.value[0]) => {
  const { from, to, progress } = migration;
  
  // 线性插值计算当前位置
  const x = from.x + (to.x - from.x) * progress;
  const y = from.y + (to.y - from.y) * progress;
  
  // 添加抛物线效果（在中间位置时升高）
  const parabolicHeight = Math.sin(progress * Math.PI) * 1.5;
  
  return {
    left: `${x * cellSize + cellSize / 2}px`,
    top: `${y * cellSize + cellSize / 2 - parabolicHeight * cellSize}px`
  };
};

// 更新迁徙动画
const updateMigrations = () => {
  const now = Date.now();
  const migrationDuration = 2000; // 迁徙动画持续2秒
  
  // 更新每个迁徙的进度
  activeMigrations.value.forEach(migration => {
    const elapsed = now - migration.startTime;
    migration.progress = Math.min(elapsed / migrationDuration, 1);
  });
  
  // 移除已完成的迁徙
  activeMigrations.value = activeMigrations.value.filter(migration => migration.progress < 1);
};

// 动画帧
let animationFrame: number | null = null;

// 动画循环
const animate = () => {
  updateMigrations();
  animationFrame = requestAnimationFrame(animate);
};

// 生命周期钩子
onMounted(() => {
  // 监听文明迁徙事件
  window.addEventListener('civilization-migrated', handleCivilizationMigrated as EventListener);
  
  // 启动动画循环
  animationFrame = requestAnimationFrame(animate);
});

onUnmounted(() => {
  // 移除事件监听
  window.removeEventListener('civilization-migrated', handleCivilizationMigrated as EventListener);
  
  // 停止动画循环
  if (animationFrame !== null) {
    cancelAnimationFrame(animationFrame);
  }
});
</script>

<template>
  <div class="migration-animations-container">
    <!-- 迁徙动画 -->
    <div 
      v-for="migration in activeMigrations" 
      :key="migration.id"
      class="migration-animation"
      :style="{
        left: getMigrationPosition(migration).left,
        top: getMigrationPosition(migration).top
      }"
      :title="`文明迁徙: 因${migration.reason}从(${migration.from.x},${migration.from.y})到(${migration.to.x},${migration.to.y})`"
    >
      <div class="migration-icon">
        {{ getMigrationIcon(migration.type) }}
      </div>
      <div class="migration-trail"></div>
    </div>
  </div>
</template>

<style scoped>
.migration-animations-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 60;
}

.migration-animation {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 61;
}

.migration-icon {
  font-size: 24px;
  filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.8));
  animation: float 0.5s infinite alternate;
  z-index: 62;
}

.migration-trail {
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.3);
  animation: trail 1s infinite;
  z-index: 61;
}

@keyframes float {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-5px);
  }
}

@keyframes trail {
  0% {
    transform: scale(0.5);
    opacity: 0.8;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}
</style>
