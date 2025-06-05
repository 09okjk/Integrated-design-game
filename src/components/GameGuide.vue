<script setup lang="ts">
import { ref } from 'vue';

// 游戏引导组件
// 定义当前激活的指南部分
const activeSection = ref('');

// 切换指南部分
const toggleSection = (section: string) => {
  if (activeSection.value === section) {
    // 如果已经激活，则关闭
    activeSection.value = '';
  } else {
    // 否则激活该部分
    activeSection.value = section;
  }
};
</script>

<template>
  <div class="game-guide">
    <h3 class="guide-title">游戏指南</h3>
    
    <!-- 指南按钮区域 -->
    <div class="guide-buttons">
      <button 
        class="guide-button" 
        :class="{ active: activeSection === 'terrain' }" 
        @click="toggleSection('terrain')"
      >
        地形类型
      </button>
      
      <button 
        class="guide-button" 
        :class="{ active: activeSection === 'weather' }" 
        @click="toggleSection('weather')"
      >
        天气控制
      </button>
      
      <button 
        class="guide-button" 
        :class="{ active: activeSection === 'environment' }" 
        @click="toggleSection('environment')"
      >
        环境变化
      </button>
      
      <button 
        class="guide-button" 
        :class="{ active: activeSection === 'residents' }" 
        @click="toggleSection('residents')"
      >
        居民类型
      </button>
      
      <button 
        class="guide-button" 
        :class="{ active: activeSection === 'tips' }" 
        @click="toggleSection('tips')"
      >
        操作提示
      </button>
    </div>
    
    <!-- 地形类型部分 -->
    <div v-if="activeSection === 'terrain'" class="guide-section">
      <h4>地形类型</h4>
      <div class="guide-item">
        <div class="guide-icon plain"></div>
        <span>平原: 适合农耕，植被茂盛的地区</span>
      </div>
      <div class="guide-item">
        <div class="guide-icon water"></div>
        <span>水域: 河流、湖泊或海洋</span>
      </div>
      <div class="guide-item">
        <div class="guide-icon desert"></div>
        <span>沙漠: 干旱少雨，几乎没有植被</span>
      </div>
      <div class="guide-item">
        <div class="guide-icon hill"></div>
        <span>丘陵: 起伏的地形，适合放牧</span>
      </div>
    </div>

    <!-- 天气控制部分 -->
    <div v-if="activeSection === 'weather'" class="guide-section">
      <h4>天气控制</h4>
      <div class="guide-item">
        <div class="guide-icon hot"></div>
        <span>炎热: 增加区域温度</span>
      </div>
      <div class="guide-item">
        <div class="guide-icon cold"></div>
        <span>寒冷: 降低区域温度</span>
      </div>
      <div class="guide-item">
        <div class="guide-icon wet"></div>
        <span>降雨: 增加区域湿度</span>
      </div>
      <div class="guide-item">
        <div class="guide-icon dry"></div>
        <span>干旱: 降低区域湿度</span>
      </div>
      <div class="guide-note">
        <p><strong>消耗:</strong> 每次天气操作消耗 <span class="highlight">3金币</span></p>
        <p><strong>扩散效果:</strong> 天气影响会扩散到相邻四个地块（上、下、左、右），强度为中心地块的50%</p>
        <p><strong>地形影响:</strong> 不同地形对扩散效果有不同影响，如水域对湿度扩散有加成</p>
      </div>
    </div>

    <!-- 环境变化部分 -->
    <div v-if="activeSection === 'environment'" class="guide-section">
      <h4>环境变化</h4>
      <div class="guide-item">
        <div class="guide-icon desertification"></div>
        <span>沙漠化: 平原在高温低湿时转变为沙漠</span>
      </div>
      <div class="guide-item">
        <div class="guide-icon drying-water"></div>
        <span>水域干涸: 低湿度导致水域变为平原</span>
      </div>
      <div class="guide-item">
        <div class="guide-icon flooding"></div>
        <span>洪水: 高湿度加降雨使平原转变为水域</span>
      </div>
    </div>

    <!-- 居民类型部分 -->
    <div v-if="activeSection === 'residents'" class="guide-section">
      <h4>居民类型</h4>
      <div class="guide-item">
        <div class="guide-icon nomad">𓀢</div>
        <span>游牧部落: 随季节迁徙的人群</span>
      </div>
      <div class="guide-item">
        <div class="guide-icon agriculture">𓆓</div>
        <span>农耕部落: 种植作物的定居点</span>
      </div>
      <div class="guide-item">
        <div class="guide-icon fishing">𓆛</div>
        <span>渔猎部落: 依靠捕鱼为生的社区</span>
      </div>
    </div>

    <!-- 操作提示部分 -->
    <div v-if="activeSection === 'tips'" class="guide-section">
      <h4>操作提示</h4>
      <p>点击地图格子可调整该区域天气</p>
      <p>悬停格子可查看详细信息</p>
      <p>长期影响天气会改变地形和居民生活</p>
      <p>保持平衡以维持生态系统稳定</p>
    </div>
  </div>
