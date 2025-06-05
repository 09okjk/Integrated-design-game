<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';
import { useGameStore } from '../store/gameStore';
import type { Cell, WeatherEffect } from '../types';
import CivilizationIcon from './CivilizationIcon.vue';
import soundService from '../services/SoundService';

// 获取游戏状态管理
const gameStore = useGameStore();

// 属性定义
const props = defineProps<{
  x: number;
  y: number;
  cellData: Cell;
}>();

// 发射事件
const emit = defineEmits(['click']);

// 判断是否是扩散效果
const isDiffusionEffect = ref(false);

// 扩散来源信息
const diffusionSource = ref({
  x: -1,
  y: -1,
  effect: '' as WeatherEffect,
  value: 0
});

// 计算地形的背景颜色 - 马卡龙色系自然风格
const cellBackground = computed(() => {
  const { terrain, humidity, temperature, wetCount } = props.cellData;
  
  // 根据地形类型选择马卡龙色系基础颜色
  let baseColor = '';
  let overlayColor = 'transparent'; // 颜色叠加层
  
  // 平原和沙漠的基础颜色
  const plainBaseColor = '#a6e3a1'; // 平原 - 浅绿色马卡龙
  const plainOverlayColor = 'rgba(154, 230, 180, 0.5)'; // 淡绿叠加增加层次感
  const desertBaseColor = '#fcd34d'; // 沙漠 - 淡黄色马卡龙
  const desertOverlayColor = 'rgba(253, 224, 71, 0.4)'; // 黄色叠加
  
  switch (terrain) {
    case 'plain':
      baseColor = plainBaseColor;
      overlayColor = plainOverlayColor;
      break;
    case 'desert':
      // 如果沙漠有潮湿计数，则颜色逐渐靠近平原
      if (wetCount && wetCount > 0 && wetCount < 5) {
        // 计算颜色插值比例 (0-1)
        const ratio = wetCount / 5;
        
        // 从沙漠黄色到平原绿色的渐变
        const desertR = 252, desertG = 211, desertB = 77; // 沙漠黄色RGB
        const plainR = 166, plainG = 227, plainB = 161; // 平原绿色RGB
        
        // 计算插值颜色
        const r = Math.round(desertR - (desertR - plainR) * ratio);
        const g = Math.round(desertG - (desertG - plainG) * ratio);
        const b = Math.round(desertB - (desertB - plainB) * ratio);
        
        baseColor = `rgb(${r}, ${g}, ${b})`;
        
        // 叠加层也逐渐变化
        const overlayRatio = ratio * 0.8; // 稍微减缓叠加层变化速度
        overlayColor = `rgba(${r}, ${g}, ${b}, ${0.4 - (0.4 - 0.5) * overlayRatio})`;
      } else {
        baseColor = desertBaseColor;
        overlayColor = desertOverlayColor;
      }
      break;
    case 'water':
      baseColor = '#93c5fd'; // 水域 - 淡蓝色马卡龙
      overlayColor = 'rgba(96, 165, 250, 0.5)'; // 蓝色叠加
      break;
    case 'hill':
      baseColor = '#166534'; // 丘陵 - 深绿色
      overlayColor = 'rgba(22, 101, 52, 0.3)'; // 深绿叠加
      break;
    default:
      baseColor = plainBaseColor;
      overlayColor = plainOverlayColor;
  }
  
  // 计算干旱程度对马卡龙色系的影响
  let desertification = 0;
  if (terrain === 'plain' && humidity < 30) {
    // 0-30的湿度对应沙漠化程度0-100%
    desertification = (30 - humidity) / 30;
    // 马卡龙风格的沙漠化渐变效果 - 从绿色到黄色
    const startR = 166, startG = 227, startB = 161; // 平原绿色起始值
    const endR = 252, endG = 211, endB = 77;        // 沙漠黄色终止值
    
    const r = Math.floor(startR + desertification * (endR - startR));
    const g = Math.floor(startG + desertification * (endG - startG));
    const b = Math.floor(startB + desertification * (endB - startB));
    
    baseColor = `rgb(${r}, ${g}, ${b})`;
    overlayColor = `rgba(253, 224, 71, ${0.1 + desertification * 0.4})`;
  }
  
  // 马卡龙水域效果 - 更加鲜艳的蓝色调
  if (terrain === 'water') {
    // 高湿度增加深蓝色调
    if (humidity > 70) {
      // 马卡龙风格蓝色调
      const blueIntensity = 0.4 + (humidity - 70) / 100 * 0.5;
      overlayColor = `rgba(59, 130, 246, ${blueIntensity})`; // 更鲜艳的蓝色
    }
    
    // 低湿度干涕效果
    if (humidity < 40) {
      // 马卡龙风格干涕效果
      const dryingIntensity = (40 - humidity) / 40 * 0.5;
      // 使用马卡龙浅翡翠色调
      baseColor = '#7dd3fc';
      overlayColor = `rgba(252, 211, 77, ${dryingIntensity})`; // 浅黄色干涕效果
    }
  }
  
  // 计算温度对马卡龙色系的影响
  if (temperature > 70) {
    // 高温效果 - 马卡龙暖色调
    const heatIntensity = (temperature - 70) / 30; // 70-100的温度对应热效果0-100%
    
    if (terrain !== 'desert') {
      // 非沙漠地形的高温效果 - 使用马卡龙粉红色和珊瑚色
      const redOverlay = `rgba(249, ${180 - heatIntensity * 30}, ${180 - heatIntensity * 70}, ${0.15 + heatIntensity * 0.25})`;
      return { base: baseColor, overlays: [overlayColor, redOverlay] };
    }
  } else if (temperature < 30) {
    // 低温效果 - 马卡龙薄荷色和浅蓝色
    const coldIntensity = (30 - temperature) / 30; // 0-30的温度对应冷效果0-100%
    
    // 低温马卡龙薄荷蓝色调叠加
    const blueOverlay = `rgba(${180 - coldIntensity * 30}, ${230 - coldIntensity * 30}, ${250 - coldIntensity * 20}, ${0.2 + coldIntensity * 0.2})`;
    return { base: baseColor, overlays: [overlayColor, blueOverlay] };
  }
  
  return {
    base: baseColor,
    overlays: [overlayColor]
  };
});

