<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import GameMap from './GameMap.vue';
import ControlPanel from './ControlPanel.vue';
import GameGuide from './GameGuide.vue';
import TutorialPopup from './TutorialPopup.vue';
import VillagerEvent from './VillagerEvent.vue';
import CivilizationEffect from './CivilizationEffect.vue';
import SettleButton from './SettleButton.vue';
import SettlementModal from './SettlementModal.vue';
import ExtremeEnvironmentWarning from './ExtremeEnvironmentWarning.vue';
import DynamicBackground from './DynamicBackground.vue';
import MusicControl from './MusicControl.vue';
import { useGameStore } from '../store/gameStore';

// 教程状态
const showTutorial = ref(false);
const tutorialType = ref(null);

// 关闭教程
const closeTutorial = () => {
  showTutorial.value = false;
  tutorialType.value = null;
};

// 定义组件事件
const emit = defineEmits(['returnToHome']);

const gameStore = useGameStore();

// 处理结算按钮点击
const handleSettlement = () => {
  // 调用游戏状态管理的结算方法
  gameStore.startSettlement();
};

// 关闭结算弹窗
const closeSettlementModal = () => {
  gameStore.closeSettlementModal();
};

// 重新开始游戏
const restartGameFromSettlement = () => {
  gameStore.restartGame();
};

// 生命周期钩子
onMounted(() => {
  console.log('游戏画布已加载');
  
  // 组件初始化完成
  console.log('初始化地图开始');
  gameStore.initializeMap(15);
  console.log('初始化地图完成', gameStore.map.length, 'x', gameStore.map[0]?.length);
  
  // 初始化游戏计时器
  gameStore.startGameTimer();
  
  return () => {
  };
});

onUnmounted(() => {
  console.log('游戏画布已卸载');
  // 清理游戏资源
  gameStore.stopGameTimer();
});
</script>

<template>
  <div class="game-canvas">
    <!-- 动态背景组件，使用绝对定位确保它显示在最底层 -->
    <div class="background-container">
      <DynamicBackground />
    </div>
    <!-- 动态背景已移至外层容器 -->
    <!-- 游戏主体部分 -->
    <div class="game-content">
      <GameGuide class="game-guide" />
      <GameMap class="game-map-wrapper" />
      <ControlPanel class="control-panel-wrapper" @return-to-home="emit('returnToHome')" />
    </div>
    
    <!-- 结局弹窗已由SettlementModal替代 -->
    
    <!-- 警告事件新手教学 -->
    <TutorialPopup 
      :visible="showTutorial" 
      :type="tutorialType" 
      :onClose="() => closeTutorial()"
    />
    
    <!-- 村民交流事件 -->
    <VillagerEvent />
    
    <!-- 文明生成特效 -->
    <CivilizationEffect />
    
    <!-- 结算按钮 -->
    <SettleButton @settle="handleSettlement" />
    
    <!-- 结算弹窗 -->
    <SettlementModal 
      :visible="gameStore.showSettlementModal"
      :outcome-title="gameStore.settlementResult.outcomeTitle"
      :outcome-description="gameStore.settlementResult.outcomeDescription"
      :outcome-comment="gameStore.settlementResult.outcomeComment"
      :poster-image="gameStore.settlementResult.posterImage"
      @close="closeSettlementModal"
      @restart="restartGameFromSettlement"
    />
    
    <!-- 背景音乐控制 -->
    <MusicControl />
    
    <!-- 极端环境警告 -->
    <ExtremeEnvironmentWarning />
  </div>
</template>

<style scoped>
.game-canvas {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  /* 移除背景渐变，使用DynamicBackground组件代替 */
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  font-family: 'Courier New', monospace;
  color: rgba(15, 23, 42, 0.9); /* 深色文字适配浅色背景 */
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
  overflow: hidden; /* 防止出现所有滚动条 */
}

.game-content {
  display: flex;
  flex: 1;
  width: 100%;
  height: 100%;
  overflow: hidden; /* 移除所有滚动条 */
  justify-content: center;
  align-items: center;
  gap: 18px;
  padding: 15px;
  box-sizing: border-box;
  /* 移除模糊效果，避免影响DynamicBackground显示 */
  box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.5); /* 内发光效果 */
  position: relative;
  z-index: 10; /* 增加z-index值，确保内容层在DynamicBackground之上 */
}

/* 背景容器样式 */
.background-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: -5;
  overflow: hidden;
  pointer-events: none; /* 确保不会干扰用户交互 */
}

/* 添加游戏地图包装器样式 */
.game-map-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  flex: 1;
}

/* 添加控制面板包装器样式 */
.control-panel-wrapper {
  height: 100%;
  display: flex;
}

/* 添加游戏指南包装器样式 */
.game-guide {
  height: 100%;
  display: flex;
}

/* 结局弹窗样式 - 马卡龙风格 */
.outcome-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(243, 244, 246, 0.8); /* 马卡龙浅色半透明背景 */
  backdrop-filter: blur(10px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.outcome-content {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(254, 240, 138, 0.2), rgba(167, 243, 208, 0.2)); /* 马卡龙色系渐变 */
  padding: 35px;
  border: 2px solid rgba(147, 197, 253, 0.7); /* 马卡龙浅蓝色边框 */
  border-radius: 16px;
  text-align: center;
  max-width: 500px;
  font-family: 'Courier New', monospace;
  box-shadow: 0 10px 25px rgba(96, 165, 250, 0.5), /* 蓝色阴影 */
              0 0 15px rgba(167, 243, 208, 0.4); /* 绿色光晕 */
  backdrop-filter: blur(8px);
}

.outcome-content h2 {
  margin-top: 0;
  color: rgba(37, 99, 235, 0.9); /* 马卡龙蓝色标题 */
  font-size: 26px;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-weight: 600;
  text-shadow: 0 2px 5px rgba(147, 197, 253, 0.5); /* 浅蓝色阴影 */
}

.outcome-content p {
  margin: 20px 0;
  line-height: 1.6;
  color: rgba(30, 41, 59, 0.9); /* 深灰色文本 */
  font-size: 16px;
  font-weight: 500;
}

.restart-button {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.9), rgba(59, 130, 246, 0.9)); /* 马卡龙蓝色渐变 */
  color: rgba(255, 255, 255, 0.95);
  border: 2px solid rgba(191, 219, 254, 0.8); /* 马卡龙浅蓝色边框 */
  border-radius: 8px;
  padding: 12px 30px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  text-transform: uppercase;
  font-family: 'Courier New', monospace;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5); /* 蓝色阴影 */
  text-shadow: 0 0 5px rgba(219, 234, 254, 0.8); /* 浅蓝色文字光晕 */
}

.restart-button:hover {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(96, 165, 250, 0.9)); /* 更亮的蓝色渐变 */
  color: rgba(255, 255, 255, 1);
  transform: scale(1.05) translateY(-3px);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.7); /* 增强阴影 */
}
</style>