</template>

<style scoped>
.game-guide {
  width: 250px;
  height: calc(100vh - 30px);
  max-height: calc(100vh - 30px);
  background: linear-gradient(160deg, rgba(209, 250, 229, 0.9), rgba(186, 230, 253, 0.8)); /* 马卡龙薄绿蓝渐变 */
  border: 2px solid rgba(147, 197, 253, 0.6); /* 马卡龙浅蓝色边框 */
  border-radius: 12px;
  padding: 15px;
  color: rgba(15, 23, 42, 0.9); /* 深色文字 */
  font-family: 'Courier New', monospace;
  overflow-y: auto;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
  flex-shrink: 0;
  box-shadow: 0 8px 15px rgba(96, 165, 250, 0.3); /* 马卡龙蓝色阴影 */
  backdrop-filter: blur(3px);
  display: flex;
  flex-direction: column;
}

/* 指南按钮区域样式 */
.guide-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 15px;
}

/* 指南按钮样式 */
.guide-button {
  padding: 8px 12px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.7), rgba(226, 232, 240, 0.5));
  border: 1px solid rgba(147, 197, 253, 0.4);
  border-radius: 8px;
  color: rgba(37, 99, 235, 0.8);
  font-family: 'Courier New', monospace;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  box-shadow: 0 2px 4px rgba(96, 165, 250, 0.2);
}

/* 指南按钮悬停效果 */
.guide-button:hover {
  background: linear-gradient(145deg, rgba(224, 242, 254, 0.8), rgba(186, 230, 253, 0.6));
  box-shadow: 0 3px 6px rgba(96, 165, 250, 0.3);
  transform: translateY(-1px);
}

/* 指南按钮激活效果 */
.guide-button.active {
  background: linear-gradient(145deg, rgba(186, 230, 253, 0.8), rgba(147, 197, 253, 0.6));
  border-color: rgba(59, 130, 246, 0.6);
  color: rgba(30, 64, 175, 0.9);
  box-shadow: 0 1px 3px rgba(96, 165, 250, 0.4), inset 0 1px 3px rgba(255, 255, 255, 0.4);
  transform: translateY(1px);
}

.guide-title {
  text-align: center;
  font-size: 20px;
  color: rgba(37, 99, 235, 0.9); /* 马卡龙蓝色标题 */
  margin-top: 0;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(147, 197, 253, 0.5); /* 马卡龙浅蓝色分隔线 */
  font-weight: 600;
  letter-spacing: 1px;
  text-shadow: 0 1px 3px rgba(96, 165, 250, 0.4); /* 蓝色光晕 */
}

.guide-section {
  margin-bottom: 15px;
}

