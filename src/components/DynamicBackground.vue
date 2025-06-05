<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useGameStore } from '../store/gameStore';

const gameStore = useGameStore();

// 地形类型计数
const terrainCounts = ref({
  plain: 0,
  desert: 0,
  hill: 0,
  water: 0
});

// 当前主导地形类型
const dominantTerrain = ref('plain');

// 计算主导地形类型
const calculateDominantTerrain = () => {
  console.log('开始计算主导地形类型');
  // 重置计数
  terrainCounts.value = {
    plain: 0,
    desert: 0,
    hill: 0,
    water: 0
  };
  
  // 统计各地形类型数量
  if (gameStore.map && gameStore.map.length > 0) {
    console.log('地图大小:', gameStore.map.length, 'x', gameStore.map[0]?.length);
    
    for (let y = 0; y < gameStore.map.length; y++) {
      for (let x = 0; x < gameStore.map[y].length; x++) {
        const cell = gameStore.map[y][x];
        if (cell && cell.terrain) {
          // 确保地形类型有效
          if (terrainCounts.value[cell.terrain] !== undefined) {
            terrainCounts.value[cell.terrain]++;
          }
        }
      }
    }
    
    console.log('地形统计:', terrainCounts.value);
    
    // 找出数量最多的地形类型
    let maxCount = 0;
    let maxTerrain = 'plain';
    
    for (const [terrain, count] of Object.entries(terrainCounts.value)) {
      if (count > maxCount) {
        maxCount = count;
        maxTerrain = terrain;
      }
    }
    
    console.log('主导地形类型:', maxTerrain, '数量:', maxCount);
    dominantTerrain.value = maxTerrain;
  } else {
    console.warn('地图数据不可用');
    dominantTerrain.value = 'plain'; // 默认为平原
  }
};

// 监听地图变化
watch(() => gameStore.map, () => {
  calculateDominantTerrain();
}, { deep: true });

// 计算背景样式
const backgroundStyle = computed(() => {
  console.log('计算背景样式，当前主导地形:', dominantTerrain.value);
  
  // 基础样式
  let background = '';
  let boxShadow = '';
  let animation = '';
  
  // 根据地形类型设置不同的背景和动画
  switch (dominantTerrain.value) {
    case 'plain':
      background = 'linear-gradient(-45deg, rgb(126, 217, 87), rgb(147, 237, 168), rgb(94, 199, 132), rgb(150, 222, 60))';
      boxShadow = 'inset 0 0 200px rgb(126, 217, 87)';
      animation = 'plain-animation 60s infinite linear';
      break;
    case 'desert':
      background = 'linear-gradient(-45deg, rgb(252, 211, 77), rgb(251, 191, 36), rgb(253, 224, 71), rgb(234, 179, 8))';
      boxShadow = 'inset 0 0 200px rgb(252, 211, 77)';
      animation = 'desert-animation 60s infinite linear';
      break;
    case 'hill':
      background = 'linear-gradient(-45deg, rgb(180, 83, 9), rgb(146, 64, 14), rgb(120, 53, 15), rgb(154, 52, 18))';
      boxShadow = 'inset 0 0 200px rgb(180, 83, 9)';
      animation = 'hill-animation 60s infinite linear';
      break;
    case 'water':
      background = 'linear-gradient(-45deg, rgb(96, 165, 250), rgb(59, 130, 246), rgb(147, 197, 253), rgb(37, 99, 235))';
      boxShadow = 'inset 0 0 200px rgb(96, 165, 250)';
      animation = 'water-animation 30s infinite linear';
      break;
    default:
      background = 'linear-gradient(-45deg, rgb(126, 217, 87), rgb(147, 237, 168), rgb(94, 199, 132), rgb(150, 222, 60))';
      boxShadow = 'inset 0 0 200px rgb(126, 217, 87)';
      animation = 'plain-animation 60s infinite linear';
      break;
  }
  
  console.log('应用的动画样式:', animation);
  return {
    background,
    boxShadow,
    animation,
    backgroundSize: '400% 400%'
  };
});

