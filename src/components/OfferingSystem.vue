<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useGameStore } from '../store/gameStore';

// 拖动相关状态
const isDragging = ref(false);
const position = ref({ x: 50, y: 40 }); // 初始位置
const dragOffset = ref({ x: 0, y: 0 });

// 游戏状态管理
const gameStore = useGameStore();

// 供奉系统状态
const offeringPoints = ref(0);
const coins = ref(0);
const animationItems = ref<{id: number, x: number, y: number, targetX: number, targetY: number, progress: number, amount: number}[]>([]);
const animationInProgress = ref(false);

// 计算供奉值进度百分比
const offeringProgress = computed(() => {
  return (offeringPoints.value / 10) * 100;
});

// 更新供奉系统状态
const updateOfferingSystem = (event: CustomEvent) => {
  const { animationQueue } = event.detail;
  
  // 更新供奉值和金币
  offeringPoints.value = gameStore.offeringPoints;
  coins.value = gameStore.coins;
  
  // 如果有新的动画队列，开始动画
  if (animationQueue && animationQueue.length > 0) {
    startOfferingAnimation(animationQueue);
  }
};

// 开始供奉动画
const startOfferingAnimation = async (queue: {civId: number, amount: number}[]) => {
  if (animationInProgress.value) return;
  animationInProgress.value = true;
  
  // 清空现有动画项
  animationItems.value = [];
  
  // 获取供奉系统组件的位置
  const offeringSystemElement = document.querySelector('.offering-system');
  if (!offeringSystemElement) {
    animationInProgress.value = false;
    return;
  }
  
  // 获取金币图标的位置
  const coinIconElement = document.querySelector('.coin-icon');
  if (!coinIconElement) {
    animationInProgress.value = false;
    return;
  }
  
  // 计算金币图标相对于文档的绝对位置
  const coinIconRect = coinIconElement.getBoundingClientRect();
  const targetX = coinIconRect.left + coinIconRect.width / 2;
  const targetY = coinIconRect.top + coinIconRect.height / 2;
  
  // 为每个文明创建动画项
  for (const item of queue) {
    // 获取文明在地图上的位置
    const civ = gameStore.civilizations.find(c => c.id === item.civId);
    if (!civ) continue;
    
    // 获取文明在屏幕上的位置
    const civElement = document.querySelector(`.settlement-${civ.id}`);
    if (!civElement) continue;
    
    const civRect = civElement.getBoundingClientRect();
    const startX = civRect.left + civRect.width / 2;
    const startY = civRect.top + civRect.height / 2;
    
    // 创建动画项
    const coinCount = Math.ceil(item.amount / 10); // 每10点供奉值显示一个金币
    
    for (let i = 0; i < coinCount; i++) {
      // 添加一点随机偏移，使动画更自然
      const offsetX = Math.random() * 20 - 10;
      const offsetY = Math.random() * 20 - 10;
      
      // 添加延迟，使金币不会同时飞出
      await new Promise(resolve => setTimeout(resolve, 100));
      
      animationItems.value.push({
        id: Date.now() + i,
        x: startX + offsetX,
        y: startY + offsetY,
        targetX,
        targetY,
        progress: 0,
        amount: Math.min(10, item.amount - i * 10) // 最后一个金币可能不足10点
      });
    }
  }
  
  // 开始动画
  requestAnimationFrame(updateAnimation);
};

// 更新动画
const updateAnimation = () => {
  if (animationItems.value.length === 0) {
    animationInProgress.value = false;
    return;
  }
  
  let allCompleted = true;
  
  // 更新每个动画项的进度
  animationItems.value.forEach(item => {
    if (item.progress < 1) {
      item.progress += 0.02; // 每帧增加2%的进度
      allCompleted = false;
    }
    
    if (item.progress > 1) {
      item.progress = 1;
    }
  });
  
  // 如果所有动画都完成了，清空动画列表
  if (allCompleted) {
    setTimeout(() => {
      animationItems.value = [];
      animationInProgress.value = false;
    }, 200);
    return;
  }
  
  // 继续下一帧动画
  requestAnimationFrame(updateAnimation);
};

// 计算贝塞尔曲线位置
const getBezierPoint = (item: any) => {
  const t = item.progress;
  const startX = item.x;
  const startY = item.y;
  const endX = item.targetX;
  const endY = item.targetY;
  
  // 控制点：在起点和终点之间，但高度较低（形成抛物线）
  const controlX = (startX + endX) / 2;
  const controlY = Math.min(startY, endY) - 100; // 控制点高度
  
  // 二次贝塞尔曲线公式
  const x = Math.pow(1 - t, 2) * startX + 2 * (1 - t) * t * controlX + Math.pow(t, 2) * endX;
  const y = Math.pow(1 - t, 2) * startY + 2 * (1 - t) * t * controlY + Math.pow(t, 2) * endY;
  
  return { x, y };
};

