<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import type { Cell } from '../types';

const props = defineProps<{
  cellData: Cell | null;
  position: {
    x: number,
    y: number,
    absoluteX: number,
    absoluteY: number,
    screenX?: number,
    screenY?: number,
    valid: boolean
  } | null;
}>();

// 响应式窗口尺寸，用于计算tooltip位置
const windowWidth = ref(window.innerWidth);
const windowHeight = ref(window.innerHeight);

// 窗口大小变化监听函数
const updateWindowSize = () => {
  windowWidth.value = window.innerWidth;
  windowHeight.value = window.innerHeight;
};

// 组件挂载时添加窗口大小变化监听
onMounted(() => {
  window.addEventListener('resize', updateWindowSize);
});

// 组件卸载时移除监听，防止内存泄漏
onUnmounted(() => {
  window.removeEventListener('resize', updateWindowSize);
});

// 获取tooltip DOM引用
const tooltipRef = ref(null);

// 当tooltip内容变化时，记录尺寸信息
watch(() => props.cellData, () => {
  if (tooltipRef.value) {
    setTimeout(() => {
      const el = tooltipRef.value;
      console.log('Tooltip实际尺寸:', {
        width: el.offsetWidth,
        height: el.offsetHeight,
        clientWidth: el.clientWidth,
        clientHeight: el.clientHeight,
        scrollWidth: el.scrollWidth,
        scrollHeight: el.scrollHeight
      });
    }, 0);
  }
}, { immediate: true });

// 计算tooltip的最佳显示位置 - 基于单元格位置而非鼠标位置
const tooltipPosition = computed(() => {
  if (!props.position || !props.position.valid) {
    // 如果没有有效位置数据，则隐藏提示框
    return { display: 'none' };
  }
  
  // 使用响应式窗口尺寸以确保提示框不会超出边界
  const width = windowWidth.value;
  const height = windowHeight.value;
  
  // 提示框默认宽度和高度
  const tooltipWidth = 240; // 略微减小宽度以适应地图
  const tooltipHeight = 280; // 调整高度估计值

  // 打印所有可用的坐标信息，帮助调试
  console.log('所有位置信息(单元格方式):', {
    cellX: props.position.cellX,
    cellY: props.position.cellY,
    cellLeft: props.position.cellLeft,
    cellTop: props.position.cellTop,
    cellWidth: props.position.cellWidth,
    cellHeight: props.position.cellHeight,
    cellRight: props.position.cellRight,
    cellBottom: props.position.cellBottom,
    x: props.position.x,
    y: props.position.y,
    absoluteX: props.position.absoluteX,
    absoluteY: props.position.absoluteY,
    windowSize: { width, height }
  });
  
  // 检查单元格位置信息是否存在，如果不存在则回退到鼠标位置
  if (props.position.cellLeft === undefined || props.position.cellTop === undefined) {
    // 如果单元格位置信息不存在，使用鼠标位置
    console.log('单元格位置信息不存在，回退到鼠标位置');
    
    const mouseX = props.position.absoluteX;
    const mouseY = props.position.absoluteY;
    
    // 计算提示框位置
    let posX = mouseX + 5;
    let posY = mouseY + 5;
    
    // 边界处理
    posX = Math.max(5, Math.min(width - tooltipWidth - 5, posX));
    posY = Math.max(5, Math.min(height - tooltipHeight - 5, posY));
    
    console.log('基于鼠标位置的提示框位置:', { posX, posY });
    
    return {
      position: 'fixed',
      left: `${posX}px`,
      top: `${posY}px`,
      transform: 'none',
      zIndex: 2000,
      pointerEvents: 'none'
    };
  }
  
  // 新的定位逻辑 - 基于单元格元素位置而非鼠标位置
  // 获取单元格的位置信息
  const cellLeft = props.position.cellLeft;
  const cellTop = props.position.cellTop;
  const cellRight = props.position.cellRight;
  const cellBottom = props.position.cellBottom;
  const cellWidth = props.position.cellWidth;
  const cellHeight = props.position.cellHeight;
  
  // 计算最佳位置方案
  let posX = 0;
  let posY = 0;
  
  // 首先简单检查可用空间
  const spaceOnRight = width - cellRight;
  const spaceOnLeft = cellLeft;
  const spaceBelow = height - cellBottom;
  const spaceAbove = cellTop;
  
  console.log('各个方向的可用空间:', { spaceOnRight, spaceOnLeft, spaceBelow, spaceAbove });
  
  // 水平位置策略 - 优先选择右侧，如果右侧空间不足则选择左侧
  if (spaceOnRight >= tooltipWidth + 10) {
    // 如果右侧有足够的空间，将提示框放在单元格的右侧
    posX = cellRight + 5;
  } else if (spaceOnLeft >= tooltipWidth + 10) {
    // 如果左侧有足够的空间，将提示框放在单元格的左侧
    posX = cellLeft - tooltipWidth - 5;
  } else {
    // 如果水平方向都没有足够的空间，选择空间较大的一侧
    if (spaceOnRight >= spaceOnLeft) {
      posX = Math.max(width - tooltipWidth - 5, cellRight - tooltipWidth / 2);
    } else {
      posX = Math.min(5, cellLeft - tooltipWidth / 2);
    }
  }
  
  // 垂直位置策略 - 优先选择下方，如果下方空间不足则选择上方
  if (spaceBelow >= tooltipHeight + 10) {
    // 如果下方有足够的空间，将提示框放在单元格的下方
    posY = cellBottom + 5;
  } else if (spaceAbove >= tooltipHeight + 10) {
    // 如果上方有足够的空间，将提示框放在单元格的上方
    posY = cellTop - tooltipHeight - 5;
  } else {
    // 如果垂直方向都没有足够的空间，选择空间较大的一侧
    if (spaceBelow >= spaceAbove) {
      posY = Math.min(height - tooltipHeight - 5, cellTop + cellHeight / 2);
    } else {
      posY = Math.max(5, cellTop - tooltipHeight + cellHeight / 2);
    }
  }
  
  // 边界处理 - 确保提示框始终在视窗内
  posX = Math.max(5, Math.min(width - tooltipWidth - 5, posX));
  posY = Math.max(5, Math.min(height - tooltipHeight - 5, posY));
  
  console.log('最终计算的提示框位置:', { posX, posY });
  
  // 记录最终计算的位置信息
  const finalPosition = {
    position: 'fixed',
    left: `${posX}px`,
    top: `${posY}px`,
    transform: 'none',
    zIndex: 2000,
    pointerEvents: 'none' // 确保提示框不会阻止鼠标事件
  };
  
  console.log('计算的提示框位置:', {
    posX,
    posY,
    spaceOnRight,
    spaceOnLeft,
    spaceAbove,
    spaceBelow,
    tooltipWidth,
    tooltipHeight
  });
  
  return finalPosition;
});

