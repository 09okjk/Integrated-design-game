<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useGameStore } from '../store/gameStore';
import VillagerIcon from './VillagerIcon.vue';
import CivilizationIcon from './CivilizationIcon.vue';
import soundService from '../services/SoundService';

const gameStore = useGameStore();

// 定义事件状态
const isVisible = ref(false);
const eventRequest = ref('');
const targetRegion = ref({ x: 0, y: 0 });
const targetParameter = ref('');
const targetCondition = ref('');
const countdown = ref(60);
const isCountingDown = ref(false);
const requestAccepted = ref(false);

// 村民类型
const villagerType = ref('default');

// 奖励选择状态
const showRewards = ref(false);
const placingCivilization = ref(false);
const selectedCivilizationType = ref('');
const rewardMessage = ref('');

// 计算属性
const hasEnoughCoins = computed(() => {
  return gameStore.coins >= 10;
});

// 格式化坐标显示
const formattedCoordinates = computed(() => {
  return `(${targetRegion.value.x}, ${targetRegion.value.y})`;
});

// 事件生成函数
const generateEvent = () => {
  // 随机选择村民类型
  const villagerTypes = ['default', 'elder', 'farmer', 'hunter', 'shaman'];
  villagerType.value = villagerTypes[Math.floor(Math.random() * villagerTypes.length)];
  
  // 随机选择区域
  const regions = ['东北', '西北', '东南', '西南', '中央', '丘陵区', '平原', '水域边缘'];
  targetRegion.value = {
    x: Math.floor(Math.random() * gameStore.mapWidth),
    y: Math.floor(Math.random() * gameStore.mapHeight)
  };
  const regionName = regions[Math.floor(Math.random() * regions.length)];
  
  // 随机选择参数
  const parameters = ['降雨', '干旱', '升温', '降温'];
  const parameterIndex = Math.floor(Math.random() * parameters.length);
  targetParameter.value = parameters[parameterIndex];
  
  // 根据参数设置目标条件
  switch (targetParameter.value) {
    case '降雨':
      targetCondition.value = '湿度提升≥30%';
      break;
    case '干旱':
      targetCondition.value = '湿度降低≥30%';
      break;
    case '升温':
      targetCondition.value = '温度提升≥30%';
      break;
    case '降温':
      targetCondition.value = '温度降低≥30%';
      break;
  }
  
  // 获取当前极端状态
  const cell = gameStore.getCellAt(targetRegion.value.x, targetRegion.value.y);
  let extremeCondition = '';
  if (cell) {
    if (cell.humidity < 30) extremeCondition = '干旱';
    else if (cell.humidity > 70) extremeCondition = '潮湿';
    else if (cell.temperature < 30) extremeCondition = '寒冷';
    else if (cell.temperature > 70) extremeCondition = '炎热';
    else extremeCondition = '平衡';
  }
  
  // 随机选择请求模板类型
  const templateTypes = ['环境改善', '资源需求', '信仰祭祀', '紧急求助', '自然征兆', '文明互动', '季节时间'];
  const templateType = templateTypes[Math.floor(Math.random() * templateTypes.length)];
  
  // 坐标文本
  const coordText = `坐标${targetRegion.value.x},${targetRegion.value.y}`;
  
  // 根据模板类型生成请求内容
  let requestText = '';
  
  switch (templateType) {
    case '环境改善':
      const environmentTemplates = [
        `神明大人！${coordText}处${regionName}的土地龟裂已久，恳请您降下${targetParameter.value}，拯救我们的庄稼！`,
        `这片${coordText}处${regionName}的炎热令人窒息，能否赐予一丝${targetParameter.value}的清凉？`,
        `若您能让${coordText}处${regionName}的${extremeCondition}转为${targetParameter.value}，我们愿献上双倍供奉！`
      ];
      requestText = environmentTemplates[Math.floor(Math.random() * environmentTemplates.length)];
      break;
      
    case '资源需求':
      const resourceTemplates = [
        `部落的储水即将耗尽！求您在${coordText}处${regionName}降下${targetParameter.value}，否则我们将无法生存！`,
        `猎物因${extremeCondition}逃离了${coordText}处${regionName}，请用${targetParameter.value}召回它们！`,
        `渔获日渐稀少……唯有在${coordText}处${targetParameter.value}能唤醒沉睡的水域！`
      ];
      requestText = resourceTemplates[Math.floor(Math.random() * resourceTemplates.length)];
      break;
      
    case '信仰祭祀':
      const faithTemplates = [
        `我们已在${coordText}处筑起祭坛！请以${targetParameter.value}回应子民的虔诚！`,
        `若您让${coordText}处${regionName}变得更${targetParameter.value}，今夜我们将点燃篝火歌颂您的伟力！`,
        `古老的预言说：当${targetParameter.value}降临${coordText}处${regionName}，神明会赐予我们新的家园！`
      ];
      requestText = faithTemplates[Math.floor(Math.random() * faithTemplates.length)];
      break;
      
    case '紧急求助':
      const emergencyTemplates = [
        `洪水即将淹没${coordText}处${regionName}！求您用${targetParameter.value}阻止这场灾难！`,
        `${coordText}处${regionName}的狂风摧毁了房屋，唯有${targetParameter.value}能平息自然之怒！`,
        `疫病在${coordText}处${extremeCondition}中蔓延……只有${targetParameter.value}能净化这片土地！`
      ];
      requestText = emergencyTemplates[Math.floor(Math.random() * emergencyTemplates.length)];
      break;
      
    case '自然征兆':
      const omenTemplates = [
        `占卜显示：若${coordText}处${regionName}未在明日获得${targetParameter.value}，蝗灾将席卷大地！`,
        `夜观星象，${targetParameter.value}之力将在${coordText}处${regionName}引发神迹！`,
        `祖先托梦说：唯有在${coordText}处${targetParameter.value}能阻止即将降临的冰霜！`
      ];
      requestText = omenTemplates[Math.floor(Math.random() * omenTemplates.length)];
      break;
      
    case '文明互动':
      const civilizationTemplates = [
        `邻族嘲弄我们无法在${coordText}处获得神明的${targetParameter.value}，请证明他们的愚昧！`,
        `${coordText}处游牧与农耕部落因${extremeCondition}争执，唯有${targetParameter.value}能带来和平！`,
        `若您在${coordText}处赐予${targetParameter.value}，我们愿与邻近部落共享丰饶！`
      ];
      requestText = civilizationTemplates[Math.floor(Math.random() * civilizationTemplates.length)];
      break;
      
    case '季节时间':
      const seasonTemplates = [
        `丰收季临近，但${coordText}处${regionName}的${extremeCondition}恐毁掉一切！`,
        `寒冬将至，求您在${coordText}处用${targetParameter.value}延长最后的温暖时光！`,
        `月圆之夜是祭祀的最佳时机，请在${coordText}处让${targetParameter.value}照亮仪式！`
      ];
      requestText = seasonTemplates[Math.floor(Math.random() * seasonTemplates.length)];
      break;
  }
  
  eventRequest.value = requestText;
  isVisible.value = true;
  requestAccepted.value = false;
  countdown.value = 60;
  
  // 播放村民请求提醒音效
  soundService.play('villager');
};