// 是否悬停
const isHovered = ref(false);

// 计算是否显示文明图标
const showSettlement = computed(() => {
  return props.cellData.settlement !== null;
});

// 监听 cellData 变化
watch(() => props.cellData.settlement, (newVal, oldVal) => {
  // 当文明状态变化时强制重新渲染
  if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
    console.log(`单元格 (${props.x}, ${props.y}) 的文明状态变化:`, newVal);
  }
}, { deep: true });

// 获取文明类型
const settlementType = computed(() => {
  return props.cellData.settlement?.type;
});

// 计算是否显示天气效果
const showWeatherEffect = computed(() => {
  return props.cellData.activeWeatherEffects.length > 0;
});

// 点击单元格事件
const handleClick = () => {
  // 如果处于文明放置模式，触发放置文明事件
  if (isPlacementMode.value) {
    // 检查是否可以放置文明（非水域且没有文明）
    if (props.cellData.terrain !== 'water' && !props.cellData.settlement) {
      window.dispatchEvent(new CustomEvent('map-cell-clicked', {
        detail: {
          x: props.x,
          y: props.y
        }
      }));
    }
  } else {
    emit('click');
  }
};

// 高亮状态
const isHighlighted = ref(false);

// 文明放置模式
const isPlacementMode = ref(false);
const placementCivilizationType = ref('');

// 获取文明 ID
const getCivilizationId = () => {
  // 从游戏存储中获取当前单元格对应的文明
  const { x, y } = props;
  const civ = gameStore.civilizations.find(c => c.position.x === x && c.position.y === y);
  
  // 如果在文明列表中找到了，返回文明ID
  if (civ) {
    return civ.id;
  }
  
  // 如果没找到但单元格有settlement属性，返回一个基于坐标的唯一ID
  if (props.cellData.settlement) {
    return `cell-${x}-${y}`;
  }
  
  return 0;
};

// 处理文明高亮事件
const handleHighlightCivilization = (event: CustomEvent) => {
  const { id } = event.detail;
  const civId = getCivilizationId();
  
  // 如果当前单元格的文明 ID 与高亮的文明 ID 相同，则高亮显示
  if (civId === id || String(civId) === String(id)) {
    isHighlighted.value = true;
  }
};

