<script setup lang="ts">
import { computed, ref } from 'vue';
import { useGameStore } from '../store/gameStore';
import TrendChart from './TrendChart.vue';
import CivilizationIcon from './CivilizationIcon.vue';

// 定义组件事件
const emit = defineEmits(['returnToHome']);

const gameStore = useGameStore();

// 计算当前选中网格的显示信息
const cellInfo = computed(() => {
  if (!gameStore.selectedCell) {
    return { temperature: 0, humidity: 0, terrain: '未选择' };
  }
  
  const cell = gameStore.selectedCell;
  
  // 地形标签
  let terrainTag = '';
  switch (cell.terrain) {
    case 'plain':
      terrainTag = '平原';
      break;
    case 'desert':
      terrainTag = '沙漠';
      break;
    case 'water':
      terrainTag = '水域';
      break;
    case 'hill':
      terrainTag = '丘陵';
      break;
    default:
      terrainTag = '未知';
  }
  
  // 湿度状态
  let humidityTag = '';
  if (cell.humidity < 30) humidityTag = '干旱';
  else if (cell.humidity > 70) humidityTag = '潮湿';
  else humidityTag = '适中';
  
  // 温度状态
  let temperatureTag = '';
  if (cell.temperature < 30) temperatureTag = '寒冷';
  else if (cell.temperature > 70) temperatureTag = '炎热';
  else temperatureTag = '适中';
  
  return {
    temperature: cell.temperature,
    humidity: cell.humidity,
    terrain: `${terrainTag}-${humidityTag}`,
    terrainType: terrainTag,
    humidityType: humidityTag,
    temperatureType: temperatureTag
  };
});

// 计算文明状态
const civilizationStatus = computed(() => {
  return gameStore.civilizations.map(civ => ({
    id: civ.id,
    type: civ.type,
    resources: civ.resources,
    position: civ.position
  }));
});

// 计算是否有文明
const hasCivilizations = computed(() => {
  return gameStore.civilizations.length > 0;
});

// 当前高亮的文明 ID
const highlightedCivId = ref<number | null>(null);

// 高亮显示文明
const highlightCivilization = (civId: number) => {
  highlightedCivId.value = civId;
  // 触发自定义事件，通知地图组件高亮显示文明
  window.dispatchEvent(new CustomEvent('highlight-civilization', {
    detail: { id: civId }
  }));
};

// 清除高亮
const clearHighlight = () => {
  highlightedCivId.value = null;
  // 触发清除高亮事件
  window.dispatchEvent(new CustomEvent('clear-civilization-highlight'));
};

// 检查文明是否在地图上
const isCivOnMap = (civId: number) => {
  const civ = gameStore.civilizations.find(c => c.id === civId);
  if (!civ) return false;
  
  // 检查文明所在单元格是否有 settlement 属性
  const cell = gameStore.getCellAt(civ.position.x, civ.position.y);
  return cell && cell.settlement !== null;
};

// 处理点击文明事件
const handleCivClick = (civ: any) => {
  // 如果文明不在地图上，重新放置文明
  if (!isCivOnMap(civ.id)) {
    gameStore.placeCivilizationOnMap(civ.id);
  }
};

// 滚动到文明位置
const scrollToPosition = (position: { x: number, y: number }) => {
  // 触发自定义事件，通知地图组件滚动到指定位置
  window.dispatchEvent(new CustomEvent('scroll-to-position', {
    detail: { position }
  }));
  
  // 同时高亮显示该位置的文明
  const civ = gameStore.civilizations.find(c => 
    c.position.x === position.x && c.position.y === position.y
  );
  if (civ) {
    highlightCivilization(civ.id);
    // 3秒后自动取消高亮
    setTimeout(() => {
      clearHighlight();
    }, 3000);
  }
};

// 获取文明的繁荣度类别
const getProsperityClass = (civ: any) => {
  // 计算繁荣度分数（基于食物、工具和人口）
  const score = civ.resources.food * 0.5 + civ.resources.tools * 0.8 + civ.population * 2;
  
  if (score >= 50) return 'prosperity-high';
  if (score >= 25) return 'prosperity-medium';
  return 'prosperity-low';
};

// 获取繁荣度标签
const getProsperityLabel = (civ: any) => {
  const prosperityClass = getProsperityClass(civ);
  
  switch (prosperityClass) {
    case 'prosperity-high':
      return '繁荣';
    case 'prosperity-medium':
      return '安定';
    case 'prosperity-low':
      return '艰难';
    default:
      return '';
  }
};