// 组件挂载时计算主导地形
onMounted(() => {
  console.log('动态背景组件已加载');
  
  // 等待地图数据加载完成
  setTimeout(() => {
    // 初始计算
    calculateDominantTerrain();
    
    // 设置定期更新
    const intervalId = setInterval(() => {
      calculateDominantTerrain();
    }, 10000); // 每10秒更新一次
    
    // 组件卸载时清除定时器
    return () => {
      clearInterval(intervalId);
    };
  }, 1000); // 等待地图数据加载
});
</script>

<template>
  <!-- 使用绝对定位确保背景全屏显示 -->
  <div class="dynamic-background" :style="backgroundStyle">
    <!-- 添加一个全屏遮罩，增强背景效果 -->
    <div class="fullscreen-overlay"></div>
    <!-- 地形遮罩层 -->
    <div class="terrain-overlay"></div>
    <!-- 显示当前主导地形类型，便于调试 -->
    <div class="debug-info">
      当前主导地形: {{ dominantTerrain }}
    </div>
  </div>
</template>

<style scoped>
.dynamic-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw; /* 使用视口宽度单位确保全屏 */
  height: 100vh; /* 使用视口高度单位确保全屏 */
  z-index: -10; /* 调低z-index为负值，确保在最底层 */
  background-size: 400% 400%;
  animation-play-state: running !important; /* 确保动画正在运行 */
  opacity: 1; /* 完全不透明 */
  pointer-events: none; /* 确保不会干扰用户交互 */
  transition: all 2s ease-in-out;
}

.fullscreen-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.2); /* 添加深色遮罩增强背景对比度 */
  z-index: -1;
}

.terrain-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(255, 255, 255, 0.1);
  z-index: -2;
}

.debug-info {
  position: absolute;
  top: 10px;
  left: 10px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 14px;
  z-index: 1000;
}

/* 平原背景动画 */
.plain {
  background: linear-gradient(-45deg, 
    rgba(166, 227, 161, 0.9), 
    rgba(187, 247, 208, 0.9),
    rgba(134, 239, 172, 0.9),
    rgba(190, 242, 100, 0.9)
  );
  box-shadow: inset 0 0 200px rgba(166, 227, 161, 0.7);
}

@keyframes plain-animation {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* 沙漠背景动画 */
.desert {
  background: linear-gradient(-45deg, 
    rgba(252, 211, 77, 0.9), 
    rgba(251, 191, 36, 0.9),
    rgba(253, 224, 71, 0.9),
    rgba(234, 179, 8, 0.9)
  );
  box-shadow: inset 0 0 200px rgba(252, 211, 77, 0.7);
}

@keyframes desert-animation {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* 丘陵背景动画 */
.hill {
  background: linear-gradient(-45deg, 
    rgba(180, 83, 9, 0.9), 
    rgba(146, 64, 14, 0.9),
    rgba(120, 53, 15, 0.9),
    rgba(154, 52, 18, 0.9)
  );
  box-shadow: inset 0 0 200px rgba(180, 83, 9, 0.7);
}

@keyframes hill-animation {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* 水域背景动画 */
.water {
  background: linear-gradient(-45deg, 
    rgba(96, 165, 250, 0.9), 
    rgba(59, 130, 246, 0.9),
    rgba(147, 197, 253, 0.9),
    rgba(37, 99, 235, 0.9)
  );
  box-shadow: inset 0 0 200px rgba(96, 165, 250, 0.7);
}

@keyframes water-animation {
  0% {
    background-position: 0% 50%;
  }
  25% {
    background-position: 50% 0%;
  }
  50% {
    background-position: 100% 50%;
  }
  75% {
    background-position: 50% 100%;
  }
  100% {
    background-position: 0% 50%;
  }
}
</style>