// 计算地形描述
const terrainDescription = computed(() => {
  if (!props.cellData) return '';
  
  switch (props.cellData.terrain) {
    case 'plain':
      return '平原: 适合农耕，植被茂盛的地区';
    case 'desert':
      return '沙漠: 干旱少雨，几乎没有植被';
    case 'water':
      return '水域: 河流、湖泊或海洋';
    case 'hill':
      return '丘陵: 起伏的地形，适合放牧';
    default:
      return '未知地形';
  }
});

// 计算湿度描述
const humidityDescription = computed(() => {
  if (!props.cellData) return '';
  
  const humidity = props.cellData.humidity;
  
  if (humidity < 10) return '极度干旱';
  if (humidity < 30) return '干旱';
  if (humidity < 50) return '微干';
  if (humidity < 70) return '适中';
  if (humidity < 90) return '潮湿';
  return '极度潮湿';
});

// 计算温度描述
const temperatureDescription = computed(() => {
  if (!props.cellData) return '';
  
  const temperature = props.cellData.temperature;
  
  if (temperature < 10) return '极寒';
  if (temperature < 30) return '寒冷';
  if (temperature < 50) return '微凉';
  if (temperature < 70) return '适中';
  if (temperature < 90) return '炎热';
  return '酷热';
});

// 计算天气效果描述
const weatherEffectsDescription = computed(() => {
  if (!props.cellData || props.cellData.activeWeatherEffects.length === 0) return '无特殊天气';
  
  return props.cellData.activeWeatherEffects.map(effect => {
    switch(effect) {
      case 'hot': return '炎热';
      case 'cold': return '寒冷';
      case 'dry': return '干旱';
      case 'wet': return '降雨';
      default: return effect;
    }
  }).join('、');
});

// 计算文明类型描述
const settlementDescription = computed(() => {
  if (!props.cellData || !props.cellData.settlement) return '无居民';
  
  switch(props.cellData.settlement.type) {
    case 'nomad':
      return '游牧部落: 随季节迁徙的人群';
    case 'agriculture':
      return '农耕部落: 种植作物的定居点';
    case 'fishing':
      return '渔猎部落: 依靠捕鱼为生的社区';
    default:
      return '未知文明';
  }
});

// 计算地形变化预测
const terrainPredictionDescription = computed(() => {
  if (!props.cellData) return '';
  
  const { terrain, humidity, temperature } = props.cellData;
  
  if (terrain === 'plain' && humidity < 20 && temperature > 70) {
    return '警告: 正在沙漠化!';
  }
  
  if (terrain === 'water' && humidity < 30) {
    return '警告: 水域正在干涸!';
  }
  
  if (terrain === 'plain' && humidity > 80 && props.cellData.activeWeatherEffects.includes('wet')) {
    return '警告: 可能发生洪水!';
  }
  
  return '';
});
</script>

