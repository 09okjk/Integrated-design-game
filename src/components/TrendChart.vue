<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';

const props = defineProps<{
  temperatureData: number[];
  humidityData: number[];
  criticalThresholds: {
    drought: number;
    flood: number;
  };
}>();

const chartCanvas = ref<HTMLCanvasElement | null>(null);
const ctx = ref<CanvasRenderingContext2D | null>(null);

// 绘制图表
const drawChart = () => {
  if (!chartCanvas.value || !ctx.value) return;
  
  const canvas = chartCanvas.value;
  const context = ctx.value;
  
  // 清除画布
  context.clearRect(0, 0, canvas.width, canvas.height);
  
  // 获取实际显示尺寸而不是像素尺寸
  const width = canvas.width / (window.devicePixelRatio || 1);
  const height = canvas.height / (window.devicePixelRatio || 1);
  // 增加右侧和底部的padding以确保图表内容不会超出
  const padding = { top: 15, right: 20, bottom: 25, left: 35 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  // 绘制坐标轴
  context.beginPath();
  context.strokeStyle = 'rgba(148, 163, 184, 0.7)'; // 马卡龙淡蓝灰色
  context.lineWidth = 1.5;
  // Y轴
  context.moveTo(padding.left, padding.top);
  context.lineTo(padding.left, height - padding.bottom);
  // X轴
  context.moveTo(padding.left, height - padding.bottom);
  context.lineTo(width - padding.right, height - padding.bottom);
  context.stroke();
  
  // 绘制临界阈值线
  // 干旱临界值
  const droughtY = height - padding.bottom - (chartHeight * props.criticalThresholds.drought / 100);
  context.beginPath();
  context.strokeStyle = 'rgba(251, 191, 36, 0.8)'; // 马卡龙淡黄色
  context.lineWidth = 2;
  context.setLineDash([6, 4]);
  context.moveTo(padding.left, droughtY);
  context.lineTo(width - padding.right, droughtY);
  context.stroke();
  context.setLineDash([]);
  
  // 洪水临界值
  const floodY = height - padding.bottom - (chartHeight * props.criticalThresholds.flood / 100);
  context.beginPath();
  context.strokeStyle = 'rgba(96, 165, 250, 0.8)'; // 马卡龙淡蓝色
  context.lineWidth = 2;
  context.setLineDash([6, 4]);
  context.moveTo(padding.left, floodY);
  context.lineTo(width - padding.right, floodY);
  context.stroke();
  context.setLineDash([]);
  
  // 绘制Y轴刻度
  context.fillStyle = 'rgba(71, 85, 105, 0.9)'; // 马卡龙深蓝灰色
  context.font = '10px "Courier New", monospace';
  context.textAlign = 'right';
  context.textBaseline = 'middle';
  
  for (let i = 0; i <= 100; i += 20) {
    const y = height - padding.bottom - (chartHeight * i / 100);
    context.fillText(i.toString(), padding.left - 5, y);
    
    // 绘制网格线
    context.beginPath();
    context.strokeStyle = 'rgba(226, 232, 240, 0.5)'; // 马卡龙淡灰色
    context.lineWidth = 0.8;
    context.setLineDash([2, 3]);
    context.moveTo(padding.left, y);
    context.lineTo(width - padding.right, y);
    context.stroke();
    context.setLineDash([]);
  }
  
  // 绘制温度曲线
  if (props.temperatureData.length > 1) {
    // 温度曲线渐变效果
    const gradient = context.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(248, 113, 113, 0.9)'); // 马卡龙浅红色
    gradient.addColorStop(1, 'rgba(254, 202, 202, 0.5)'); // 更浅的红色
    
    context.beginPath();
    context.strokeStyle = 'rgba(239, 68, 68, 0.9)'; // 马卡龙红色
    context.lineWidth = 2.5;
    context.lineJoin = 'round';
    
    const stepX = chartWidth / (props.temperatureData.length - 1);
    
    props.temperatureData.forEach((value, index) => {
      const x = padding.left + index * stepX;
      const y = height - padding.bottom - (chartHeight * value / 100);
      
      if (index === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    });
    
    context.stroke();
  }
  
  // 绘制湿度曲线
  if (props.humidityData.length > 1) {
    // 湿度曲线渐变效果
    const gradient = context.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(96, 165, 250, 0.9)'); // 马卡龙浅蓝色
    gradient.addColorStop(1, 'rgba(186, 230, 253, 0.5)'); // 更浅的蓝色
    
    context.beginPath();
    context.strokeStyle = 'rgba(59, 130, 246, 0.9)'; // 马卡龙蓝色
    context.lineWidth = 2.5;
    context.lineJoin = 'round';
    
    const stepX = chartWidth / (props.humidityData.length - 1);
    
    props.humidityData.forEach((value, index) => {
      const x = padding.left + index * stepX;
      const y = height - padding.bottom - (chartHeight * value / 100);
      
      if (index === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    });
    
    context.stroke();
  }
  
  // 绘制图例
  const legendX = width - padding.right - 80;
  const legendY = padding.top + 10;
  
  // 绘制图例背景
  context.fillStyle = 'rgba(226, 232, 240, 0.3)';
  context.fillRect(legendX - 5, legendY - 5, 70, 35);
  context.strokeStyle = 'rgba(148, 163, 184, 0.4)';
  context.strokeRect(legendX - 5, legendY - 5, 70, 35);
  
  // 温度图例
  context.beginPath();
  context.strokeStyle = 'rgba(239, 68, 68, 0.9)';
  context.lineWidth = 2.5;
  context.moveTo(legendX, legendY);
  context.lineTo(legendX + 20, legendY);
  context.stroke();
  
  context.fillStyle = 'rgba(15, 23, 42, 0.8)';
  context.font = '11px "Courier New", monospace';
  context.textAlign = 'left';
  context.fillText('温度', legendX + 25, legendY);
  
  // 湿度图例
  context.beginPath();
  context.strokeStyle = 'rgba(59, 130, 246, 0.9)';
  context.lineWidth = 2.5;
  context.moveTo(legendX, legendY + 15);
  context.lineTo(legendX + 20, legendY + 15);
  context.stroke();
  
  context.fillStyle = 'rgba(15, 23, 42, 0.8)';
  context.textAlign = 'left';
  context.fillText('湿度', legendX + 25, legendY + 15);
};

// 监听属性变化，重新绘制图表
watch(() => [props.temperatureData, props.humidityData], () => {
  drawChart();
}, { deep: true });

// 初始化画布
// 添加窗口大小变化的监听
const handleResize = () => {
  if (chartCanvas.value) {
    const dpr = window.devicePixelRatio || 1;
    const rect = chartCanvas.value.getBoundingClientRect();
    
    chartCanvas.value.width = rect.width * dpr;
    chartCanvas.value.height = rect.height * dpr;
    
    if (ctx.value) {
      ctx.value.scale(dpr, dpr);
      drawChart();
    }
  }
};

onMounted(() => {
  if (chartCanvas.value) {
    ctx.value = chartCanvas.value.getContext('2d');
    
    // 设置canvas宽高以匹配显示尺寸
    handleResize();
    
    // 添加窗口大小变化的监听，确保图表自适应
    window.addEventListener('resize', handleResize);
    
    drawChart();
  }
});
</script>

<template>
  <div class="trend-chart">
    <canvas 
      ref="chartCanvas"
      width="260"
      height="180"
      class="chart-canvas"
    ></canvas>
  </div>
</template>

<style scoped>
.trend-chart {
  width: 100%;
  height: 100%;
  padding: 5px;
  background: linear-gradient(145deg, rgba(241, 245, 249, 0.5), rgba(226, 232, 240, 0.3));
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  box-shadow: 0 2px 5px rgba(15, 23, 42, 0.1);
  display: flex;
  justify-content: center;
  align-items: center;
}

.chart-canvas {
  border-radius: 6px;
  width: 100%;
  height: 100%;
  max-width: 260px;
  max-height: 180px;
}
</style>