// 拖动开始
const startDrag = (event: MouseEvent) => {
  // 仅允许鼠标左键拖动
  if (event.button !== 0) return;
  
  isDragging.value = true;
  
  // 计算鼠标与组件左上角的偏移量
  const element = event.currentTarget as HTMLElement;
  const rect = element.getBoundingClientRect();
  
  dragOffset.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
  
  // 添加鼠标移动和松开事件
  document.addEventListener('mousemove', handleDrag);
  document.addEventListener('mouseup', stopDrag);
  
  // 防止默认行为和文本选择
  event.preventDefault();
};

// 拖动过程
const handleDrag = (event: MouseEvent) => {
  if (!isDragging.value) return;
  
  // 计算新位置
  position.value = {
    x: event.clientX - dragOffset.value.x,
    y: event.clientY - dragOffset.value.y
  };
};

// 停止拖动
const stopDrag = () => {
  isDragging.value = false;
  
  // 移除事件监听
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('mouseup', stopDrag);
};

// 生命周期钩子
onMounted(() => {
  // 监听供奉更新事件
  window.addEventListener('offering-update', updateOfferingSystem as EventListener);
  
  // 初始化状态
  offeringPoints.value = gameStore.offeringPoints;
  coins.value = gameStore.coins;
});

onUnmounted(() => {
  // 移除事件监听
  window.removeEventListener('offering-update', updateOfferingSystem as EventListener);
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('mouseup', stopDrag);
});
</script>

<template>
  <div 
    class="offering-system" 
    :style="{
      left: `${position.x}px`,
      top: `${position.y}px`,
      position: 'absolute',
      transform: 'none'
    }"
  >
    <!-- 拖动手柄 -->
    <div class="drag-handle" @mousedown="startDrag" title="点击并拖动移动供奉系统">⋮⋮</div>
    <!-- 供奉值进度条 -->
    <div class="offering-progress">
      <div class="progress-label">供奉值: {{ offeringPoints }}/10</div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${offeringProgress}%` }"></div>
      </div>
    </div>
    
    <!-- 金币计数器 -->
    <div class="coin-counter">
      <div class="coin-icon">🪙</div>
      <div class="coin-count">{{ gameStore.coins }}</div>
    </div>
    
    <!-- 金币动画 -->
    <div class="coin-animations">
      <div 
        v-for="item in animationItems" 
        :key="item.id" 
        class="coin-animation-item"
        :style="{
          left: `${getBezierPoint(item).x}px`,
          top: `${getBezierPoint(item).y}px`,
          opacity: item.progress < 0.9 ? 1 : (1 - (item.progress - 0.9) * 10)
        }"
      >
        🪙
      </div>
    </div>
  </div>
</template>

<style scoped>
.offering-system {
  z-index: 10;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 20px;
  padding: 8px 16px;
  background: linear-gradient(135deg, rgba(134, 239, 172, 0.9), rgba(250, 204, 21, 0.9)); /* 绿色到黄色的渐变 */
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1), 0 0 0 2px rgba(255, 255, 255, 0.5);
  min-width: 300px;
  cursor: move;
  user-select: none;
}

.offering-progress {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.progress-label {
  font-size: 14px;
  font-weight: bold;
  color: #1e3a8a; /* 深蓝色文字 */
}

.progress-bar {
  height: 12px;
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 6px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #fcd34d, #f59e0b); /* 黄色到橙色渐变 */
  border-radius: 6px;
  transition: width 0.3s ease;
}

.coin-counter {
  display: flex;
  align-items: center;
  gap: 8px;
}

.coin-icon {
  font-size: 24px;
  filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.2));
}

.coin-count {
  font-size: 18px;
  font-weight: bold;
  color: #1e3a8a; /* 深蓝色文字 */
}

.coin-animations {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1000;
}

.drag-handle {
  cursor: grab;
  padding: 0 8px;
  font-size: 18px;
  color: rgba(30, 58, 138, 0.7);
  border-radius: 4px;
  margin-right: 5px;
  transition: all 0.2s ease;
}

.drag-handle:hover {
  background-color: rgba(255, 255, 255, 0.3);
  color: rgba(30, 58, 138, 1);
}

.drag-handle:active {
  cursor: grabbing;
}

.coin-animation-item {
  position: absolute;
  font-size: 20px;
  transform: translate(-50%, -50%);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  transition: opacity 0.2s ease;
}
</style>