// 处理玩家选择
const dismissWithCoins = () => {
  if (hasEnoughCoins.value) {
    gameStore.spendCoins(10);
    isVisible.value = false;
    isCountingDown.value = false;
    resetEventTimer();
  }
};

const acceptRequest = () => {
  requestAccepted.value = true;
  isCountingDown.value = true;
  startConditionCheck();
};

// 检查条件是否满足
const checkCondition = () => {
  const cell = gameStore.getCellAt(targetRegion.value.x, targetRegion.value.y);
  if (!cell) return false;
  
  const initialCell = gameStore.getInitialCellState(targetRegion.value.x, targetRegion.value.y);
  if (!initialCell) return false;
  
  switch (targetParameter.value) {
    case '降雨':
      return cell.humidity >= initialCell.humidity + 30;
    case '干旱':
      return cell.humidity <= initialCell.humidity - 30;
    case '升温':
      return cell.temperature >= initialCell.temperature + 30;
    case '降温':
      return cell.temperature <= initialCell.temperature - 30;
    default:
      return false;
  }
};

// 开始条件检查
let conditionCheckInterval: number | null = null;
const startConditionCheck = () => {
  // 保存初始状态用于比较
  gameStore.saveInitialCellState(targetRegion.value.x, targetRegion.value.y);
  
  // 每5秒检查一次条件
  conditionCheckInterval = window.setInterval(() => {
    if (checkCondition()) {
      // 条件满足
      handleRequestSuccess();
      clearInterval(conditionCheckInterval as number);
      conditionCheckInterval = null;
    }
  }, 5000);
  
  // 倒计时
  const countdownInterval = window.setInterval(() => {
    countdown.value--;
    
    if (countdown.value <= 0) {
      // 时间到，请求失败
      clearInterval(countdownInterval);
      if (conditionCheckInterval) {
        clearInterval(conditionCheckInterval);
        conditionCheckInterval = null;
      }
      handleRequestFailure();
    }
  }, 1000);
};

// 处理请求成功
const handleRequestSuccess = () => {
  // 停止倒计时
  isCountingDown.value = false;
  requestAccepted.value = false;
  
  // 显示奖励选择界面
  showRewards.value = true;
  rewardMessage.value = '感谢您的帮助！请选择您的奖励：';
};