// 清除高亮
const handleClearHighlight = () => {
  isHighlighted.value = false;
};

// 处理鼠标悬停事件
const handleMouseEnter = () => {
  isHovered.value = true;
  // 播放鼠标悬停音效
  soundService.play('hover');
};

// 处理文明放置事件
const handleCivilizationPlaced = (event: CustomEvent) => {
  // 强制重新计算文明 ID
  setTimeout(() => {
    // 如果放置的文明在当前单元格，则刷新显示
    const { position } = event.detail;
    if (position.x === props.x && position.y === props.y) {
      // 强制刷新
      showSettlement.value = props.cellData.settlement !== null;
    }
  }, 100);
};

// 进入文明放置模式
const handleEnterPlacementMode = (event: CustomEvent) => {
  isPlacementMode.value = true;
  placementCivilizationType.value = event.detail.civilizationType;
};

// 退出文明放置模式
const handleExitPlacementMode = () => {
  isPlacementMode.value = false;
  placementCivilizationType.value = '';
};

// 生命周期钩子
// 获取天气效果名称
const getWeatherName = (effect: WeatherEffect) => {
  switch (effect) {
    case 'wet': return '降雨';
    case 'dry': return '干旱';
    case 'hot': return '热浪';
    case 'cold': return '冷浪';
    default: return '未知天气';
  }
};

// 获取扩散值文本
const getDiffusionValueText = (effect: WeatherEffect, value: number) => {
  switch (effect) {
    case 'wet':
    case 'dry':
      return `湿度${effect === 'wet' ? '+' : '-'}${value.toFixed(1)}`;
    case 'hot':
    case 'cold':
      return `温度${effect === 'hot' ? '+' : '-'}${value.toFixed(1)}`;
    default:
      return '';
  }
};

// 处理天气扩散事件
const handleWeatherDiffusion = (event: CustomEvent) => {
  const { sourceX, sourceY, targetX, targetY, effect, value } = event.detail;
  
  // 检查是否是当前单元格
  if (targetX === props.x && targetY === props.y) {
    isDiffusionEffect.value = true;
    diffusionSource.value = {
      x: sourceX,
      y: sourceY,
      effect,
      value
    };
    
    // 3秒后自动清除扩散标记
    setTimeout(() => {
      isDiffusionEffect.value = false;
    }, 3000);
  }
};

onMounted(() => {
  // 监听文明高亮事件
  window.addEventListener('highlight-civilization', handleHighlightCivilization as EventListener);
  window.addEventListener('clear-civilization-highlight', handleClearHighlight as EventListener);
  window.addEventListener('civilization-placed', handleCivilizationPlaced as EventListener);
  // 监听天气扩散事件
  window.addEventListener('weather-diffusion', handleWeatherDiffusion as EventListener);
  // 监听文明放置模式事件
  window.addEventListener('enter-civilization-placement-mode', handleEnterPlacementMode as EventListener);
  window.addEventListener('exit-civilization-placement-mode', handleExitPlacementMode as EventListener);
});

onUnmounted(() => {
  // 移除事件监听
  window.removeEventListener('highlight-civilization', handleHighlightCivilization as EventListener);
  window.removeEventListener('clear-civilization-highlight', handleClearHighlight as EventListener);
  window.removeEventListener('civilization-placed', handleCivilizationPlaced as EventListener);
  window.removeEventListener('weather-diffusion', handleWeatherDiffusion as EventListener);
  // 移除文明放置模式事件监听
  window.removeEventListener('enter-civilization-placement-mode', handleEnterPlacementMode as EventListener);
  window.removeEventListener('exit-civilization-placement-mode', handleExitPlacementMode as EventListener);
});
</script>