// 全局趋势数据
const globalTrends = computed(() => {
  return gameStore.globalTrends;
});
</script>

<template>
  <div class="control-panel">
    <div class="panel-section">
      <h2>环境状态</h2>
      <div class="environment-status">
        <div v-if="gameStore.selectedCell" class="status-row">
          <div class="status-label">地形:</div>
          <div class="status-value">{{ cellInfo.terrainType }}</div>
        </div>
        <div v-if="gameStore.selectedCell" class="status-row">
          <div class="status-label">湿度:</div>
          <div class="status-value">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${cellInfo.humidity}%`, backgroundColor: cellInfo.humidity > 70 ? '#5da6ff' : (cellInfo.humidity < 30 ? '#c9a66b' : '#64c4ed') }"></div>
            </div>
            <span>{{ cellInfo.humidity }}% ({{ cellInfo.humidityType }})</span>
          </div>
        </div>
        <div v-if="gameStore.selectedCell" class="status-row">
          <div class="status-label">温度:</div>
          <div class="status-value">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${cellInfo.temperature}%`, backgroundColor: cellInfo.temperature > 70 ? '#ff5a5a' : (cellInfo.temperature < 30 ? '#5da6ff' : '#ff9e54') }"></div>
            </div>
            <span>{{ cellInfo.temperature }}% ({{ cellInfo.temperatureType }})</span>
          </div>
        </div>
        <div v-if="!gameStore.selectedCell" class="no-selection">
          请点击地图选择一个区域
        </div>
      </div>
    </div>
    
    <div class="panel-section">
      <h2>文明状态</h2>
      <div class="civilization-status">
        <div v-if="hasCivilizations" class="civilization-list">
          <div 
            v-for="(civ, index) in civilizationStatus" 
            :key="index"
            class="civilization-item"
            @mouseenter="highlightCivilization(civ.id)"
            @mouseleave="clearHighlight()"
            :class="{'civ-not-on-map': !isCivOnMap(civ.id)}"
          >
            <div class="civ-icon">
              <CivilizationIcon :type="civ.type" />
            </div>
            <div class="civ-info">
              <div class="civ-name">
                {{ 
                  civ.type === 'nomad' ? '游牧部落' : 
                  civ.type === 'agriculture' ? '农耕部落' : 
                  civ.type === 'fishing' ? '渔猎部落' : 
                  civ.type === 'farming' ? '农耕文明' : '未知部落'
                }}
                <span v-if="!isCivOnMap(civ.id)" class="civ-status-tag">已消失</span>
                <span v-else class="civ-prosperity" :class="getProsperityClass(civ)">
                  {{ getProsperityLabel(civ) }}
                </span>
              </div>
              <div class="civ-resources">
                <div class="resource">
                  <span class="resource-icon">🌾</span>
                  <span class="resource-value">{{ civ.resources.food }}</span>
                </div>
                <div class="resource">
                  <span class="resource-icon">🔨</span>
                  <span class="resource-value">{{ civ.resources.tools }}</span>
                </div>
                <div class="resource">
                  <span class="resource-icon">👥</span>
                  <span class="resource-value">{{ civ.population }}</span>
                </div>
              </div>
              <div class="civ-location" v-if="isCivOnMap(civ.id)">
                <span class="location-icon">📍</span>
                <span class="location-value">({{ civ.position.x }}, {{ civ.position.y }})</span>
                <button class="goto-button" @click="scrollToPosition(civ.position)">前往</button>
              </div>
              <div v-if="!isCivOnMap(civ.id)" class="civ-action-hint">
                <button class="place-button" @click="handleCivClick(civ)">重新放置</button>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="no-civilization">
          尚未发现部落活动
        </div>
      </div>
    </div>
    
    <div class="panel-section">
      <h2>全局趋势</h2>
      <div class="global-trends">
        <TrendChart 
          :temperature-data="globalTrends.temperature"
          :humidity-data="globalTrends.humidity"
          :critical-thresholds="{ drought: 20, flood: 80 }"
        />
      </div>
    </div>
    
    <!-- 金币显示部分 -->
    <div class="panel-section coins-section">
      <h2>资源信息</h2>
      <div class="resource-container">
        <div class="resource-item">
          <div class="resource-icon">💰</div>
          <div class="resource-info">
            <div class="resource-name">金币</div>
            <div class="resource-value">{{ gameStore.coins }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 返回首页按钮 -->
    <div class="return-home-container">
      <button class="return-home-button" @click="emit('returnToHome')">
        <span class="button-icon">←</span> 返回首页
      </button>
    </div>
  </div>
</template>

<style scoped>
.control-panel {
  width: 300px;
  height: calc(100vh - 30px);
  max-height: calc(100vh - 30px);
  background-color: rgba(17, 24, 39, 0.95); /* 深色背景配合马卡龙色系 */
  border: 2px solid rgba(147, 197, 253, 0.6); /* 马卡龙浅蓝色边框 */
  border-radius: 12px;
  padding: 15px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
  font-family: 'Courier New', monospace;
  color: rgba(255, 255, 255, 0.9);
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
  flex-shrink: 0;
  box-shadow: inset 0 0 20px rgba(55, 48, 163, 0.2), /* 深紫色内阴影 */
              0 8px 15px rgba(96, 165, 250, 0.3); /* 蓝色外阴影 */
}

/* 金币显示部分样式 */
.coins-section {
  background-color: rgba(31, 41, 55, 0.8);
  border: 2px solid rgba(255, 215, 0, 0.7); /* 金色边框 */
}

.resource-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.resource-item {
  display: flex;
  align-items: center;
  background-color: rgba(37, 99, 235, 0.2);
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.resource-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.resource-icon {
  font-size: 24px;
  margin-right: 15px;
}

.resource-info {
  display: flex;
  flex-direction: column;
}

.resource-name {
  font-size: 14px;
  color: rgba(209, 213, 219, 0.9);
}

.resource-value {
  font-size: 20px;
  font-weight: bold;
  color: rgba(255, 215, 0, 0.9); /* 金色数值 */
}

.panel-section {
  background-color: rgba(31, 41, 55, 0.8); /* 马卡龙深色背景 */
  border: 2px solid rgba(209, 213, 219, 0.7);
  padding: 15px;
  margin-bottom: 15px;
  border-radius: 6px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
}

h2 {
  margin: 0 0 15px 0;
  font-size: 18px;
  color: rgba(255, 255, 255, 0.95);
  border-bottom: 1px solid rgba(147, 197, 253, 0.4); /* 马卡龙浅蓝色分隔线 */
  padding-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-shadow: 0 0 10px rgba(96, 165, 250, 0.3); /* 蓝色光晕文字 */
}

/* 环境状态样式 */
.environment-status {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-row {
  display: flex;
  align-items: center;
}

.status-label {
  width: 70px;
  font-weight: 500;
  color: rgba(156, 163, 175, 0.9); /* 马卡龙风格的浅灰色 */
  text-shadow: 0 0 5px rgba(96, 165, 250, 0.2); /* 微弱的蓝色光晕 */
}

.status-value {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.progress-bar {
  height: 8px;
  background-color: rgba(55, 65, 81, 0.7); /* 马卡龙深灰色 */
  border: 1px solid rgba(156, 163, 175, 0.4); /* 马卡龙浅灰色边框 */
  overflow: hidden;
  border-radius: 4px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
}

.progress-fill {
  height: 100%;
  transition: width 0.5s ease, background-color 0.5s ease;
  border-radius: 3px;
  box-shadow: 0 0 5px rgba(147, 197, 253, 0.5); /* 蓝色光晕效果 */
}

.no-selection {
  color: rgba(156, 163, 175, 0.7); /* 马卡龙风格的中灰色 */
  font-style: italic;
  text-align: center;
  padding: 10px;
  border: 1px dashed rgba(209, 213, 219, 0.5); /* 浅色虚线边框 */
  border-radius: 4px;
  background-color: rgba(31, 41, 55, 0.3); /* 透明深色背景 */
}

/* 文明状态样式 */
.civilization-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.civilization-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background-color: rgba(243, 244, 246, 0.1); /* 半透明的浅色背景 */
  border-radius: 8px;
  border: 1px solid rgba(209, 213, 219, 0.4); /* 浅色边框 */
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.civilization-item:hover {
  background-color: rgba(243, 244, 246, 0.15); /* 悬停时轻微增亮 */
  box-shadow: 0 3px 8px rgba(96, 165, 250, 0.3); /* 蓝色阴影增强 */
  transform: translateY(-2px);
}

.civ-icon {
  margin-right: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 45px;
  height: 45px;
  overflow: visible;
}

.civ-info {
  flex: 1;
}

.civ-name {
  font-weight: 600;
  margin-bottom: 6px;
  color: rgba(255, 255, 255, 0.95);
  letter-spacing: 0.5px;
  text-shadow: 0 0 5px rgba(96, 165, 250, 0.3); /* 文字光晕 */
}

.civ-resources {
  display: flex;
  gap: 15px;
}

.resource {
  display: flex;
  align-items: center;
  gap: 5px;
}

.resource-icon {
  font-size: 16px;
  color: rgba(147, 197, 253, 0.9); /* 马卡龙浅蓝色图标 */
}

.resource-value {
  margin-left: 4px;
  font-size: 14px;
  color: rgba(229, 231, 235, 0.9); /* 马卡龙浅色数值 */
  font-weight: 500;
  text-shadow: 0 0 3px rgba(96, 165, 250, 0.2); /* 微弱蓝色光晕 */
}

.civ-status-tag, .civ-prosperity {
  font-size: 12px;
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 8px;
  font-weight: normal;
}

.civ-status-tag {
  background-color: rgba(239, 68, 68, 0.7); /* 红色背景 */
}

.prosperity-high {
  background-color: rgba(34, 197, 94, 0.7); /* 绿色背景 */
}

.prosperity-medium {
  background-color: rgba(234, 179, 8, 0.7); /* 黄色背景 */
}

.prosperity-low {
  background-color: rgba(249, 115, 22, 0.7); /* 橙色背景 */
}

.civ-location {
  display: flex;
  align-items: center;
  margin-top: 5px;
  font-size: 12px;
  color: rgba(209, 213, 219, 0.9);
}

.location-icon {
  margin-right: 5px;
  color: rgba(147, 197, 253, 0.9); /* 浅蓝色 */
}

.goto-button, .place-button {
  margin-left: 8px;
  background-color: rgba(59, 130, 246, 0.7); /* 蓝色背景 */
  color: white;
  border: none;
  border-radius: 4px;
  padding: 2px 8px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.goto-button:hover, .place-button:hover {
  background-color: rgba(59, 130, 246, 0.9);
  transform: translateY(-1px);
}

.place-button {
  background-color: rgba(239, 68, 68, 0.7); /* 红色背景 */
}

.place-button:hover {
  background-color: rgba(239, 68, 68, 0.9);
}

.civ-action-hint {
  margin-top: 5px;
  text-align: right;
}

.civ-not-on-map {
  border: 1px dashed rgba(239, 68, 68, 0.5); /* 红色虚线边框 */
  background-color: rgba(239, 68, 68, 0.1); /* 淡红色背景 */
  cursor: pointer;
}

.civ-not-on-map:hover {
  background-color: rgba(239, 68, 68, 0.2); /* 悬停时加深背景 */
  box-shadow: 0 3px 8px rgba(239, 68, 68, 0.3); /* 红色阴影 */
}

.no-civilization {
  color: rgba(156, 163, 175, 0.7); /* 马卡龙中灰色 */
  font-style: italic;
  text-align: center;
  padding: 12px;
  border: 1px dashed rgba(209, 213, 219, 0.4); /* 浅色虚线边框 */
  border-radius: 6px;
  background-color: rgba(31, 41, 55, 0.3); /* 半透明深色背景 */
}

/* 返回首页按钮样式 - 马卡龙风格 */
.return-home-container {
  margin-top: 25px;
  display: flex;
  justify-content: center;
}

.return-home-button {
  background-color: rgba(37, 99, 235, 0.8); /* 马卡龙蓝色背景 */
  color: rgba(255, 255, 255, 0.95);
  border: 2px solid rgba(191, 219, 254, 0.8); /* 马卡龙薄蓝色边框 */
  padding: 10px 18px;
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(30, 64, 175, 0.4), /* 外部阴影 */
              0 0 10px rgba(96, 165, 250, 0.3); /* 发光效果 */
  text-shadow: 0 0 5px rgba(219, 234, 254, 0.6); /* 文字光晕 */
  letter-spacing: 1px;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}

.return-home-button:hover {
  background-color: rgba(59, 130, 246, 0.9); /* 马卡龙中蓝色悬停 */
  box-shadow: 0 6px 10px rgba(30, 64, 175, 0.5),
              0 0 15px rgba(96, 165, 250, 0.5);
  transform: translateY(-2px);
  transform: scale(1.05);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
}

.return-home-button:active {
  transform: scale(0.95);
}

.button-icon {
  font-size: 18px;
  margin-right: 8px;
}

/* 全局趋势样式 */
.global-trends {
  height: 180px;
}
</style>
