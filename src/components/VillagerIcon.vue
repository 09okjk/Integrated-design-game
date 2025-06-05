<script setup lang="ts">
import { ref, onMounted } from 'vue';

// 定义组件属性
const props = defineProps({
  type: {
    type: String,
    default: 'default'
  },
  size: {
    type: Number,
    default: 120
  }
});

// 图标URL状态
const gifIconSrc = ref<string | null>(null);
const fallbackIconSrc = ref<string | null>(null);

// 加载图标
onMounted(() => {
  loadIcon();
});

// 加载图标函数
const loadIcon = () => {
  try {
    // 尝试加载PNG图标
    switch (props.type) {
      case 'default':
        gifIconSrc.value = new URL('/src/assets/icons/villagers/default.png', import.meta.url).href;
        break;
      case 'elder':
        gifIconSrc.value = new URL('/src/assets/icons/villagers/elder.png', import.meta.url).href;
        break;
      case 'farmer':
        gifIconSrc.value = new URL('/src/assets/icons/villagers/farmer.png', import.meta.url).href;
        break;
      case 'hunter':
        gifIconSrc.value = new URL('/src/assets/icons/villagers/hunter.png', import.meta.url).href;
        break;
      case 'shaman':
        gifIconSrc.value = new URL('/src/assets/icons/villagers/shaman.png', import.meta.url).href;
        break;
      default:
        // 默认使用default图标
        gifIconSrc.value = new URL('/src/assets/icons/villagers/default.png', import.meta.url).href;
        break;
    }
  } catch (error) {
    console.error('无法加载村民图标:', error);
    // 使用SVG作为后备图标
    fallbackIconSrc.value = generateFallbackIcon();
  }
};

// 生成后备图标
const generateFallbackIcon = () => {
  // 根据类型生成不同的SVG图标
  switch (props.type) {
    case 'elder':
      return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="30" r="20" fill="%23e0e0e0"/><circle cx="50" cy="70" r="30" fill="%23a0a0a0"/><circle cx="40" cy="25" r="3" fill="%23000"/><circle cx="60" cy="25" r="3" fill="%23000"/><path d="M40,40 Q50,35 60,40" stroke="%23000" fill="none" stroke-width="2"/><path d="M30,15 L45,20 M70,15 L55,20" stroke="%23fff" fill="none" stroke-width="2"/></svg>';
    case 'farmer':
      return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="30" r="20" fill="%23f5d0a9"/><circle cx="50" cy="70" r="30" fill="%23a67c52"/><circle cx="40" cy="25" r="3" fill="%23000"/><circle cx="60" cy="25" r="3" fill="%23000"/><path d="M40,40 Q50,45 60,40" stroke="%23000" fill="none" stroke-width="2"/><path d="M20,50 L80,50" stroke="%23654321" fill="none" stroke-width="3"/></svg>';
    case 'hunter':
      return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="30" r="20" fill="%23f5d0a9"/><circle cx="50" cy="70" r="30" fill="%23a67c52"/><circle cx="40" cy="25" r="3" fill="%23000"/><circle cx="60" cy="25" r="3" fill="%23000"/><path d="M40,40 Q50,40 60,40" stroke="%23000" fill="none" stroke-width="2"/><path d="M80,30 L60,40" stroke="%23654321" fill="none" stroke-width="2"/></svg>';
    case 'shaman':
      return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="30" r="20" fill="%23f5d0a9"/><circle cx="50" cy="70" r="30" fill="%23a67c52"/><circle cx="40" cy="25" r="3" fill="%23000"/><circle cx="60" cy="25" r="3" fill="%23000"/><path d="M40,40 Q50,50 60,40" stroke="%23000" fill="none" stroke-width="2"/><path d="M30,10 L70,10 L50,30 Z" fill="%23ff0000" stroke="%23000" stroke-width="1"/></svg>';
    default:
      return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="30" r="20" fill="%23f5d0a9"/><circle cx="50" cy="70" r="30" fill="%23a67c52"/><circle cx="40" cy="25" r="3" fill="%23000"/><circle cx="60" cy="25" r="3" fill="%23000"/><path d="M40,40 Q50,50 60,40" stroke="%23000" fill="none" stroke-width="2"/></svg>';
  }
};

// 图标加载错误处理
const handleIconError = () => {
  console.warn('村民图标加载失败，使用后备图标');
  fallbackIconSrc.value = generateFallbackIcon();
};
</script>

<template>
  <div class="villager-icon-container" :style="{ width: `${size}px`, height: `${size}px` }">
    <img 
      v-if="gifIconSrc" 
      :src="gifIconSrc" 
      class="icon-image" 
      @error="handleIconError"
      :style="{ width: `${size}px`, height: `${size}px` }"
      alt="村民图标"
    />
    <div 
      v-else-if="fallbackIconSrc" 
      class="icon-fallback"
      :style="{ 
        backgroundImage: `url('${fallbackIconSrc}')`,
        width: `${size}px`, 
        height: `${size}px` 
      }"
    ></div>
  </div>
</template>

<style scoped>
.villager-icon-container {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: visible;
  animation: float 3s ease-in-out infinite;
}

.icon-image {
  object-fit: contain;
  /* 确保图标显示在顶层 */
  z-index: 25;
  /* 添加轻微阴影使图标更加突出 */
  filter: drop-shadow(0 0 5px rgba(0, 0, 0, 0.9));
  /* 确保图标不被裁剪 */
  max-width: none;
  max-height: none;
  width: 100%;
  height: 100%;
}

.icon-fallback {
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 25;
  width: 100%;
  height: 100%;
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
</style>
