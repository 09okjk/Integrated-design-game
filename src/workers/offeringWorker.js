// 供奉系统的Web Worker
// 用于在后台精确计时，避免浏览器标签休眠影响

let intervalId = null;
let offeringInterval = 120000; // 默认2分钟（120秒）
let heartbeatInterval = null; // 心跳计时器

// 监听主线程消息
self.addEventListener('message', (event) => {
  const { action, interval } = event.data;
  
  switch (action) {
    case 'start':
      // 如果提供了新的间隔时间，则更新
      if (interval) {
        offeringInterval = interval;
      }
      
      // 停止现有计时器（如果有）
      if (intervalId) {
        clearInterval(intervalId);
      }
      
      // 启动新的计时器
      intervalId = setInterval(() => {
        // 向主线程发送更新消息
        self.postMessage({ type: 'offering-tick' });
      }, offeringInterval);
      
      // 立即发送一次消息，确认启动
      self.postMessage({ type: 'worker-started' });
      
      // 启动心跳计时器
      heartbeatInterval = setInterval(() => {
        self.postMessage({ type: 'heartbeat' });
      }, 10000); // 每10秒发送一次心跳
      break;
      
    case 'stop':
      // 停止计时器
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }      
      // 发送停止确认
      self.postMessage({ type: 'worker-stopped' });
      break;
      
    case 'ping':
      // 用于检查Worker是否活跃
      self.postMessage({ type: 'pong' });
      break;
  }
});

// 发送初始化完成消息
self.postMessage({ type: 'worker-initialized' });