<template>
  <div 
    :class="[
      'map-cell', 
      `terrain-${props.cellData.terrain}`,
      { 'placement-mode': isPlacementMode && props.cellData.terrain !== 'water' && !props.cellData.settlement },
      { 'placement-invalid': isPlacementMode && (props.cellData.terrain === 'water' || props.cellData.settlement) }
    ]" 
    :style="{ 
      backgroundColor: cellBackground.base,
      position: 'relative',
      cursor: isPlacementMode ? (props.cellData.terrain !== 'water' && !props.cellData.settlement ? 'pointer' : 'not-allowed') : 'default'
    }"
    @mouseenter="handleMouseEnter"
    @mouseleave="isHovered = false"
    @click="handleClick"
    :data-x="x"
    :data-y="y"
  >
    <!-- 颜色叠加层，添加地形颜色 -->
    <div 
      v-for="(overlay, index) in cellBackground.overlays" 
      :key="'overlay-'+index"
      class="color-overlay"
      :style="{ backgroundColor: overlay }"
    ></div>
    <!-- 高亮效果 -->
    <div v-if="isHovered" class="cell-highlight"></div>
    
    <!-- 地形层 - 底层 -->
    <div v-if="showWeatherEffect" class="weather-effects">
      <div v-for="effect in cellData.activeWeatherEffects" :key="effect" class="weather-effect">
        <!-- 雨滴效果 -->
        <div v-if="effect === 'wet'" :class="['rain-effect', {'diffusion-effect': isDiffusionEffect}]">
          <div class="raindrop" v-for="i in 10" :key="i"></div>
        </div>
        
        <!-- 炎热效果 -->
        <div v-if="effect === 'hot'" :class="['heat-effect', {'diffusion-effect': isDiffusionEffect}]"></div>
        
        <!-- 干旱效果 -->
        <div v-if="effect === 'dry'" :class="['drought-effect', {'diffusion-effect': isDiffusionEffect}]"></div>
        
        <!-- 寒冷效果 -->
        <div v-if="effect === 'cold'" :class="['cold-effect', {'diffusion-effect': isDiffusionEffect}]"></div>
      </div>
    </div>
    
    <!-- 扩散效果提示 -->
    <div v-if="isHovered && isDiffusionEffect" class="diffusion-tooltip">
      受到坐标({{ diffusionSource.x }}, {{ diffusionSource.y }})的
      {{ getWeatherName(diffusionSource.effect) }}影响：
      {{ getDiffusionValueText(diffusionSource.effect, diffusionSource.value) }}
    </div>
    
    <!-- 水域特效 -->
    <div v-if="cellData.terrain === 'water'" class="water-effects">
      <!-- 水波纹动画 -->
      <div class="water-ripple"></div>
      
      <!-- 水面光斑效果 -->
      <div class="water-sparkle"></div>
      
      <!-- 干涂水域特效 -->
      <div v-if="cellData.humidity < 30" class="drying-water">
        <div class="crack-pattern"></div>
      </div>
      
      <!-- 洪水爆发效果 -->
      <div v-if="cellData.humidity > 90 && cellData.activeWeatherEffects.includes('wet')" class="flooding-water">
        <div class="overflow-ripple"></div>
      </div>
    </div>
    
    <!-- 沙漠化特效 -->
    <div v-if="cellData.terrain === 'plain' && cellData.humidity < 20" class="desertification-effect">
      <div class="sand-pattern" :style="{ opacity: (20 - cellData.humidity) / 20 }"></div>
    </div>
    
    <!-- 部落图标层 - 上层 -->
    <div 
      v-if="showSettlement" 
      :class="['settlement-icon', `settlement-${getCivilizationId()}`, { 'settlement-highlighted': isHighlighted }]" 
    >
      <CivilizationIcon v-if="settlementType" :type="settlementType" />
      
      <!-- 文明迁徙动画 -->
      <transition name="migrate">
        <div v-if="props.cellData.settlement" class="migration-indicator">
          <span class="migration-arrow">⬇️</span>
        </div>
      </transition>
    </div>
    
    <!-- 可选：调试信息 -->
    <div v-if="false" class="debug-info">
      {{ x }},{{ y }}
    </div>
  </div>
</template>

<style scoped>
.map-cell {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  transition: all 0.2s ease;
  cursor: pointer;
  overflow: hidden;
  border: 1px solid #fff;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}

/* 迁徙动画样式 */
.migration-indicator {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  animation: bounce-in 0.5s ease-out;
}

.migration-arrow {
  font-size: 16px;
  filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.8));
}

