<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import MapCell from './MapCell.vue';
import WeatherControls from './WeatherControls.vue';
import MapTooltip from './MapTooltip.vue';
import OfferingSystem from './OfferingSystem.vue';
import WarningEvent from './WarningEvent.vue';
import MigrationAnimation from './MigrationAnimation.vue';
import { useGameStore } from '../store/gameStore';
import type { Cell, Coordinate } from '../types';

const gameStore = useGameStore();

// 选中的网格
const selectedCell = ref<Coordinate | null>(null);
const showWeatherControls = ref(false);

// 鼠标悬停相关数据
const hoveredCell = ref<Coordinate | null>(null);
const hoveredCellData = ref<Cell | null>(null);

// 定义事件监听器函数
const scrollToPositionListener = ((event: CustomEvent) => {
  const { position } = event.detail;
  scrollToPosition(position);
}) as EventListener;

// 创建文明生成事件监听器
const generateCivilizationListener = ((event: CustomEvent) => {
  const { position, type } = event.detail;
  // 调用游戏状态管理创建指定类型的文明
  gameStore.createCivilizationOfType(position, type);
  // 滚动到新文明位置
  setTimeout(() => {
    scrollToPosition(position);
  }, 500);
}) as EventListener;

// 使用更改过的数据结构跟踪实时鼠标位置
const mousePosition = ref({
  x: 0,
  y: 0,
  absoluteX: 0,
  absoluteY: 0,
  valid: false  // 当鼠标悬停在单元格上时为true
});

// 添加全局鼠标移动跟踪 - 使用更兼容的坐标系统
const trackMouse = (event: MouseEvent) => {
  if (hoveredCell.value) { // 只有当悬停单元格时才更新
    // 使用clientX/Y为基本坐标，但同时记录pageX/Y以兼容所有浏览器
    mousePosition.value = {
      x: event.clientX,
      y: event.clientY,
      absoluteX: event.pageX || event.clientX, // 使用pageX来根据页面滚动位置计算
      absoluteY: event.pageY || event.clientY, // 兼容旧浏览器
      valid: true
    };
  }
};

// 地图尺寸
const GRID_WIDTH = 15; // 横向网格数
const GRID_HEIGHT = 12; // 纵向网格数
const cellSize = 60; // 保持原来的单元格大小

// 滚动到指定位置的函数
const scrollToPosition = (position: { x: number, y: number }) => {
  if (!position || position.x === undefined || position.y === undefined) {
    console.error('无效的位置坐标');
    return;
  }
  
  // 计算目标元素的位置
  const targetElement = document.querySelector(`.map-cell[data-x="${position.x}"][data-y="${position.y}"]`);
  
  if (targetElement) {
    // 使用平滑滚动效果
    targetElement.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center', 
      inline: 'center' 
    });
    
    // 添加临时高亮效果
    targetElement.classList.add('map-cell-highlight-scroll');
    setTimeout(() => {
      targetElement.classList.remove('map-cell-highlight-scroll');
    }, 3000);
  } else {
    console.warn(`找不到位置 (${position.x}, ${position.y}) 的地图单元格`);
  }
};

// 生成初始地图数据
onMounted(() => {
  console.log('游戏地图初始化');
  
  // 添加滚动到位置的事件监听器
  window.addEventListener('scroll-to-position', scrollToPositionListener);
  
  // 添加文明生成事件监听器
  window.addEventListener('generate-new-civilization', generateCivilizationListener);
  
  gameStore.initializeMap(GRID_WIDTH, GRID_HEIGHT); // 传入宽度和高度
  
  // 添加全局鼠标移动事件监听器
  window.addEventListener('mousemove', trackMouse);
});

onBeforeUnmount(() => {
  // 清理全局事件监听器
  window.removeEventListener('mousemove', trackMouse);
  window.removeEventListener('scroll-to-position', scrollToPositionListener);
  window.removeEventListener('generate-new-civilization', generateCivilizationListener);
});

// 处理点击事件
const handleCellClick = (x: number, y: number) => {
  selectedCell.value = { x, y };
  showWeatherControls.value = true;
  
  // 更新控制面板显示的选中网格信息
  gameStore.selectCell(x, y);
};