.guide-section h4 {
  color: rgba(74, 222, 128, 0.9); /* 马卡龙绿色副标题 */
  font-size: 15px;
  margin: 8px 0;
  border-bottom: 1px dashed rgba(134, 239, 172, 0.5); /* 马卡龙浅绿色分隔线 */
  padding-bottom: 4px;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.guide-item {
  display: flex;
  align-items: center;
  margin: 5px 0;
  font-size: 12px;
}

.guide-note {
  margin-top: 12px;
  padding: 8px 10px;
  background-color: rgba(255, 255, 255, 0.7);
  border-left: 3px solid #3b82f6;
  border-radius: 4px;
  font-size: 0.9em;
}

.guide-note p {
  margin: 5px 0;
  line-height: 1.4;
}

.highlight {
  color: #ef4444;
  font-weight: bold;
}

.guide-icon {
  width: 20px;
  height: 20px;
  margin-right: 10px;
  border: 1px solid #aaa;
}

.guide-icon.plain {
  background-color: rgba(144, 238, 144, 0.6);
  box-shadow: 0 0 5px rgba(144, 238, 144, 0.5);
}

.guide-icon.water {
  background-color: rgba(70, 130, 180, 0.6);
  box-shadow: 0 0 5px rgba(70, 130, 180, 0.5);
}

.guide-icon.desert {
  background-color: rgba(210, 180, 140, 0.6);
  box-shadow: 0 0 5px rgba(210, 180, 140, 0.5);
}

.guide-icon.hill {
  background-color: rgba(139, 69, 19, 0.6);
  box-shadow: 0 0 5px rgba(139, 69, 19, 0.5);
}

.guide-icon.hot {
  background-color: rgba(255, 100, 100, 0.3);
  position: relative;
}

.guide-icon.hot::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: repeating-linear-gradient(
    45deg, 
    transparent,
    transparent 3px, 
    rgba(255, 165, 0, 0.3) 3px, 
    rgba(255, 165, 0, 0.3) 6px
  );
}

.guide-icon.cold {
  background-color: rgba(220, 220, 250, 0.4);
  position: relative;
}

.guide-icon.cold::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.5) 1px,
    transparent 1px
  );
  background-size: 5px 5px;
}

.guide-icon.wet {
  background-color: rgba(173, 216, 230, 0.3);
  position: relative;
}

.guide-icon.wet::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 2px;
  height: 6px;
  background-color: rgba(173, 216, 230, 0.7);
  box-shadow: 
    5px 2px 0 rgba(173, 216, 230, 0.7),
    10px 5px 0 rgba(173, 216, 230, 0.7),
    15px 3px 0 rgba(173, 216, 230, 0.7);
}

.guide-icon.dry {
  background-image: 
    linear-gradient(0deg, rgba(210, 180, 140, 0.3) 10%, transparent 30%),
    linear-gradient(90deg, rgba(210, 180, 140, 0.3) 10%, transparent 30%);
  background-size: 10px 10px;
}

.guide-icon.desertification {
  background-color: rgba(144, 238, 144, 0.3);
  position: relative;
}

.guide-icon.desertification::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    repeating-conic-gradient(
      rgba(210, 180, 140, 0.5) 0% 25%, 
      rgba(245, 222, 179, 0.3) 0% 50%
    );
  background-size: 8px 8px;
  opacity: 0.7;
}

.guide-icon.drying-water {
  background-color: rgba(70, 130, 180, 0.4);
  position: relative;
}

.guide-icon.drying-water::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    linear-gradient(0deg, rgba(120, 120, 120, 0.4) 1px, transparent 1px),
    linear-gradient(90deg, rgba(120, 120, 120, 0.4) 1px, transparent 1px);
  background-size: 7px 7px;
}

.guide-icon.flooding {
  background-color: rgba(70, 130, 180, 0.5);
  position: relative;
}

.guide-icon.flooding::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 50%;
  border: 2px solid rgba(173, 216, 230, 0.5);
  transform: scale(0.8);
}

.guide-icon.nomad, .guide-icon.agriculture, .guide-icon.fishing {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: 16px;
}

p {
  margin: 5px 0;
  font-size: 12px;
}
</style>