/* 迁徙过渡动画 */
.migrate-enter-active {
  animation: bounce-in 0.5s;
}
.migrate-leave-active {
  animation: bounce-in 0.5s reverse;
}
@keyframes bounce-in {
  0% {
    transform: translateX(-50%) translateY(-10px);
    opacity: 0;
  }
  50% {
    transform: translateX(-50%) translateY(5px);
    opacity: 1;
  }
  100% {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}

.cell-highlight {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.3);
  pointer-events: none;
  z-index: 10;
}

.color-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  mix-blend-mode: overlay;
}

.debug-info {
  font-size: 10px;
  color: rgba(0, 0, 0, 0.5);
  position: absolute;
  bottom: 2px;
  right: 2px;
}

/* 部落图标样式 */
.settlement-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 24px;
  z-index: 20;
  text-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
  transition: all 0.3s ease;
  font-weight: bold;
  text-shadow: 1px 1px 0 #000;
  /* 为GIF图标提供更多空间 */
  width: 160px;
  height: 160px;
  display: flex;
  justify-content: center;
  align-items: center;
  /* 确保图标不会被地图元素遮挡 */
  pointer-events: none;
}

.settlement-highlighted {
  transform: translate(-50%, -50%) scale(1.3);
  filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.9));
  z-index: 30;
  animation: pulse-highlight 1s infinite alternate;
}

/* 放置模式样式 */
.placement-mode {
  box-shadow: inset 0 0 15px rgba(76, 175, 80, 0.7);
  animation: pulse-placement 1.5s infinite alternate;
}

.placement-invalid {
  box-shadow: inset 0 0 15px rgba(244, 67, 54, 0.7);
}

@keyframes pulse-placement {
  0% {
    box-shadow: inset 0 0 15px rgba(76, 175, 80, 0.7);
  }
  100% {
    box-shadow: inset 0 0 20px rgba(76, 175, 80, 0.9);
  }
}

@keyframes pulse-highlight {
  0% {
    filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.8));
  }
  100% {
    filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0.9));
  }
}

/* 寒冷效果 - 马卡龙薄荷色系 */
.cold-effect {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 4;
  overflow: hidden;
}

.cold-effect::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background-color: rgba(209, 250, 229, 0.2); /* 马卡龙薄荷色 */
  animation: cold-pulse 4s ease-in-out infinite;
}

.cold-effect::after {
  content: '';
  position: absolute;
  width: 120%;
  height: 120%;
  top: -10%;
  left: -10%;
  background-image: radial-gradient(
    circle,
    rgba(186, 230, 253, 0.6) 1px, /* 马卡龙浅蓝色雪花 */
    transparent 2px
  );
  background-size: 10px 10px;
  animation: snowfall 8s linear infinite;
}

/* 天气效果样式 */
.weather-effects {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2;
  overflow: hidden;
}

.weather-effect {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}

/* 雨滴效果 */
.rain-effect {
  animation: rainAnimation 1s infinite linear;
}

.raindrop {
  position: absolute;
  width: 2px;
  height: 8px; /* 增加雨滴高度 */
  background-color: rgba(59, 130, 246, 0.9); /* 加深蓝色雨滴颜色并提高不透明度 */
  top: -10px;
  animation: raindropFall 1s infinite linear;
  box-shadow: 0 0 3px rgba(96, 165, 250, 0.8); /* 增强发光效果 */
}

@keyframes raindropFall {
  0% {
    transform: translateY(-10px);
    opacity: 0.8;
  }
  90% {
    opacity: 0.8;
  }
  100% {
    transform: translateY(50px);
    opacity: 0;
  }
}

/* 根据索引设置不同的延迟和位置 */
.raindrop:nth-child(1) { left: 10%; animation-delay: 0.1s; }
.raindrop:nth-child(2) { left: 20%; animation-delay: 0.2s; }
.raindrop:nth-child(3) { left: 30%; animation-delay: 0.3s; }
.raindrop:nth-child(4) { left: 40%; animation-delay: 0.2s; }
.raindrop:nth-child(5) { left: 50%; animation-delay: 0.1s; }
.raindrop:nth-child(6) { left: 60%; animation-delay: 0.3s; }
.raindrop:nth-child(7) { left: 70%; animation-delay: 0.2s; }
.raindrop:nth-child(8) { left: 80%; animation-delay: 0.1s; }
.raindrop:nth-child(9) { left: 90%; animation-delay: 0.3s; }
.raindrop:nth-child(10) { left: 95%; animation-delay: 0.2s; }