// 处理鼠标悬停事件
const handleCellHover = (x: number, y: number, event: MouseEvent) => {
  // 设置悬停单元格的信息
  hoveredCell.value = { x, y };
  hoveredCellData.value = gameStore.getCellAt(x, y);
  
  // 在控制台记录当前悬停的单元格坐标
  console.log('悬停单元格坐标:', { x, y });
  
  // 获取事件的目标元素（即当前悬停的单元格元素）
  // 使用直接的目标获取方式，确保能获取到正确的元素
  const cellElement = event.target as HTMLElement;
  const cellRect = cellElement.getBoundingClientRect();
  
  // 打印单元格元素位置信息以进行调试
  console.log('单元格元素位置信息:', {
    left: cellRect.left,
    top: cellRect.top,
    width: cellRect.width,
    height: cellRect.height,
    right: cellRect.right,
    bottom: cellRect.bottom
  });
  
  // 使用不同系统的坐标来确保兼容性
  mousePosition.value = {
    // 保存多种坐标表示方式以兼容不同浏览器
    x: event.clientX,
    y: event.clientY,
    absoluteX: event.pageX || event.clientX,
    absoluteY: event.pageY || event.clientY,
    // 避免滚动引起的偏移
    // screenX: event.screenX,
    // screenY: event.screenY,
    // 添加单元格的网格坐标
    cellX: x,
    cellY: y,
    // 添加单元格元素在视窗中的位置
    cellLeft: cellRect.left,
    cellTop: cellRect.top,
    cellWidth: cellRect.width,
    cellHeight: cellRect.height,
    cellRight: cellRect.right,
    cellBottom: cellRect.bottom,
    valid: true  // 标记为有效，激活提示框显示
  };
};

// 处理鼠标离开事件
const handleCellLeave = () => {
  hoveredCell.value = null;
  hoveredCellData.value = null;
  // 清除提示框显示状态
  mousePosition.value.valid = false;
};

// 处理天气调节
const applyWeatherEffect = (effect: string) => {
  if (!selectedCell.value) return;
  
  const { x, y } = selectedCell.value;
  // 确保类型安全
  gameStore.applyWeather(x, y, effect as any);
  showWeatherControls.value = false;
};

// 关闭天气控制面板
const closeWeatherControls = () => {
  showWeatherControls.value = false;
};

// 创建一个空的单元格数据，用于地图加载前的默认显示
const createEmptyCell = (): Cell => {
  return {
    terrain: 'plain',
    temperature: 50,
    humidity: 50,
    settlement: null,
    activeWeatherEffects: [],
    lastUpdated: Date.now()
  };
};
</script>

<template>
  <div class="game-map-container">
    <div class="map-status-info">
      地图状态: {{ gameStore.map.length > 0 ? '已加载' : '未加载' }} ({{ GRID_WIDTH }}x{{ GRID_HEIGHT }})
    </div>
    
    <!-- 供奉系统 -->
    <OfferingSystem />
    <div class="game-map-wrapper">
      <!-- X坐标标记（上方） -->
      <div class="coordinate-x-labels">
        <div 
          v-for="x in GRID_WIDTH" 
          :key="`x-label-${x}`" 
          class="coordinate-label x-label"
          :style="{ width: `${cellSize}px`, marginRight: '2px' }"
        >
          {{ x - 1 }}
        </div>
      </div>
      
      <div class="map-with-y-labels">
        <!-- Y坐标标记（左侧） -->
        <div class="coordinate-y-labels">
          <div 
            v-for="y in GRID_HEIGHT" 
            :key="`y-label-${y}`" 
            class="coordinate-label y-label"
            :style="{ height: `${cellSize}px`, marginBottom: '2px' }"
          >
            {{ y - 1 }}
          </div>
        </div>
        
        <div 
          class="game-map" 
          :style="{ width: `${GRID_WIDTH * cellSize}px`, height: `${GRID_HEIGHT * cellSize}px` }"
        >
      <template v-if="gameStore.map.length > 0">
        <template v-for="y in GRID_HEIGHT">
          <MapCell
            v-for="x in GRID_WIDTH"
            :key="`${x}-${y}`"
            :x="x-1" 
            :y="y-1"
            :cell-data="gameStore.map[y-1]?.[x-1] || createEmptyCell()"
            @click="handleCellClick(x-1, y-1)"
            @mouseenter="handleCellHover(x-1, y-1, $event)"
            @mouseleave="handleCellLeave()"
          />
        </template>
      </template>
      <div v-else class="loading-message">
        加载地图中...
      </div>
      
      <!-- 天气控制浮窗 -->
      <WeatherControls 
        v-if="showWeatherControls && selectedCell" 
        :position="selectedCell"
        :cell-size="cellSize"
        @apply-weather="applyWeatherEffect"
        @close="closeWeatherControls"
      />      
      
      <!-- 警告事件组件 -->
      <WarningEvent />
      
      <!-- 文明迁徙动画 -->
      <MigrationAnimation />
        </div>
      </div>
    </div>
    <!-- 地图提示浮窗 -->
    <MapTooltip 
      :cell-data="hoveredCellData"
      :position="mousePosition"
    />
  </div>
</template>

