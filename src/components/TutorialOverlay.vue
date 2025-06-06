<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';

// 定义组件属性
const props = defineProps<{
  visible: boolean;
}>();

// 定义组件事件
const emit = defineEmits(['close', 'next', 'previous', 'finish']);

// 教程步骤
const tutorialSteps = [
  {
    title: '欢迎来到生态环境模拟游戏',
    content: '在这个游戏中，你将扮演"气候之神"，通过调节天气来影响地图上的地形和文明发展。这个简短的教程将帮助你了解游戏的基本操作。',
    position: { top: '50%', left: '50%' },
    highlight: null
  },
  {
    title: '地图交互',
    content: '点击地图上的任意单元格，可以打开天气控制面板，选择不同的天气效果（炎热、寒冷、干旱、潮湿）应用到该区域。',
    position: { top: '50%', left: '50%' },
    highlight: '.game-map-container'
  },
  {
    title: '天气效果',
    content: '不同的天气效果会改变单元格的温度和湿度，进而影响地形和文明发展。每次使用天气控制需消耗3金币。天气效果会以50%的强度扩散到相邻四个地块（上、下、左、右）。例如，连续在沙漠应用五次潮湿天气，有50%的概率将其转化为平原。',
    position: { top: '30%', left: '50%' },
    highlight: '.weather-controls'
  },
  {
    title: '游戏指南',
    content: '左侧的游戏指南提供了地形类型、天气控制、环境变化、居民类型和操作提示等详细信息。点击各个按钮可以查看对应的内容。',
    position: { top: '50%', left: '20%' },
    highlight: '.game-guide'
  },
  {
    title: '文明状态',
    content: '右侧面板显示了地图上各个文明的状态，包括类型、位置、人口和资源情况。随着游戏进行，文明会根据环境条件发展或迁徙。',
    position: { top: '50%', left: '80%' },
    highlight: '.control-panel'
  },
  {
    title: '开始你的探索吧！',
    content: '现在你已经了解了游戏的基本操作，开始你的生态环境模拟之旅吧！尝试创造不同的环境条件，观察它们如何影响地形和文明发展。',
    position: { top: '50%', left: '50%' },
    highlight: null
  }
];

// 当前步骤
const currentStep = ref(0);

// 计算当前步骤内容
const currentStepData = ref(tutorialSteps[0]);

// 监听步骤变化
const updateCurrentStep = () => {
  currentStepData.value = tutorialSteps[currentStep.value];
};

// 下一步
const nextStep = () => {
  if (currentStep.value < tutorialSteps.length - 1) {
    currentStep.value++;
    updateCurrentStep();
    emit('next', currentStep.value);
  } else {
    // 完成教程
    emit('finish');
  }
};

// 上一步
const previousStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--;
    updateCurrentStep();
    emit('previous', currentStep.value);
  }
};

// 跳过教程
const skipTutorial = () => {
  emit('finish');
};

// 高亮区域元素
const highlightElement = ref<HTMLElement | null>(null);

// 更新高亮区域
const updateHighlightArea = () => {
  if (!currentStepData.value.highlight) {
    highlightElement.value = null;
    return;
  }
  
  // 等待DOM更新
  setTimeout(() => {
    const selector = currentStepData.value.highlight;
    if (selector) {
      const element = document.querySelector(selector) as HTMLElement;
      if (element) {
        highlightElement.value = element;
      }
    }
  }, 100);
};

// 生命周期钩子
onMounted(() => {
  updateCurrentStep();
  updateHighlightArea();
});

// 监听步骤变化
watch(currentStep, () => {
  updateHighlightArea();
});
</script>

<template>
  <div v-if="visible" class="tutorial-overlay">
    <!-- 半透明背景 -->
    <div class="overlay-background"></div>
    
    <!-- 高亮区域 -->
    <div 
      v-if="highlightElement" 
      class="highlight-area"
      :style="{
        top: highlightElement ? `${highlightElement.getBoundingClientRect().top}px` : '0',
        left: highlightElement ? `${highlightElement.getBoundingClientRect().left}px` : '0',
        width: highlightElement ? `${highlightElement.getBoundingClientRect().width}px` : '0',
        height: highlightElement ? `${highlightElement.getBoundingClientRect().height}px` : '0',
      }"
    ></div>
    
    <!-- 教程内容框 -->
    <div 
      class="tutorial-box"
      :style="{
        top: currentStepData.position.top,
        left: currentStepData.position.left
      }"
    >
      <h3 class="tutorial-title">{{ currentStepData.title }}</h3>
      <p class="tutorial-content">{{ currentStepData.content }}</p>
      
      <div class="tutorial-controls">
        <button 
          v-if="currentStep > 0" 
          class="tutorial-button previous-button" 
          @click="previousStep"
        >
          上一步
        </button>
        
        <button 
          v-if="currentStep < tutorialSteps.length - 1" 
          class="tutorial-button next-button" 
          @click="nextStep"
        >
          下一步
        </button>
        
        <button 
          v-if="currentStep === tutorialSteps.length - 1" 
          class="tutorial-button finish-button" 
          @click="skipTutorial"
        >
          开始游戏
        </button>
      </div>
      
      <button class="skip-button" @click="skipTutorial">跳过教程</button>
    </div>
  </div>
</template>

<style scoped>
.tutorial-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  pointer-events: all;
}

.overlay-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 1001;
}

.highlight-area {
  position: absolute;
  z-index: 1002;
  box-shadow: 0 0 0 2000px rgba(0, 0, 0, 0.7);
  pointer-events: none;
  transition: all 0.5s ease;
  border: 2px solid #3b82f6;
  border-radius: 4px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 2000px rgba(0, 0, 0, 0.7), 0 0 0 0 rgba(59, 130, 246, 0.7);
  }
  70% {
    box-shadow: 0 0 0 2000px rgba(0, 0, 0, 0.7), 0 0 0 10px rgba(59, 130, 246, 0);
  }
  100% {
    box-shadow: 0 0 0 2000px rgba(0, 0, 0, 0.7), 0 0 0 0 rgba(59, 130, 246, 0);
  }
}

.tutorial-box {
  position: absolute;
  transform: translate(-50%, -50%);
  width: 400px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(240, 249, 255, 0.95));
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  z-index: 1003;
  animation: fadeIn 0.5s ease;
}

.tutorial-title {
  font-size: 1.5rem;
  color: #2563eb;
  margin-bottom: 12px;
  text-align: center;
}

.tutorial-content {
  font-size: 1rem;
  line-height: 1.6;
  color: #374151;
  margin-bottom: 20px;
}

.tutorial-controls {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 15px;
}

.tutorial-button {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.previous-button {
  background-color: #e5e7eb;
  color: #4b5563;
}

.previous-button:hover {
  background-color: #d1d5db;
}

.next-button, .finish-button {
  background-color: #3b82f6;
  color: white;
}

.next-button:hover, .finish-button:hover {
  background-color: #2563eb;
  transform: translateY(-2px);
}

.skip-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  color: #6b7280;
  font-size: 0.875rem;
  cursor: pointer;
  text-decoration: underline;
  transition: color 0.3s ease;
}

.skip-button:hover {
  color: #4b5563;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, -60%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
}
</style>