/* 炎热效果 - 增强视觉效果 */
.heat-effect {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(
    45deg, 
    transparent,
    transparent 5px, 
    rgba(251, 113, 30, 0.6) 5px, /* 更深的橙色并提高不透明度 */
    rgba(249, 65, 15, 0.5) 10px /* 更深的红橙色并提高不透明度 */
  );
  animation: heatWave 2s infinite ease-in-out;
  box-shadow: inset 0 0 20px rgba(254, 215, 170, 0.7); /* 增强光晕效果 */
  z-index: 5; /* 确保在其他效果之上 */
}

/* 添加热浪效果 */
.heat-effect::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    radial-gradient(circle at 30% 30%, rgba(255, 153, 0, 0.7) 0%, transparent 30%),
    radial-gradient(circle at 70% 70%, rgba(255, 102, 0, 0.7) 0%, transparent 30%);
  animation: heatPulse 3s infinite alternate;
  z-index: 4;
}

/* 添加热气上升效果 */
.heat-effect::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 70%;
  background: linear-gradient(0deg, rgba(255, 102, 0, 0.4) 0%, transparent 100%);
  animation: heatRise 4s infinite ease-in-out;
  z-index: 3;
}

@keyframes heatWave {
  0%, 100% {
    opacity: 0.7; /* 提高最小不透明度 */
  }
  50% {
    opacity: 0.9; /* 提高最大不透明度 */
  }
}

@keyframes heatPulse {
  0% {
    transform: scale(0.95);
    opacity: 0.5;
  }
  100% {
    transform: scale(1.05);
    opacity: 0.8;
  }
}

@keyframes heatRise {
  0%, 100% {
    transform: translateY(0) scaleX(1);
  }
  50% {
    transform: translateY(-5px) scaleX(1.05);
  }
}

/* 干旱效果 */
.drought-effect {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    radial-gradient(circle at 30% 30%, rgba(251, 191, 36, 0.7) 1px, transparent 1px),
    radial-gradient(circle at 70% 60%, rgba(252, 211, 77, 0.7) 1px, transparent 1px),
    radial-gradient(circle at 40% 80%, rgba(251, 191, 36, 0.7) 1px, transparent 1px),
    radial-gradient(circle at 80% 10%, rgba(252, 211, 77, 0.7) 1px, transparent 1px);
  background-size: 20% 20%;
  animation: dust-float 15s linear infinite;
}

.drought-effect::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background: linear-gradient(transparent, rgba(252, 211, 77, 0.5)); /* 加深底部渐变色 */
}

@keyframes dust {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 12px 12px;
  }
}

@keyframes dust-float {
  0% {
    transform: translateY(0) rotate(0deg);
  }
  25% {
    transform: translateY(-2px) rotate(1deg);
  }
  50% {
    transform: translateY(0) rotate(0deg);
  }
  75% {
    transform: translateY(2px) rotate(-1deg);
  }
  100% {
    transform: translateY(0) rotate(0deg);
  }
}

/* 寒冷效果 - 结霜效果增强版 */
.cold-effect {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(186, 230, 253, 0.6) 25%, transparent 25%, transparent 50%, rgba(186, 230, 253, 0.6) 50%, rgba(186, 230, 253, 0.6) 75%, transparent 75%, transparent);
  background-size: 4px 4px;
  z-index: 4;
}

/* 扩散效果样式 */
.diffusion-effect {
  opacity: 0.7 !important; /* 降低不透明度 */
  transform: scale(0.9) !important; /* 缩小效果 */
  animation: diffusion-pulse 2s ease-in-out infinite !important; /* 添加脉动动画 */
}

@keyframes diffusion-pulse {
  0%, 100% {
    transform: scale(0.85);
    opacity: 0.6;
  }
  50% {
    transform: scale(0.95);
    opacity: 0.8;
  }
}

