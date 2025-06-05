<template>
  <div class="civilization-icon" :style="{ color: iconColor }">
    <img v-if="gifIconSrc" :src="gifIconSrc" :alt="type" class="icon-image" />
    <span v-else class="icon-fallback">{{ fallbackIcon }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import type { SettlementType } from '../types';

// 属性定义
const props = defineProps<{
  type: SettlementType;
}>();

// 使用ref存储GIF图标路径
const gifIconSrc = ref<string | null>(null);

// 在组件挂载时尝试加载GIF图标
onMounted(() => {
  // 根据文明类型设置对应的GIF图标
  try {
    switch (props.type) {
      case 'nomad':
        // 使用相对路径加载图标
        gifIconSrc.value = new URL('/src/assets/icons/civilizations/nomad.gif', import.meta.url).href;
        break;
      case 'agriculture':
        gifIconSrc.value = new URL('/src/assets/icons/civilizations/agriculture.gif', import.meta.url).href;
        break;
      case 'fishing':
        gifIconSrc.value = new URL('/src/assets/icons/civilizations/fishing.gif', import.meta.url).href;
        break;
      case 'farming':
        // 直接使用agriculture.gif作为农耕文明的图标
        gifIconSrc.value = new URL('/src/assets/icons/civilizations/agriculture.gif', import.meta.url).href;
        break;
      default:
        gifIconSrc.value = null;
    }
  } catch (error) {
    console.warn(`加载图标失败: ${props.type}`, error);
    gifIconSrc.value = null;
  }
});

// 回退图标（使用emoji）
const fallbackIcon = computed(() => {
  switch (props.type) {
    case 'nomad':
      return '⛺'; // 游牧图标 - 帐篷
    case 'agriculture':
      return '🏡'; // 农耕图标 - 茶屋
    case 'fishing':
      return '🛶'; // 渔猎图标 - 独木舟
    case 'farming':
      return '🌾'; // 新的农耕文明图标 - 稻穗
    default:
      return '🏠'; // 默认图标
  }
});

// 图标颜色
const iconColor = computed(() => {
  switch (props.type) {
    case 'nomad':
      return 'rgba(139, 69, 19, 0.8)'; // 棕色
    case 'agriculture':
      return 'rgba(210, 180, 60, 0.8)'; // 草黄色
    case 'fishing':
      return 'rgba(30, 90, 150, 0.8)'; // 深蓝色
    case 'farming':
      return 'rgba(76, 175, 80, 0.8)'; // 绿色
    default:
      return 'rgba(0, 0, 0, 0.8)'; // 默认黑色
  }
});
</script>

<style scoped>
.civilization-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  font-size: 1.2em;
}

.icon-image {
  width: 140px;
  height: 140px;
  object-fit: contain;
  /* 确保GIF图标显示在顶层 */
  z-index: 25;
  /* 添加轻微阴影使图标更加突出 */
  filter: drop-shadow(0 0 5px rgba(0, 0, 0, 0.9));
  /* 确保图标不被裁剪 */
  max-width: none;
  max-height: none;
  /* 调整图标位置 */
  position: relative;
  transform: translateY(-10px);
}

.icon-fallback {
  font-size: 1.2em;
}
</style>