<style scoped>
.game-map-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 15px 10px;
  margin: 0;
  background: linear-gradient(145deg, rgba(186, 230, 253, 0.6), rgba(224, 242, 254, 0.4)); /* 马卡龙浅蓝色渐变 */
  border-radius: 12px;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
  flex: 0 0 auto;
  max-height: calc(100vh - 30px);
  width: auto;
  position: relative;
  box-shadow: inset 0 0 15px rgba(147, 197, 253, 0.4); /* 蓝色内发光效果 */
}

.map-cell {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  transition: all 0.2s ease;
  cursor: pointer;
  overflow: hidden;
  position: relative;
}

@keyframes pulse-border {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.8);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
    transform: scale(1.05);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
    transform: scale(1);
  }
}

.map-cell-highlight-scroll {
  animation: pulse-border 1s ease-out infinite;
  z-index: 25;
  outline: 3px solid rgba(255, 255, 255, 0.9);
}

.debug-info {
  color: #fff;
  margin-bottom: 5px;
  padding: 5px;
  background-color: #333;
  border: 1px solid #fff;
  width: auto;
  min-width: 500px;
  text-align: center;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.map-status-info {
  color: #1e3a8a; /* 深蓝色文字，与渐变背景形成对比 */
  margin-bottom: 5px;
  padding: 8px 12px;
  background: linear-gradient(135deg, rgba(134, 239, 172, 0.9), rgba(250, 204, 21, 0.9)); /* 绿色到黄色的渐变 */
  border-radius: 8px;
  width: auto;
  min-width: 500px;
  text-align: center;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

.game-map {
  display: grid;
  grid-template-columns: repeat(v-bind(GRID_WIDTH), v-bind(cellSize + 'px'));
  grid-template-rows: repeat(v-bind(GRID_HEIGHT), v-bind(cellSize + 'px'));
  gap: 2px;
  background-color: rgba(254, 240, 138, 0.3); /* 马卡龙浅黄色背景 */
  border: 4px solid rgba(224, 231, 255, 0.8); /* 马卡龙浅色边框 */
  border-radius: 10px;
  position: relative;
  box-shadow: 0 0 0 2px rgba(147, 197, 253, 0.5), /* 马卡龙浅蓝色内阴影 */
             0 0 0 6px rgba(255, 255, 255, 0.9), /* 白色外边框 */
             0 8px 20px rgba(96, 165, 250, 0.4); /* 蓝色外阴影 */
  margin: 10px auto;
  /* 确保地图不会被压缩或拉伸 */
  min-width: min-content;
  min-height: min-content;
  align-self: flex-start;
  padding: 5px;
  backdrop-filter: blur(3px);
}

/* 坐标标记样式 */
.game-map-wrapper {
  display: flex;
  flex-direction: column;
  position: relative;
  margin: 20px 0;
}

.map-with-y-labels {
  display: flex;
  flex-direction: row;
}

.coordinate-x-labels {
  display: flex;
  flex-direction: row;
  margin-left: 30px; /* 与Y坐标标记的宽度保持一致 */
  /* 修改为适合的左侧填充，考虑到地图矩阵中的间隙 */
  padding-left: 3px;
}

.coordinate-y-labels {
  display: flex;
  flex-direction: column;
  width: 30px;
  padding-top: 3px; /* 将填充调整为更合适的值，考虑地图格子的间隙 */
}

.coordinate-label {
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Courier New', monospace;
  font-weight: bold;
  border-radius: 4px;
  margin: 1px;
  font-size: 16px;
}

.x-label {
  height: 25px;
  width: v-bind(cellSize + 'px'); /* 使宽度与单元格大小相等 */
  color: #ffffff; /* 白色文字 */
  background-color: rgba(239, 68, 68, 0.7); /* 红色半透明背景 */
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5); /* 添加文字阴影提高可读性 */
}

.y-label {
  width: 25px;
  height: v-bind(cellSize + 'px'); /* 使高度与单元格大小相等 */
  color: #ffffff; /* 白色文字 */
  background-color: rgba(234, 179, 8, 0.7); /* 黄色半透明背景 */
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5); /* 添加文字阴影提高可读性 */
}

.loading-message {
  color: rgba(15, 23, 42, 0.9); /* 深色文字 */
  font-size: 24px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: linear-gradient(135deg, rgba(186, 230, 253, 0.9), rgba(167, 243, 208, 0.9)); /* 马卡龙浅蓝绿渐变 */
  padding: 25px 30px;
  border: 2px solid rgba(147, 197, 253, 0.7); /* 马卡龙浅蓝色边框 */
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(147, 197, 253, 0.5); /* 马卡龙蓝色阴影 */
  font-weight: 600;
  letter-spacing: 1px;
}
</style>
