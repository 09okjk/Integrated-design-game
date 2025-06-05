<script setup lang="ts">
import { ref, onMounted } from 'vue'
import GameCanvas from './components/GameCanvas.vue'
import TutorialOverlay from './components/TutorialOverlay.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import GameMenu from './components/GameMenu.vue'
import gameBackground from './assets/images/game-background.jpg'

// 游戏状态管理
const isGameStarted = ref(false)
const gameTitle = ref('自然协奏曲：原始时代')

// 新手引导状态
const showTutorial = ref(false)
// const tutorialCompleted = ref(false)
// const firstTimePlay = ref(true) // 用于记录是否是第一次游玩

// 面板显示状态
const showSettings = ref(false)
const showMenu = ref(false)

// 游戏控制函数
const startGame = () => {
  isGameStarted.value = true
  
  // 每次开始游戏都显示教程
  setTimeout(() => {
    showTutorial.value = true
  }, 1000) // 等待游戏界面加载后再显示教程
}

// 打开设置面板
const openSettings = () => {
  showSettings.value = true
}

// 关闭设置面板
const closeSettings = () => {
  showSettings.value = false
}

// 打开菜单
const openMenu = () => {
  showMenu.value = true
}

// 关闭菜单
const closeMenu = () => {
  showMenu.value = false
}

// 退出游戏
const exitGame = () => {
  window.close()
  // 如果window.close()不起作用（大多数浏览器会阻止），提示用户手动关闭
  alert('请手动关闭浏览器窗口以退出游戏。')
}

// 完成教程
const finishTutorial = () => {
  showTutorial.value = false
}

// 返回首页函数
const returnToHome = () => {
  isGameStarted.value = false
  showTutorial.value = false
}

// 生命周期钩子
onMounted(() => {
  console.log('游戏界面已加载')
})
</script>

<template>
  <div class="game-container">
    <!-- 首页背景图层 -->
    <div v-if="!isGameStarted" class="background-layer">
      <img :src="gameBackground" alt="游戏背景" class="background-image" />
    </div>
    
    <!-- 首页按钮层 -->
    <div v-if="!isGameStarted" class="main-menu">
      <h1>{{ gameTitle }}</h1>
      
      <div class="menu-buttons">
        <button @click="startGame" class="menu-button start-button">
          <span class="button-icon">▶</span>
          开始游戏
        </button>
        
        <button @click="openSettings" class="menu-button settings-button">
          <span class="button-icon">⚙</span>
          设置
        </button>
        
        <button @click="openMenu" class="menu-button info-button">
          <span class="button-icon">ℹ</span>
          菜单
        </button>
        
        <button @click="exitGame" class="menu-button exit-button">
          <span class="button-icon">✕</span>
          退出游戏
        </button>
      </div>
    </div>
    
    <!-- 游戏主界面 -->
    <GameCanvas v-else @return-to-home="returnToHome" />
    
    <!-- 新手教程层 -->
    <TutorialOverlay 
      :visible="showTutorial" 
      @finish="finishTutorial"
      @next="(step) => console.log('Tutorial step:', step)"
      @previous="(step) => console.log('Tutorial step:', step)"
    />
    
    <!-- 设置面板 -->
    <SettingsPanel 
      :visible="showSettings"
      @close="closeSettings"
    />
    
    <!-- 游戏菜单 -->
    <GameMenu
      :visible="showMenu"
      @close="closeMenu"
    />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

body {
  font-family: 'Courier New', monospace;
  /* 移除背景渐变，使用DynamicBackground组件代替 */
  min-height: 100vh;
  color: rgba(15, 23, 42, 0.9); /* 深色文字适配浅色背景 */
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
  position: relative;
}

.game-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

/* 背景图层样式 */
.background-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.background-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  opacity: 0.85; /* 调整透明度以便文字更清晰 */
}

.main-menu {
  text-align: center;
  position: relative;
  z-index: 2; /* 确保内容层在背景层之上 */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  max-width: 400px;
  margin-top: 90vh; /* 将整体内容向下移动90%，使其非常靠近页面底部 */
  transform: translateY(-90%); /* 微调位置，保持内容在可见范围内 */
}

.main-menu h1 {
  font-size: 2.5rem;
  color: rgba(255, 255, 255, 0.95); /* 白色标题 */
  margin-bottom: 2rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.7), /* 黑色阴影 */
               0 0 20px rgba(147, 197, 253, 0.8); /* 蓝色光晕 */
}

.menu-buttons {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  width: 100%;
}

.menu-button {
  background-color: rgba(255, 255, 255, 0.85); /* 半透明浅色背景 */
  color: rgba(30, 41, 59, 0.9);
  border: 2px solid rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  padding: 1rem 2rem;
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(5px);
}

.button-icon {
  margin-right: 10px;
  font-size: 1.3rem;
}

.menu-button:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
}

/* 开始游戏按钮 */
.start-button {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.45), rgba(59, 130, 246, 0.45)); /* 马卡龙蓝色渐变，透明度50% */
  color: rgba(255, 255, 255, 0.95);
  border: 2px solid rgba(191, 219, 254, 0.8); /* 马卡龙浅蓝色边框 */
}

.start-button:hover {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.45), rgba(96, 165, 250, 0.45)); /* 更亮的蓝色渐变，透明度50% */
}

/* 设置按钮 */
.settings-button {
  background: linear-gradient(135deg, rgba(74, 222, 128, 0.45), rgba(34, 197, 94, 0.45)); /* 绿色渐变，透明度50% */
  color: rgba(255, 255, 255, 0.95);
  border: 2px solid rgba(187, 247, 208, 0.8); /* 浅绿色边框 */
}

.settings-button:hover {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.45), rgba(22, 163, 74, 0.45)); /* 更深的绿色渐变，透明度50% */
}

/* 菜单按钮 */
.info-button {
  background: linear-gradient(135deg, rgba(251, 146, 60, 0.45), rgba(249, 115, 22, 0.45)); /* 橙色渐变，透明度50% */
  color: rgba(255, 255, 255, 0.95);
  border: 2px solid rgba(254, 215, 170, 0.8); /* 浅橙色边框 */
}

.info-button:hover {
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.45), rgba(234, 88, 12, 0.45)); /* 更深的橙色渐变，透明度50% */
}

/* 退出游戏按钮 */
.exit-button {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.45), rgba(220, 38, 38, 0.45)); /* 红色渐变，透明度50% */
  color: rgba(255, 255, 255, 0.95);
  border: 2px solid rgba(254, 202, 202, 0.8); /* 浅红色边框 */
}

.exit-button:hover {
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.45), rgba(185, 28, 28, 0.45)); /* 更深的红色渐变，透明度50% */
}
</style>