<template>
  <div v-if="cellData && position && position.valid" class="map-tooltip" :style="tooltipPosition" ref="tooltipRef">
    <div class="tooltip-header">
      <span class="terrain-badge" :class="cellData.terrain">{{ terrainDescription }}</span>
    </div>
    
    <div class="tooltip-content">
      <div class="tooltip-row">
        <span class="label">温度:</span>
        <span class="value">{{ cellData.temperature }}% ({{ temperatureDescription }})</span>
      </div>
      
      <div class="tooltip-row">
        <span class="label">湿度:</span>
        <span class="value">{{ cellData.humidity }}% ({{ humidityDescription }})</span>
      </div>
      
      <div class="tooltip-row">
        <span class="label">天气:</span>
        <span class="value">{{ weatherEffectsDescription }}</span>
      </div>
      
      <div class="tooltip-row">
        <span class="label">居民:</span>
        <span class="value">{{ settlementDescription }}</span>
      </div>
      
      <div v-if="terrainPredictionDescription" class="tooltip-prediction">
        {{ terrainPredictionDescription }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.map-tooltip {
  position: fixed; /* 注意这里的fixed定位确保与鼠标坐标系保持一致 */
  background: linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9));
  border: 2px solid rgba(147, 197, 253, 0.7); /* 马卡龙浅蓝色边框 */
  border-radius: 10px;
  width: 240px;
  padding: 12px;
  z-index: 2000; /* 提高z-index确保始终最上层 */
  font-family: 'Courier New', monospace;
  color: rgba(255, 255, 255, 0.95);
  pointer-events: none;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
  box-shadow: 0 5px 15px rgba(15, 23, 42, 0.5), /* 深色阴影 */
              0 0 8px rgba(96, 165, 250, 0.5); /* 蓝色光晕 */
  backdrop-filter: blur(5px);
  animation: tooltip-fade-in 0.2s ease-out;
  will-change: transform; /* 优化渲染性能 */
  max-height: calc(100vh - 20px); /* 确保不超过视窗高度 */
  overflow-y: auto; /* 内容过多时可滚动 */
  /* 添加显式的调试边框，帮助诊断尺寸问题 */
  outline: 1px solid rgba(255, 0, 0, 0.5);
}

@keyframes tooltip-fade-in {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.tooltip-header {
  margin-bottom: 12px;
  border-bottom: 1px solid rgba(147, 197, 253, 0.4); /* 马卡龙浅蓝色分隔线 */
  padding-bottom: 8px;
  text-align: center;
}

.terrain-badge {
  display: inline-block;
  padding: 4px 10px;
  font-weight: 600;
  letter-spacing: 0.5px;
  border-radius: 6px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(2px);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.terrain-badge.plain {
  background: linear-gradient(135deg, rgba(134, 239, 172, 0.8), rgba(74, 222, 128, 0.8)); /* 马卡龙绿色 */
  color: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(187, 247, 208, 0.8);
  box-shadow: 0 0 8px rgba(134, 239, 172, 0.5);
}

.terrain-badge.desert {
  background: linear-gradient(135deg, rgba(252, 211, 77, 0.8), rgba(251, 191, 36, 0.8)); /* 马卡龙黄色 */
  color: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(254, 240, 138, 0.8);
  box-shadow: 0 0 8px rgba(252, 211, 77, 0.5);
}

.terrain-badge.water {
  background: linear-gradient(135deg, rgba(147, 197, 253, 0.8), rgba(96, 165, 250, 0.8)); /* 马卡龙蓝色 */
  color: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(186, 230, 253, 0.8);
  box-shadow: 0 0 8px rgba(147, 197, 253, 0.5);
}

.terrain-badge.hill {
  background: linear-gradient(135deg, rgba(216, 180, 254, 0.8), rgba(192, 132, 252, 0.8)); /* 马卡龙紫色 */
  color: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(233, 213, 255, 0.8);
  box-shadow: 0 0 8px rgba(216, 180, 254, 0.5);
}

.tooltip-content {
  font-size: 13px;
  line-height: 1.5;
  padding: 0 5px;
}

.tooltip-row {
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  padding: 2px 0;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.tooltip-row:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.label {
  min-width: 50px;
  font-weight: 600;
  color: rgba(147, 197, 253, 0.9); /* 马卡龙浅蓝色标签 */
  text-shadow: 0 0 3px rgba(96, 165, 250, 0.3); /* 浅蓝色光晕 */
  padding-right: 8px;
}

.value {
  flex: 1;
  color: rgba(226, 232, 240, 0.95); /* 马卡龙浅灰白色值 */
}

.tooltip-prediction {
  margin-top: 12px;
  color: rgba(252, 165, 165, 0.95); /* 马卡龙浅红色警告文本 */
  font-weight: 600;
  text-align: center;
  border-top: 1px dashed rgba(252, 165, 165, 0.5); /* 马卡龙浅红色虚线 */
  border-bottom: 1px dashed rgba(252, 165, 165, 0.5); /* 马卡龙浅红色虚线 */
  padding: 6px 0;
  letter-spacing: 0.5px;
  text-shadow: 0 0 5px rgba(248, 113, 113, 0.5); /* 红色光晕 */
  animation: warning-pulse 2s infinite ease-in-out;
  border-radius: 4px;
}

@keyframes warning-pulse {
  0%, 100% {
    background-color: rgba(254, 202, 202, 0.05);
  }
  50% {
    background-color: rgba(254, 202, 202, 0.15);
  }
}
</style>