// 选择金币奖励
const selectCoinReward = () => {
  // 增加10个金币
  gameStore.addCoins(10);
  
  // 显示成功消息
  rewardMessage.value = '您获得了10个金币！';
  
  // 2秒后关闭奖励界面
  setTimeout(() => {
    closeRewards();
  }, 2000);
};

// 选择文明奖励
const selectCivilizationReward = () => {
  // 随机选择一种文明类型
  const civTypes = ['nomad', 'agriculture', 'fishing', 'farming'];
  selectedCivilizationType.value = civTypes[Math.floor(Math.random() * civTypes.length)];
  
  // 进入放置文明模式
  placingCivilization.value = true;
  
  // 显示提示消息
  rewardMessage.value = `请点击地图上的位置放置${selectedCivilizationType.value === 'nomad' ? '游牧文明' : 
    selectedCivilizationType.value === 'agriculture' ? '农耕部落' : 
    selectedCivilizationType.value === 'fishing' ? '渔猎部落' : '农耕文明'}`;
  
  // 触发自定义事件，通知地图进入放置文明模式
  window.dispatchEvent(new CustomEvent('enter-civilization-placement-mode', {
    detail: {
      civilizationType: selectedCivilizationType.value
    }
  }));
};

// 放置文明
const placeCivilization = (x: number, y: number) => {
  // 创建文明
  gameStore.createCivilizationOfType({ x, y }, selectedCivilizationType.value);
  
  // 显示成功消息
  rewardMessage.value = '文明已成功放置！';
  
  // 退出放置模式
  placingCivilization.value = false;
  
  // 触发自定义事件，通知地图退出放置文明模式
  window.dispatchEvent(new CustomEvent('exit-civilization-placement-mode'));
  
  // 2秒后关闭奖励界面
  setTimeout(() => {
    closeRewards();
  }, 2000);
};

// 关闭奖励界面
const closeRewards = () => {
  showRewards.value = false;
  isVisible.value = false;
  resetEventTimer();
};

// 处理请求失败
const handleRequestFailure = () => {
  isVisible.value = false;
  isCountingDown.value = false;
  requestAccepted.value = false;
  resetEventTimer();
};

// 生成新文明
// const generateNewCivilization = () => {
//   // 根据当前环境状态决定文明类型
//   const cell = gameStore.getCellAt(targetRegion.value.x, targetRegion.value.y);
//   if (!cell) return;
  
//   let civilizationType = '';
  
//   if (cell.terrain === 'plain' && cell.humidity > 50) {
//     civilizationType = 'agriculture'; // 农耕部落
//   } else if (cell.terrain === 'hill' && cell.humidity < 50) {
//     civilizationType = 'nomad'; // 游牧族群
//   } else if (cell.terrain === 'water' || (cell.terrain === 'plain' && cell.humidity > 70)) {
//     civilizationType = 'fishing'; // 渔猎部落
//   } else {
//     // 默认为游牧
//     civilizationType = 'nomad';
//   }
  
//   // 触发文明生成事件
//   window.dispatchEvent(new CustomEvent('generate-new-civilization', {
//     detail: {
//       position: targetRegion.value,
//       type: civilizationType
//     }
//   }));
  
//   // 播放特效
//   window.dispatchEvent(new CustomEvent('play-civilization-effect', {
//     detail: {
//       position: targetRegion.value
//     }
//   }));
// };

// 事件计时器
let eventTimer: number | null = null;

// 重置事件计时器
const resetEventTimer = () => {
  if (eventTimer) {
    clearTimeout(eventTimer);
  }
  
  // 1分钟后触发新事件
  eventTimer = window.setTimeout(() => {
    generateEvent();
  }, 60000); // 60秒
};

// 监听地图点击事件
const handleMapClick = (event: CustomEvent) => {
  if (placingCivilization.value) {
    const { x, y } = event.detail;
    placeCivilization(x, y);
  }
};

// 组件挂载时启动事件系统
onMounted(() => {
  // 初始化游戏状态
  gameStore.initializeVillagerEventSystem();
  
  // 立即触发第一个事件
  generateEvent();
  
  // 添加地图点击事件监听器
  window.addEventListener('map-cell-clicked', handleMapClick as EventListener);
});

// 组件卸载时清理
onUnmounted(() => {
  if (eventTimer) {
    clearTimeout(eventTimer);
  }
  
  if (conditionCheckInterval) {
    clearInterval(conditionCheckInterval);
  }
  
  // 移除地图点击事件监听器
  window.removeEventListener('map-cell-clicked', handleMapClick as EventListener);
});
</script>