/* 扩散提示框 */
.diffusion-tooltip {
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 100;
  pointer-events: none;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.diffusion-tooltip::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 5px solid rgba(0, 0, 0, 0.8);
}

.cold-effect::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 30% 30%, rgba(147, 197, 253, 0.8) 1px, transparent 1px),
             radial-gradient(circle at 70% 60%, rgba(147, 197, 253, 0.8) 1px, transparent 1px),
             radial-gradient(circle at 40% 80%, rgba(147, 197, 253, 0.8) 1px, transparent 1px),
             radial-gradient(circle at 80% 10%, rgba(147, 197, 253, 0.8) 1px, transparent 1px);
  background-size: 20% 20%;
  animation: snowflake 5s linear infinite;
}

@keyframes snowflake {
  0% {
    opacity: 0.5; /* 提高最小不透明度 */
  }
  50% {
    opacity: 0.8; /* 提高最大不透明度 */
  }
  100% {
    opacity: 0.5; /* 提高最小不透明度 */
  }
}

/* 水域特效样式 - 马卡龙蓝色系 */
.water-effects {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2;
  overflow: hidden;
}

/* 水波纹动画 - 马卡龙蓝色 */
.water-ripple {
  position: absolute;
  width: 200%;
  height: 200%;
  top: -50%;
  left: -50%;
  background-image: radial-gradient(
    circle,
    rgba(147, 197, 253, 0.5) 1px, /* 加深马卡龙浅蓝色 */
    rgba(59, 130, 246, 0.4) 2px, /* 加深马卡龙中蓝色 */
    transparent 3px
  );
  background-size: 20px 20px;
  animation: rippleWave 8s infinite linear;
  opacity: 0.8; /* 提高整体不透明度 */
  box-shadow: inset 0 0 15px rgba(96, 165, 250, 0.6); /* 增强蓝色光晕 */
}

@keyframes rippleWave {
  0% {
    transform: rotate(0deg) scale(0.8);
  }
  50% {
    transform: rotate(180deg) scale(1.2);
  }
  100% {
    transform: rotate(360deg) scale(0.8);
  }
}

/* 干涕水域特效 - 马卡龙风格 */
.drying-water {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}

.crack-pattern {
  width: 100%;
  height: 100%;
  background-image: 
    linear-gradient(0deg, rgba(251, 191, 36, 0.5) 1px, transparent 1px),
    linear-gradient(90deg, rgba(251, 191, 36, 0.5) 1px, transparent 1px);
  background-size: 15px 15px;
  background-position: center center;
  animation: crackGrow 3s infinite alternate;
  opacity: 0.8; /* 提高不透明度 */
}

@keyframes crackGrow {
  0% {
    background-size: 15px 15px;
    opacity: 0.5;
  }
  100% {
    background-size: 10px 10px;
    opacity: 0.8;
  }
}

/* 洪水爆发效果 - 马卡龙蓝色系 */
.flooding-water {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}

.overflow-ripple {
  position: absolute;
  width: 150%;
  height: 150%;
  top: -25%;
  left: -25%;
  border-radius: 50%;
  border: 3px solid rgba(59, 130, 246, 0.7); /* 加粗加深边框 */
  box-sizing: border-box;
  animation: overflowPulse 2s infinite;
}

@keyframes overflowPulse {
  0% {
    transform: scale(0.7);
    opacity: 0.9; /* 提高起始不透明度 */
    border-width: 2px; /* 增加起始边框宽度 */
  }
  50% {
    opacity: 0.7; /* 提高中间不透明度 */
  }
  100% {
    transform: scale(1.1);
    opacity: 0.2; /* 增加结束时的可见度 */
    border-width: 4px; /* 增加结束边框宽度 */
  }
}

/* 沙漠化特效 - 马卡龙风格 */
.desertification-effect {
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2;
}

.sand-pattern {
  width: 100%;
  height: 100%;
  background-image: 
    repeating-conic-gradient(
      rgba(251, 191, 36, 0.6) 0% 25%, /* 加深黄色 */
      rgba(252, 211, 77, 0.6) 0% 50% /* 加深浅黄色 */
    );
  background-size: 10px 10px;
  animation: sandShift 10s infinite linear;
}

@keyframes sandShift {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 20px 20px;
  }
}
</style>