<template>
  <div class="villager-event-container" v-if="isVisible || showRewards">
    <div class="villager-icon" :class="{ 'shake-animation': countdown < 10 && isCountingDown }">
      <VillagerIcon :type="villagerType" :size="140" />
    </div>
    
    <div class="speech-bubble">
      <!-- 请求内容 -->
      <div v-if="!showRewards">
        <div class="request-text">{{ eventRequest }}</div>
        
        <div class="condition-info" v-if="requestAccepted">
          <div class="condition-text">目标坐标: {{ formattedCoordinates }}</div>
          <div class="condition-text">目标条件: {{ targetCondition }}</div>
          <div class="countdown-bar">
            <div class="countdown-progress" :style="{ width: (countdown / 60 * 100) + '%' }"></div>
          </div>
          <div class="countdown-text">{{ countdown }}秒</div>
        </div>
        
        <div class="action-buttons" v-if="!requestAccepted">
          <button 
            class="coin-button" 
            @click="dismissWithCoins" 
            :disabled="!hasEnoughCoins"
            :class="{ 'disabled': !hasEnoughCoins }"
          >
            <span class="coin-icon">🪙</span>
            <span>支付10金币</span>
          </button>
          
          <button class="accept-button" @click="acceptRequest">
            <span>接受请求</span>
          </button>
        </div>
      </div>
      
      <!-- 奖励选择界面 -->
      <div v-if="showRewards">
        <div class="reward-text">{{ rewardMessage }}</div>
        
        <div class="action-buttons" v-if="!placingCivilization">
          <button class="coin-button" @click="selectCoinReward">
            <span class="coin-icon">🪙</span>
            <span>获得10金币</span>
          </button>
          
          <button class="civilization-button" @click="selectCivilizationReward">
            <span class="civ-icon">🏛️</span>
            <span>获得新文明</span>
          </button>
        </div>
      </div>
    </div>
  </div>
  
  <!-- 放置文明时的提示 -->
  <div class="placement-hint" v-if="placingCivilization">
    <div class="hint-content">
      <CivilizationIcon :type="selectedCivilizationType" :size="40" />
      <span>{{ rewardMessage }}</span>
    </div>
  </div>
</template>

<style scoped>
.villager-event-container {
  position: fixed;
  bottom: 20px;
  left: 20px;
  display: flex;
  align-items: flex-end;
  z-index: 1000;
  pointer-events: auto;
}

.villager-icon {
  width: 120px;
  height: 120px;
  animation: float 3s ease-in-out infinite;
  margin-right: -20px;
  z-index: 1001;
}

/* 删除了.villager-image样式，现在使用VillagerIcon组件 */

.speech-bubble {
  position: relative;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 15px;
  max-width: 300px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.speech-bubble:after {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 0;
  height: 0;
  border: 15px solid transparent;
  border-right-color: rgba(255, 255, 255, 0.95);
  border-left: 0;
  margin-top: -15px;
  margin-left: -15px;
}

.request-text, .reward-text {
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 15px;
  color: #333;
}

.reward-text {
  font-weight: bold;
  color: #4a6fa5;
}

.condition-info {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #ccc;
}

.condition-text {
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
}

.countdown-bar {
  height: 8px;
  background-color: #eee;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 5px;
}

.countdown-progress {
  height: 100%;
  background-color: #ff6b6b;
  transition: width 1s linear;
}

.countdown-text {
  font-size: 12px;
  color: #ff6b6b;
  text-align: right;
}

.action-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 15px;
}

.coin-button, .accept-button, .civilization-button {
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.2s ease;
}

.coin-button {
  background-color: #ffd700;
  color: #333;
}

.coin-button:hover:not(.disabled) {
  background-color: #ffcc00;
  transform: translateY(-2px);
}

.coin-button.disabled {
  background-color: #e0e0e0;
  color: #999;
  cursor: not-allowed;
}

.coin-icon, .civ-icon {
  margin-right: 5px;
}

.accept-button {
  background-color: #4caf50;
  color: white;
}

.accept-button:hover {
  background-color: #45a049;
  transform: translateY(-2px);
}

.civilization-button {
  background-color: #3f51b5;
  color: white;
}

.civilization-button:hover {
  background-color: #303f9f;
  transform: translateY(-2px);
}

/* 放置文明时的提示样式 */
.placement-hint {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;
  pointer-events: none;
}

.hint-content {
  display: flex;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 10px 15px;
  border-radius: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.hint-content span {
  margin-left: 10px;
  font-size: 14px;
}

@keyframes float {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0px);
  }
}

.shake-animation {
  animation: shake 0.5s infinite;
}

@keyframes shake {
  0% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  50% { transform: translateX(0); }
  75% { transform: translateX(5px); }
  100% { transform: translateX(0); }
}
</style>
