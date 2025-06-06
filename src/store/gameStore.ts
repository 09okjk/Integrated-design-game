import { defineStore } from 'pinia';
import type { Cell, TerrainType, Coordinate, WeatherEffect, Civilization, GlobalTrends, } from '../types';
import soundService from '../services/SoundService';

export const useGameStore = defineStore('game', {
  state: () => ({
    // 地图数据
    map: [] as Cell[][],
    
    // 选中的网格
    selectedCell: null as Cell | null,
    selectedCoordinate: null as Coordinate | null,
    
    // 文明数据
    civilizations: [] as Civilization[],
    nextCivId: 1,
    
    // 全局趋势
    globalTrends: {
      temperature: [50], // 初始温度50%
      humidity: [50], // 初始湿度50%
    } as GlobalTrends,
    
    // 游戏设置
    updateInterval: 5000, // 5秒更新一次
    weatherEffectDuration: 10000, // 天气效果持续10秒
    
    // 游戏状态
    gameStarted: false,
    gamePaused: false,
    gameOver: false,
    gameTime: 0, // 游戏时间（毫秒）
    lastUpdateTime: 0, // 上次更新时间
    gameUpdateInterval: 1000, // 游戏更新间隔（毫秒）
    weatherUpdateCounter: 0, // 天气更新计数器
    civilizationUpdateCounter: 0, // 文明更新计数器
    warningEventCounter: 0, // 警告事件计数器
    farmingCivTimer: 0, // 农耕文明生成计时器
    
    // 游戏更新计时器
    gameTimer: null as number | null,
    
    // 自动创建文明计时器
    autoCivilizationTimer: null as number | null,
    autoCivilizationInterval: 120000, // 2分钟创建一个新文明
    
    // 供奉系统
    offeringPoints: 0, // 当前供奉值
    coins: 50, // 金币数量，初始给玩50个金币
    offeringTimer: null as number | null, // 供奉计时器
    offeringInterval: 60000, // 1分钟更新一次
    lastOfferingTime: 0, // 上次供奉时间
    offeringAnimationQueue: [] as {civId: number, amount: number}[], // 供奉动画队列
    
    // 警告事件系统
    warningEventChance: 0.05, // 每次更新时生成警告事件的概率
    warningEventDuration: 30000, // 警告事件持续时间（30秒）
    
    // 极端环境系统
    extremeEnvironmentDetected: false, // 是否检测到极端环境
    extremeEnvironmentCountdown: null as number | null, // 极端环境倒计时
    extremeEnvironmentCountdownStart: 0, // 极端环境倒计时开始时间
    extremeEnvironmentThreshold: 40, // 极端环境阈值（沙漠地块数量）
    extremeEnvironmentDuration: 60000, // 极端环境持续时间（1分钟）
    showExtremeEnvironmentWarning: false, // 是否显示极端环境警告
    activeWarningEvents: 0, // 当前活跃的警告事件数量
    
    // 村民交流事件系统
    villagerEventActive: false, // 当前是否有村民交流事件
    villagerEventInterval: 60000, // 村民交流事件间隔（60秒）
    villagerEventTimer: null as number | null, // 村民交流事件计时器
    initialCellStates: {} as Record<string, Cell>, // 存储初始单元格状态，用于比较变化
    
    // 结算系统
    isSettling: false, // 是否正在结算中
    showSettlementModal: false, // 是否显示结算弹窗
    settlementResult: {
      outcomeTitle: '', // 结局标题
      outcomeDescription: '', // 结局描述
      outcomeComment: '', // 文明评语
      posterImage: '' // 海报图片的Base64编码
    },
    gameStatistics: {
      turnsPlayed: 0, // 游戏回合数
      extremeEvents: 0, // 极端事件数量
      civilizationsCreated: 0, // 创建的文明数量
      civilizationsLost: 0, // 消失的文明数量
      coinsSpent: 0, // 消费的金币
      weatherChanges: {
        rain: 0, // 降雨次数
        drought: 0, // 干旱次数
        heatwave: 0, // 热浪次数
        coldwave: 0 // 冷浪次数
      }
    },
    mapWidth: 15, // 地图宽度
    mapHeight: 12, // 地图高度

    // 添加记录最后活动时间
    lastAutoCivilizationTime: 0,
    lastWeatherUpdateTime: 0,
  }),
  
  actions: {
    // 初始化地图 - 支持矩形地图(宽x高)
    initializeMap(width: number, height: number = width) {
      console.log('开始初始化地图，大小:', width, 'x', height);
      
      try {
        // 清空数据
        this.map = [];
        
        // 创建地图网格
        for (let y = 0; y < height; y++) {
          const row: Cell[] = [];
          
          for (let x = 0; x < width; x++) {
            // 完全随机生成地形
            let terrain: TerrainType;
            
            // 使用随机数确定地形类型
            const terrainRand = Math.random();
            
            // 调整各地形出现的概率
            if (terrainRand < 0.45) {
              terrain = 'plain'; // 平原 - 45%概率
            } else if (terrainRand < 0.7) {
              terrain = 'hill'; // 丘陵 - 25%概率
            } else if (terrainRand < 0.9) {
              terrain = 'water'; // 水域 - 20%概率
            } else {
              terrain = 'desert'; // 沙漠 - 10%概率
            }
            
            // 确保地图有一定的连续性 - 相邻区域有更高概率是相同地形
            // 这个算法可以在未来优化，目前保持纯随机
            
            // 基础温湿度
            let baseTemperature = 50;
            let baseHumidity = 50;
            
            // 根据地形调整初始温湿度
            switch (terrain) {
              case 'desert':
                baseTemperature = 80;
                baseHumidity = 20;
                break;
              case 'water':
                baseTemperature = 40;
                baseHumidity = 90;
                break;
              case 'hill':
                baseTemperature = 45;
                baseHumidity = 60;
                break;
            }
            
            // 添加随机波动（±5）- 减小随机性以提高可预测性
            const temperature = Math.min(100, Math.max(0, baseTemperature + (Math.random() * 10 - 5)));
            const humidity = Math.min(100, Math.max(0, baseHumidity + (Math.random() * 10 - 5)));
            
            // 创建网格数据
            row.push({
              terrain,
              temperature,
              humidity,
              settlement: null,
              activeWeatherEffects: [],
              lastUpdated: Date.now(),
              wetCount: 0,
              originalTerrain: terrain,
            });
          }
          
          this.map.push(row);
        }
        
        console.log('地图初始化成功:', this.map.length, 'x', this.map[0]?.length);
        
        // 初始化游戏计时器
        this.startGameTimer();
        
        // 初始添加一个游牧部落
        this.createInitialCivilization();
        
      } catch (error) {
        console.error('地图初始化错误:', error);
        
        // 错误处理 - 创建一个单一地形的地图
        this.map = [];
        for (let y = 0; y < height; y++) {
          const row: Cell[] = [];
          for (let x = 0; x < width; x++) {
            row.push({
              terrain: 'plain',
              temperature: 50,
              humidity: 50,
              settlement: null,
              activeWeatherEffects: [],
              lastUpdated: Date.now(),
            });
          }
          this.map.push(row);
        }
        
        console.log('地图备用初始化完成:', this.map.length, 'x', this.map[0]?.length);
      }
    },
    
    // 启动游戏计时器
    startGameTimer() {
      if (this.gameTimer) {
        clearInterval(this.gameTimer);
      }
      
      this.gameTimer = window.setInterval(() => {
        this.updateGame();
      }, this.updateInterval);
      
      // 启动自动创建文明计时器
      this.startAutoCivilizationTimer();
      
      // 启动供奉计时器
      this.startOfferingTimer();
    },
    
    // 游戏更新函数
    updateGame() {
      if (this.gamePaused) return;
      
      // 更新游戏状态
      this.updateGameState();
      
      // 更新游戏统计数据
      this.gameStatistics.turnsPlayed++;
      
      // 定期检查所有计时器的健康状态
      if (this.gameStatistics.turnsPlayed % 10 === 0) { // 每10个回合检查一次
        this.checkTimersHealth();
      }
      
      // 检查供奉计时器是否在运行
      if (!this.offeringTimer) {
        console.log('供奉计时器未启动，重新启动');
        this.startOfferingTimer();
      }
    },
    
    // 开始供奉计时器
    startOfferingTimer() {
      // 如果浏览器支持Web Worker
      if (typeof Worker !== 'undefined') {
        try {
          // 停止现有计时器（如果有）
          this.stopOfferingTimer();
          
          // 创建Web Worker
          const workerUrl = new URL('../workers/offeringWorker.js', import.meta.url);
          const offeringWorker = new Worker(workerUrl, { type: 'module' });
          
          // 添加心跳超时检测
          let heartbeatTimeout = null;  

          // 监听Worker消息
          offeringWorker.onmessage = (event) => {
            const { type } = event.data;
            
            if (type === 'offering-tick') {
              // 收到计时器消息，计算供奉值
              if (!this.gamePaused) {
                this.calculateOfferings();
              }
            }

            if (type === 'heartbeat') {
              // 收到心跳，重置超时
              if (heartbeatTimeout) {
                clearTimeout(heartbeatTimeout);
              }
              
              // 设置新的超时检测
              heartbeatTimeout = setTimeout(() => {
                console.warn('供奉Worker心跳超时，重启Worker');
                this.stopOfferingTimer();
                this.startOfferingTimer();
              }, 30000); // 30秒无心跳则重启
            }
          };
          
          // 保存Worker引用
          this.offeringTimer = offeringWorker;
          
          // 启动Worker计时器
          offeringWorker.postMessage({ 
            action: 'start', 
            interval: this.offeringInterval 
          });
          
          this.lastOfferingTime = Date.now();
          console.log('供奉系统Web Worker已启动');
        } catch (error) {
          console.error('创建Web Worker失败，回退到普通计时器:', error);
          // 回退到普通计时器
          this.startFallbackOfferingTimer();
        }
      } else {
        // 浏览器不支持Web Worker，使用普通计时器
        console.warn('浏览器不支持Web Worker，使用普通计时器');
        this.startFallbackOfferingTimer();
      }
      
    },
    
    // 普通计时器后备方案
    startFallbackOfferingTimer() {
      if (this.offeringTimer !== null) {
        clearInterval(this.offeringTimer);
      }
      
      this.lastOfferingTime = Date.now();
      
      this.offeringTimer = setInterval(() => {
        if (!this.gamePaused) {
          this.calculateOfferings();
        }
      }, this.offeringInterval);
    },
    
    // 停止游戏计时器
    stopGameTimer() {
      if (this.gameTimer !== null) {
        clearInterval(this.gameTimer);
        this.gameTimer = null;
      }
      
      // 同时停止供奉计时器
      this.stopOfferingTimer();
      
      // 停止自动创建文明计时器
      this.stopAutoCivilizationTimer();
    },
    
    // 启动自动创建文明计时器
    startAutoCivilizationTimer() {
      if (this.autoCivilizationTimer) {
        clearInterval(this.autoCivilizationTimer);
      }
      
      this.autoCivilizationTimer = window.setInterval(() => {
        // 如果游戏暂停，不创建新文明
        if (this.gamePaused) return;
        
        // 如果文明数量已达到上限，不创建新文明
        // 检查是否达到文明上限(50个)，如果达到则触发结算
        if (this.civilizations.length >= 50) {
          this.triggerCivilizationLimitSettlement();
          return;
        }
        
        // 尝试创建新文明
        this.tryCreateNewCivilization();
        
        // 触发文明生成特效
        if (this.civilizations.length > 0) {
          const latestCiv = this.civilizations[this.civilizations.length - 1];
          window.dispatchEvent(new CustomEvent('play-civilization-effect', {
            detail: {
              position: latestCiv.position
            }
          }));
        }
      }, this.autoCivilizationInterval);
    },
    
    // 停止自动创建文明计时器
    stopAutoCivilizationTimer() {
      if (this.autoCivilizationTimer) {
        clearInterval(this.autoCivilizationTimer);
        this.autoCivilizationTimer = null;
      }
    },
    
    // 停止供奉计时器
    stopOfferingTimer() {
      if (this.offeringTimer) {
        // 判断是普通计时器还是Web Worker
        if (typeof this.offeringTimer === 'number') {
          // 普通计时器
          clearInterval(this.offeringTimer);
        } else if (this.offeringTimer instanceof Worker) {
          // Web Worker
          this.offeringTimer.postMessage({ action: 'stop' });
          this.offeringTimer.terminate();
        }
        
        this.offeringTimer = null;
      }
    },
    
    // 计算供奉值
    calculateOfferings() {
      if (this.civilizations.length === 0) return;
      
      let totalOfferings = 0;
      this.offeringAnimationQueue = [];
      
      // 遍历所有文明，计算供奉值
      this.civilizations.forEach(civ => {
        // 获取文明所在的网格
        const cell = this.getCellAt(civ.position.x, civ.position.y);
        if (!cell) return;
        
        // 基础供奉值，根据文明类型设置
        let baseOffering = 0;
        let environmentFactor = 1.0;
        let resourceFactor = 1.0;
        
        // 根据文明类型设置基础值
        switch (civ.type) {
          case 'agriculture':
            baseOffering = 50; // 农耕文明基础值高
            
            // 环境加成：湿度和温度达标时额外加成
            if (cell.humidity >= 50 && cell.humidity <= 80) {
              environmentFactor += 0.2; // 湿度适宜加成20%
            }
            if (cell.temperature >= 40 && cell.temperature <= 70) {
              environmentFactor += 0.2; // 温度适宜加成20%
            }
            
            // 资源加成：食物资源充足时加成
            if (civ.resources.food >= 100) {
              resourceFactor += 0.1; // 每100食物加成10%
            }
            break;
            
          case 'nomad':
            baseOffering = 30; // 游牧文明基础值中等
            
            // 环境加成：平原或丘陵地形加成
            if (cell.terrain === 'plain' || cell.terrain === 'hill') {
              environmentFactor += 0.1;
            }
            
            // 资源加成：工具资源充足时加成
            if (civ.resources.tools >= 50) {
              resourceFactor += 0.15; // 工具资源充足时小幅提升
            }
            break;
            
          case 'fishing':
            baseOffering = 40; // 渔牧文明基础值中等
            
            // 环境加成：靠近水域时加成
            if (this.isNearWater(civ.position.x, civ.position.y)) {
              environmentFactor += 0.3; // 靠近水域时获得显著加成
            }
            
            // 资源加成
            if (civ.resources.food >= 80) {
              resourceFactor += 0.1;
            }
            break;
        }
        
        // 计算最终供奉值
        const civOffering = Math.floor(baseOffering * environmentFactor * resourceFactor);
        totalOfferings += civOffering;
        
        // 添加到动画队列
        if (civOffering > 0) {
          this.offeringAnimationQueue.push({
            civId: civ.id,
            amount: civOffering
          });
        }
      });
      
      // 更新供奉值和金币
      this.offeringPoints += totalOfferings;
      
      // 每10点供奉值转化为1枚金币
      const newCoins = Math.floor(this.offeringPoints / 10);
      if (newCoins > 0) {
        this.coins += newCoins;
        this.offeringPoints %= 10; // 保留余数
      }
      
      // 更新上次供奉时间
      this.lastOfferingTime = Date.now();
      
      // 触发供奉事件，通知UI更新
      window.dispatchEvent(new CustomEvent('offering-update', {
        detail: {
          totalOfferings,
          newCoins,
          animationQueue: [...this.offeringAnimationQueue]
        }
      }));
    },
    
    // 游戏状态更新
    updateGameState() {
      // 更新天气效果
      this.updateWeatherEffects();
      
      // 更新地形变化
      this.updateTerrainChanges();
      
      // 更新警告事件
      this.updateWarningEvents();
      
      // 更新文明行为
      this.updateCivilizations();
      
      // 更新全局趋势
      this.updateGlobalTrends();
      
      // 检查游戏结局条件
      this.checkGameOutcomes();
    },
    
    // 更新天气效果
    updateWeatherEffects() {
      const now = Date.now();
      
      // 遍历地图上的每个网格
      for (let y = 0; y < this.map.length; y++) {
        for (let x = 0; x < this.map[y].length; x++) {
          const cell = this.map[y][x];
          
          // 移除过期的天气效果
          if (cell.activeWeatherEffects.length > 0) {
            const effectLifetime = now - cell.lastUpdated;
            
            if (effectLifetime > this.weatherEffectDuration) {
              cell.activeWeatherEffects = [];
            }
          }

          // 检查雨水效果是否卡住（存在超过正常持续时间）
          cell.activeWeatherEffects = cell.activeWeatherEffects.filter(effect => {
            // 如果效果已经存在超过30秒（远超正常持续时间），则移除
            if (now - effect.startTime > 30000) {
              console.log(`清理卡住的${effect.type}效果，位置:(${x},${y})`);
              return false;
            }
            return true;
          });
        }
      }
    },
    
    // 更新地形变化
    updateTerrainChanges() {
      // 遍历地图
      for (let y = 0; y < this.map.length; y++) {
        for (let x = 0; x < this.map[y].length; x++) {
          const cell = this.map[y][x];
          
          // 沙漠化检测
          if (cell.terrain === 'plain' && cell.humidity < 10 && cell.temperature > 80) {
            cell.terrain = 'desert';
          }
          
          // 水域干涸
          if (cell.terrain === 'water' && cell.humidity < 20) {
            cell.terrain = 'plain';
          }
          
          // 平原淹没（极端降雨）
          if (cell.terrain === 'plain' && cell.humidity > 90 && this.isNearWater(x, y)) {
            cell.terrain = 'water';
          }
        }
      }
    },
    
    // 更新警告事件
    updateWarningEvents() {
      const now = Date.now();
      let activeEvents = 0;
      
      // 遗留地图，检查和更新现有警告事件
      for (let y = 0; y < this.map.length; y++) {
        for (let x = 0; x < this.map[y].length; x++) {
          const cell = this.map[y][x];
          
          // 如果单元格有警告事件
          if (cell.warningEvent) {
            // 检查事件是否过期
            const eventLifetime = now - cell.warningEvent.startTime;
            
            if (eventLifetime > cell.warningEvent.duration) {
              // 记录警告事件类型，用于后续处理
              const eventType = cell.warningEvent.type;
              const severity = cell.warningEvent.severity;
              
              // 警告事件结束
              cell.warningEvent = undefined;
              
              // 影响周围四个板块
              this.applyWarningEffectToSurroundings(x, y, eventType, severity);
              
              // 当前板块的地形变化
              this.applyTerrainChange(x, y, eventType, severity);
            } else {
              // 警告事件仍然活跃
              activeEvents++;
              
              // 如果单元格有文明，强制迁徙
              if (cell.settlement) {
                // 找到该单元格对应的文明
                const civ = this.civilizations.find(c => 
                  c.position.x === x && c.position.y === y
                );
                
                if (civ) {
                  // 强制文明迁徙
                  this.forceMigrateCivilization(civ, cell.warningEvent.type);
                }
              }
            }
          }
        }
      }
      
      // 更新活跃事件计数
      this.activeWarningEvents = activeEvents;
      
      // 随机生成新的警告事件，增加生成概率以便于测试
      if (this.activeWarningEvents < 3 && Math.random() < 0.2) { // 将概率从0.05增加到0.2
        this.generateWarningEvent();
      }
    },
    
    // 生成警告事件
    generateWarningEvent() {
      // 事件类型概率分布
      const eventTypes: WarningEventType[] = ['flood', 'drought', 'wildfire', 'blizzard'];
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      
      // 尝试多次找到适合的单元格
      let attempts = 0;
      const maxAttempts = 20;
      
      while (attempts < maxAttempts) {
        attempts++;
        
        // 随机选择一个单元格
        const y = Math.floor(Math.random() * this.map.length);
        const x = Math.floor(Math.random() * this.map[0].length);
        const cell = this.map[y][x];
        
        // 如果单元格已经有警告事件，跳过
        if (cell.warningEvent) continue;
        
        // 检查是否适合生成警告事件
        let canGenerate = false;
        
        switch (eventType) {
          case 'flood':
            // 洪水事件在平原且湿度高的地区生成
            canGenerate = cell.terrain === 'plain' && cell.humidity > 70;
            break;
            
          case 'drought':
            // 干旱事件在平原且湿度低的地区生成
            canGenerate = cell.terrain === 'plain' && cell.humidity < 30;
            break;
            
          case 'wildfire':
            // 野火事件在平原或山地且温度高的地区生成
            canGenerate = (cell.terrain === 'plain' || cell.terrain === 'mountain') && cell.temperature > 70;
            break;
            
          case 'blizzard':
            // 暴风雪事件在温度低的地区生成
            canGenerate = cell.temperature < 30;
            break;
        }
        
        // 优先选择有文明的单元格
        if (cell.settlement) {
          canGenerate = canGenerate && true; // 增加生成概率
        }
        
        // 如果满足条件，生成警告事件
        if (canGenerate) {
          cell.warningEvent = {
            type: eventType,
            startTime: Date.now(),
            duration: this.warningEventDuration,
            severity: Math.floor(Math.random() * 50) + 50
          };
          
          console.log(`在 (${x}, ${y}) 生成了 ${eventType} 警告事件`);
          
          // 更新统计数据
          this.gameStatistics.extremeEvents++;
          
          // 触发警告事件
          window.dispatchEvent(new CustomEvent('warning-event', {
            detail: {
              position: { x, y },
              type: eventType,
              severity: cell.warningEvent.severity
            }
          }));
          
          // 随机显示新手教学
          this.showWarningTutorial(eventType);
          
          // 如果单元格有文明，立即触发迁徙
          if (cell.settlement) {
            // 找到该单元格对应的文明
            const civ = this.civilizations.find(c => 
              c.position.x === x && c.position.y === y
            );
            
            if (civ) {
              this.forceMigrateCivilization(civ, eventType);
            }
          }
          
          console.log(`生成了${eventType}警告事件在位置(${pos.x}, ${pos.y})`);
        }
      }
    },
    
    // 强制文明迁徙
    forceMigrateCivilization(civ: Civilization, eventType: WarningEventType) {
      // 记录当前位置
      const currentPos = { ...civ.position };
      
      // 寻找最适合的新位置
      let bestCell: { x: number, y: number, score: number } | null = null;
      
      // 搜索范围增加到整个地图，确保能找到安全的地方
      for (let y = 0; y < this.map.length; y++) {
        for (let x = 0; x < this.map[0].length; x++) {
          // 跳过当前位置
          if (x === currentPos.x && y === currentPos.y) continue;
          
          const cell = this.map[y][x];
          
          // 跳过水域、已有文明的网格和有警告事件的网格
          if (cell.terrain === 'water' || cell.settlement !== null || cell.warningEvent) {
            continue;
          }
          
          // 计算适宜度分数
          let score = 0;
          
          // 基于文明类型的偏好
          switch (civ.type) {
            case 'agriculture':
              // 农耕文明偏好平原和湿度适中
              if (cell.terrain === 'plain') score += 20;
              if (cell.humidity >= 50 && cell.humidity <= 80) score += 15;
              if (cell.temperature >= 40 && cell.temperature <= 70) score += 10;
              break;
              
            case 'nomad':
              // 游牧文明偏好平原和丘陵
              if (cell.terrain === 'plain') score += 15;
              if (cell.terrain === 'hill') score += 10;
              if (cell.humidity >= 30 && cell.humidity <= 60) score += 10;
              break;
              
            case 'fishing':
              // 渔牧文明偏好靠近水域
              if (this.isNearWater(x, y)) score += 25;
              if (cell.terrain === 'plain') score += 10;
              break;
          }
          
          // 距离惩罚：迁徙距离越远越不适合
          const distance = Math.abs(x - currentPos.x) + Math.abs(y - currentPos.y);
          score -= distance * 2; // 每距离1格减2分
          
          // 选择最佳网格
          if (bestCell === null || score > bestCell.score) {
            bestCell = { x, y, score };
          }
        }
      }
      
      // 如果找到合适的位置，迁徙过去
      if (bestCell) {
        // 清除当前位置的文明标记
        const oldCell = this.getCellAt(currentPos.x, currentPos.y);
        if (oldCell) {
          oldCell.settlement = null;
          
          // 强制触发单元格更新
          this.map[currentPos.y][currentPos.x] = { ...oldCell };
        }
        
        // 添加延迟，使动画更真实
        setTimeout(() => {
          // 更新文明位置
          civ.position = { x: bestCell!.x, y: bestCell!.y };
          
          // 在新位置设置文明标记
          const newCell = this.getCellAt(bestCell!.x, bestCell!.y);
          if (newCell) {
            newCell.settlement = {
              type: civ.type,
              resources: civ.resources,
              population: civ.population
            };
            
            // 强制触发单元格更新
            this.map[bestCell!.y][bestCell!.x] = { ...newCell };
          }
          
          // 触发文明迁徙事件
          window.dispatchEvent(new CustomEvent('civilization-migrated', {
            detail: {
              id: civ.id,
              from: { x: currentPos.x, y: currentPos.y },
              to: { x: bestCell!.x, y: bestCell!.y },
              reason: eventType
            }
          }));
          
          console.log(`文明 ${civ.id} 因为 ${eventType} 事件从 (${currentPos.x}, ${currentPos.y}) 迁徙到 (${bestCell!.x}, ${bestCell!.y})`);
        }, 500); // 添加500毫秒延迟，使动画更真实
      }
    },
    
    // 显示警告事件相关的新手教学
    showWarningTutorial(eventType: WarningEventType) {
      // 随机决定是否显示教学
      // 如果这种类型的教学已经显示过，降低显示概率
      const hasShown = this.tutorialShown.includes(eventType);
      const showChance = hasShown ? 0.1 : 0.8; // 如果没显示过，80%概率显示，否则只有10%
      
      if (Math.random() < showChance) {
        // 设置教学状态
        this.tutorialType = eventType;
        this.showTutorial = true;
        
        // 添加到已显示列表
        if (!hasShown) {
          this.tutorialShown.push(eventType);
        }
        
        console.log(`显示 ${eventType} 相关的新手教学`);
      }
    },
    
    // 关闭新手教学
    closeTutorial() {
      this.showTutorial = false;
      this.tutorialType = null;
    },
    
    // 将文明重新放置到地图上
    placeCivilizationOnMap(civId: number) {
      // 找到指定的文明
      const civ = this.civilizations.find(c => c.id === civId);
      if (!civ) return;
      
      // 寻找适合的地图位置
      let bestCell: { x: number, y: number, score: number } | null = null;
      
      // 搜索整个地图找到适合的位置
      for (let y = 0; y < this.map.length; y++) {
        for (let x = 0; x < this.map[0].length; x++) {
          const cell = this.map[y][x];
          
          // 跳过水域、已有文明的网格和有警告事件的网格
          if (cell.terrain === 'water' || cell.settlement !== null || cell.warningEvent) {
            continue;
          }
          
          // 计算适宜度分数
          let score = 0;
          
          // 基于文明类型的偏好
          switch (civ.type) {
            case 'agriculture':
              // 农耕文明偏好平原和湿度适中
              if (cell.terrain === 'plain') score += 20;
              if (cell.humidity >= 50 && cell.humidity <= 80) score += 15;
              if (cell.temperature >= 40 && cell.temperature <= 70) score += 10;
              break;
              
            case 'nomad':
              // 游牧文明偏好平原和丘陵
              if (cell.terrain === 'plain') score += 15;
              if (cell.terrain === 'hill') score += 10;
              if (cell.humidity >= 30 && cell.humidity <= 60) score += 10;
              break;
              
            case 'fishing':
              // 渔牧文明偏好靠近水域
              if (this.isNearWater(x, y)) score += 25;
              if (cell.terrain === 'plain') score += 10;
              break;
          }
          
          // 添加随机因素，避免总是选择相同的位置
          score += Math.random() * 10;
          
          // 选择最佳网格
          if (bestCell === null || score > bestCell.score) {
            bestCell = { x, y, score };
          }
        }
      }
      
      // 如果找到合适的位置，放置文明
      if (bestCell) {
        // 更新文明位置
        civ.position = { x: bestCell.x, y: bestCell.y };
        
        // 在新位置设置文明标记
        const newCell = this.getCellAt(bestCell.x, bestCell.y);
        if (newCell) {
          newCell.settlement = {
            type: civ.type,
            resources: civ.resources,
            population: civ.population
          };
          
          // 强制触发单元格更新
          this.map[bestCell.y][bestCell.x] = { ...newCell };
        }
        
        // 触发文明放置事件
        window.dispatchEvent(new CustomEvent('civilization-placed', {
          detail: {
            id: civ.id,
            position: { x: bestCell.x, y: bestCell.y },
            type: civ.type
          }
        }));
        
        console.log(`文明 ${civ.id} 被重新放置到 (${bestCell.x}, ${bestCell.y})`);
        return true;
      }
      
      console.log(`无法为文明 ${civ.id} 找到适合的放置位置`);
      return false;
    },
    
    // 应用警告事件对周围板块的影响
    applyWarningEffectToSurroundings(x: number, y: number, eventType: WarningEventType, severity: number) {
      // 周围四个方向（上、下、左、右）
      const directions = [
        { dx: 0, dy: -1 }, // 上
        { dx: 1, dy: 0 },  // 右
        { dx: 0, dy: 1 },  // 下
        { dx: -1, dy: 0 }  // 左
      ];
      
      // 计算影响强度，基于事件的严重程度
      const effectStrength = Math.floor(severity / 10); // 将严重程度转换为影响强度（5-10）
      
      // 应用影响到周围板块
      for (const dir of directions) {
        const nx = x + dir.dx;
        const ny = y + dir.dy;
        
        // 检查越界
        if (nx < 0 || ny < 0 || nx >= this.map[0].length || ny >= this.map.length) {
          continue;
        }
        
        const cell = this.map[ny][nx];
        
        // 根据事件类型应用不同的影响
        switch (eventType) {
          case 'flood':
            // 洪水增加潮湿值
            cell.humidity = Math.min(100, cell.humidity + effectStrength * 5);
            // 添加潮湿天气效果
            if (!cell.activeWeatherEffects.includes('wet')) {
              cell.activeWeatherEffects.push('wet');
              // 设置潮湿计数器
              cell.wetCount = (cell.wetCount || 0) + 1;
            }
            break;
            
          case 'drought':
            // 干旱减少湿度并增加热度
            cell.humidity = Math.max(0, cell.humidity - effectStrength * 5);
            cell.temperature = Math.min(100, cell.temperature + effectStrength * 3);
            // 添加干旱和热效果
            if (!cell.activeWeatherEffects.includes('dry')) {
              cell.activeWeatherEffects.push('dry');
            }
            if (!cell.activeWeatherEffects.includes('hot')) {
              cell.activeWeatherEffects.push('hot');
            }
            break;
            
          case 'wildfire':
            // 野火增加热度并减少湿度
            cell.temperature = Math.min(100, cell.temperature + effectStrength * 5);
            cell.humidity = Math.max(0, cell.humidity - effectStrength * 3);
            // 添加热效果
            if (!cell.activeWeatherEffects.includes('hot')) {
              cell.activeWeatherEffects.push('hot');
            }
            break;
            
          case 'blizzard':
            // 暴风雪降低温度
            cell.temperature = Math.max(0, cell.temperature - effectStrength * 5);
            // 添加冷效果
            if (!cell.activeWeatherEffects.includes('cold')) {
              cell.activeWeatherEffects.push('cold');
            }
            break;
        }
        
        // 触发天气变化事件
        window.dispatchEvent(new CustomEvent('weather-changed', {
          detail: {
            position: { x: nx, y: ny },
            type: eventType,
            effects: cell.activeWeatherEffects
          }
        }));
      }
    },
    
    // 应用地形变化
    applyTerrainChange(x: number, y: number, eventType: WarningEventType, severity: number) {
      const cell = this.map[y][x];
      
      // 变化概率基于严重程度
      const changeChance = severity / 200; // 严重程度50-100对应概率25%-50%
      
      // 随机选择周围一个板块进行地形变化
      if (Math.random() < changeChance) {
        // 当前板块的地形变化
        switch (eventType) {
          case 'flood':
            // 洪水将平原变为水域
            if (cell.terrain === 'plain') {
              cell.terrain = 'water';
              console.log(`洪水将 (${x}, ${y}) 的地形变为水域`);
            }
            break;
            
          case 'drought':
          case 'wildfire':
            // 干旱和野火将平原变为沙漠
            if (cell.terrain === 'plain') {
              cell.terrain = 'desert';
              console.log(`${eventType} 将 (${x}, ${y}) 的地形变为沙漠`);
            }
            break;
            
          case 'blizzard':
            // 暴风雪将水域变为冰原（在游戏中仍然显示为水域，但有特殊效果）
            if (cell.terrain === 'water') {
              // 添加冰冻效果
              if (!cell.activeWeatherEffects.includes('frozen')) {
                cell.activeWeatherEffects.push('frozen');
              }
              console.log(`暴风雪将 (${x}, ${y}) 的水域冰冻`);
            }
            break;
        }
        
        // 随机选择周围一个板块进行地形变化
        this.applyRandomTerrainChangeToSurroundings(x, y, eventType);
      }
    },
    
    // 对周围板块随机选择一个进行地形变化
    applyRandomTerrainChangeToSurroundings(x: number, y: number, eventType: WarningEventType) {
      // 周围四个方向（上、下、左、右）
      const directions = [
        { dx: 0, dy: -1 }, // 上
        { dx: 1, dy: 0 },  // 右
        { dx: 0, dy: 1 },  // 下
        { dx: -1, dy: 0 }  // 左
      ];
      
      // 随机打乱方向数组
      const shuffledDirections = [...directions].sort(() => Math.random() - 0.5);
      
      // 选择第一个有效的方向
      for (const dir of shuffledDirections) {
        const nx = x + dir.dx;
        const ny = y + dir.dy;
        
        // 检查越界
        if (nx < 0 || ny < 0 || nx >= this.map[0].length || ny >= this.map.length) {
          continue;
        }
        
        const cell = this.map[ny][nx];
        
        // 根据事件类型应用地形变化
        switch (eventType) {
          case 'flood':
            // 洪水将平原变为水域
            if (cell.terrain === 'plain') {
              cell.terrain = 'water';
              console.log(`洪水将周围板块 (${nx}, ${ny}) 的地形变为水域`);
              return; // 只变化一个板块
            }
            break;
            
          case 'drought':
          case 'wildfire':
            // 干旱和野火将平原变为沙漠
            if (cell.terrain === 'plain') {
              cell.terrain = 'desert';
              console.log(`${eventType} 将周围板块 (${nx}, ${ny}) 的地形变为沙漠`);
              return; // 只变化一个板块
            }
            break;
            
          case 'blizzard':
            // 暴风雪将水域变为冰原
            if (cell.terrain === 'water') {
              // 添加冰冻效果
              if (!cell.activeWeatherEffects.includes('frozen')) {
                cell.activeWeatherEffects.push('frozen');
              }
              console.log(`暴风雪将周围板块 (${nx}, ${ny}) 的水域冰冻`);
              return; // 只变化一个板块
            }
            break;
        }
      }
    },
    
    // 检查是否靠近水域
    isNearWater(x: number, y: number): boolean {
      // 检查周围8个方向是否有水域
      const directions = [
        { dx: -1, dy: -1 }, { dx: 0, dy: -1 }, { dx: 1, dy: -1 },
        { dx: -1, dy: 0 },                     { dx: 1, dy: 0 },
        { dx: -1, dy: 1 },  { dx: 0, dy: 1 },  { dx: 1, dy: 1 }
      ];
      
      for (const dir of directions) {
        const nx = x + dir.dx;
        const ny = y + dir.dy;
        
        // 检查越界
        if (nx < 0 || ny < 0 || nx >= this.map[0].length || ny >= this.map.length) {
          continue;
        }
        
        if (this.map[ny][nx].terrain === 'water') {
          return true;
        }
      }
      
      return false;
    },
    
    // 检查四周是否都是平原或丘陵
    isSurroundedByPlainOrHill(x: number, y: number): boolean {
      // 检查上下左右四个相邻格子
      const directions = [
        { dx: -1, dy: 0 }, // 左
        { dx: 1, dy: 0 },  // 右
        { dx: 0, dy: -1 }, // 上
        { dx: 0, dy: 1 }   // 下
      ];
      
      // 需要所有相邻格子都是平原或丘陵
      for (const dir of directions) {
        const nx = x + dir.dx;
        const ny = y + dir.dy;
        
        // 检查边界
        if (nx >= 0 && nx < this.map[0].length && ny >= 0 && ny < this.map.length) {
          const neighborCell = this.map[ny][nx];
          if (neighborCell.terrain !== 'plain' && neighborCell.terrain !== 'hill') {
            return false; // 发现一个不是平原或丘陵的格子，返回false
          }
        } else {
          return false; // 边界外的格子不符合条件
        }
      }
      
      return true; // 所有相邻格子都是平原或丘陵
    },
    
    // 尝试创建新的农耕文明
    tryCreateFarmingCivilization() {
      // 选择一个合适的位置
      const suitablePositions: Coordinate[] = [];
      
      // 寻找适合的位置（四周都是平原或丘陵的地方）
      for (let y = 0; y < this.map.length; y++) {
        for (let x = 0; x < this.map[y].length; x++) {
          const cell = this.map[y][x];
          
          // 确保没有文明
          if (cell.settlement !== null) continue;
          
          // 适合农耕文明的条件（四周都是平原或丘陵）
          if ((cell.terrain === 'plain' || cell.terrain === 'hill') && 
              this.isSurroundedByPlainOrHill(x, y) && 
              cell.humidity > 40 && cell.humidity < 80 && 
              cell.temperature > 30 && cell.temperature < 80) {
            suitablePositions.push({ x, y });
          }
        }
      }
      
      // 如果有合适的位置，随机选择一个创建农耕文明
      if (suitablePositions.length > 0) {
        const pos = suitablePositions[Math.floor(Math.random() * suitablePositions.length)];
        const cell = this.getCellAt(pos.x, pos.y);
        
        if (cell) {
          // 创建农耕文明数据
          const newCiv: Civilization = {
            id: this.nextCivId++,
            type: 'farming',
            position: pos,
            resources: {
              food: 30,
              tools: 7
            },
            population: 15
          };
          
          // 添加到文明列表
          this.civilizations.push(newCiv);
          
          // 在地图上标记
          cell.settlement = {
            type: 'farming',
            resources: newCiv.resources,
            population: newCiv.population
          };
          
          // 更新统计数据
          this.gameStatistics.civilizationsCreated++;
          
          return true; // 创建成功
        }
      }
      
      return false; // 没有合适的位置或创建失败
    },
    
    // 更新文明行为
    updateCivilizations() {
      // 更新农耕文明生成计时器
      this.farmingCivTimer += this.gameUpdateInterval;
      
      // 每两分钟尝试生成一个新的农耕文明
      if (this.farmingCivTimer >= 120000) { // 120000毫秒 = 2分钟
        // 尝试创建新的农耕文明
        if (this.civilizations.length < 50) { // 文明数量不超过50个
          const created = this.tryCreateFarmingCivilization();
          if (created) {
            console.log('成功创建了一个新的农耕文明！');
          }
        }
        
        // 重置计时器
        this.farmingCivTimer = 0;
      }
      
      // 基于当前环境条件，可能创建新的文明
      const createCivChance = Math.random();
      // 提高创建文明的几率到15%，最多8个文明
      if (createCivChance < 0.15 && this.civilizations.length < 50) {
        this.tryCreateNewCivilization();
      }
      
      // 首先检查所有文明的有效性
      this.validateCivilizationsDisplay();
      
      // 更新现有文明状态
      this.civilizations.forEach((civ) => {
        // 获取文明所在的网格
        const cell = this.getCellAt(civ.position.x, civ.position.y);
        if (!cell) return;
        
        // 确保地图上有正确的文明标记
        if (cell.settlement === null || cell.settlement.type !== civ.type) {
          cell.settlement = {
            type: civ.type,
            resources: civ.resources,
            population: civ.population
          };
        }
        
        // 基于环境条件增减资源
        if (cell.humidity > 60 && cell.temperature > 40 && cell.temperature < 70) {
          // 良好条件下，增加资源
          civ.resources.food += 5;
        } else if (cell.humidity < 30 || cell.temperature > 80 || cell.temperature < 20) {
          // 恶劣条件下，减少资源
          civ.resources.food = Math.max(0, civ.resources.food - 3);
        }
        
        // 更新地图上的文明资源数据
        if (cell.settlement) {
          cell.settlement.resources = civ.resources;
          cell.settlement.population = civ.population;
        }
        
        // 文明迁徙逻辑
        if (civ.resources.food < 10 && civ.type === 'nomad') {
          this.migrateCivilization(civ);
        }
      });
    },
    
    // 验证文明显示的一致性
    validateCivilizationsDisplay() {
      // 首先清除所有无效的文明标记（地图上有标记但文明列表中没有）
      for (let y = 0; y < this.map.length; y++) {
        for (let x = 0; x < this.map[y].length; x++) {
          const cell = this.map[y][x];
          
          if (cell.settlement !== null) {
            // 检查这个地图位置是否有对应的文明
            const hasCivilization = this.civilizations.some(civ => 
              civ.position.x === x && civ.position.y === y
            );
            
            if (!hasCivilization) {
              // 如果没有对应的文明，清除这个标记
              cell.settlement = null;
            }
          }
        }
      }
      
      // 检查并修复同一坐标有多个文明的问题
      const positionMap = new Map();
      
      // 首先检查每个坐标有多少个文明
      this.civilizations.forEach(civ => {
        const posKey = `${civ.position.x},${civ.position.y}`;
        if (!positionMap.has(posKey)) {
          positionMap.set(posKey, []);
        }
        positionMap.get(posKey).push(civ);
      });
      
      // 处理有多个文明的坐标
      positionMap.forEach((civs, posKey) => {
        if (civs.length > 1) {
          // 保留第一个文明，其他文明需要迁移
          const [keepCiv, ...otherCivs] = civs;
          
          // 将其他文明迁移到新位置
          otherCivs.forEach(civ => {
            // 尝试在周围找一个空位置
            this.findNewPositionForCivilization(civ);
          });
        }
      });
      
      // 然后确保所有文明在地图上都有标记
      this.civilizations.forEach(civ => {
        const cell = this.getCellAt(civ.position.x, civ.position.y);
        if (cell) {
          // 如果这个位置没有文明标记，添加一个
          if (cell.settlement === null) {
            cell.settlement = {
              type: civ.type,
              civId: civ.id,
              established: Date.now()
            };
          } else if (cell.settlement.civId !== civ.id) {
            // 如果这个位置有其他文明的标记，尝试迁移当前文明
            this.findNewPositionForCivilization(civ);
          }
        }
      });
    },
    
    // 为文明找一个新的位置
    findNewPositionForCivilization(civ: Civilization) {
      const currentPos = civ.position;
      const searchRadius = 3; // 搜索半径
      
      // 按距离从近到远搜索周围的网格
      for (let radius = 1; radius <= searchRadius; radius++) {
        // 生成在当前半径上的所有点
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            // 只检查当前半径的边缘点
            if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue;
            
            const nx = currentPos.x + dx;
            const ny = currentPos.y + dy;
            
            // 检查越界
            if (nx < 0 || ny < 0 || nx >= this.map[0].length || ny >= this.map.length) {
              continue;
            }
            
            const cell = this.map[ny][nx];
            
            // 忽略水域和已有文明的网格
            if (cell.terrain === 'water' || cell.settlement !== null) {
              continue;
            }
            
            // 找到了合适的位置
            // 清除原来位置的文明标记
            const oldCell = this.getCellAt(currentPos.x, currentPos.y);
            if (oldCell && oldCell.settlement && oldCell.settlement.civId === civ.id) {
              oldCell.settlement = null;
            }
            
            // 更新文明位置
            civ.position = { x: nx, y: ny };
            
            // 在新位置设置文明标记
            cell.settlement = {
              type: civ.type,
              civId: civ.id,
              established: Date.now()
            };
            
            return true;
          }
        }
      }
      
      return false;
    },
    
    // 文明迁徙
    migrateCivilization(civ: Civilization) {
      // 搜索周围更适宜居住的网格
      const currentPos = civ.position;
      let bestCell: { x: number, y: number, score: number } | null = null;
      
      // 检查周围3x3区域内的网格
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue; // 跳过当前位置
          
          const nx = currentPos.x + dx;
          const ny = currentPos.y + dy;
          
          // 检查越界
          if (nx < 0 || ny < 0 || nx >= this.map[0].length || ny >= this.map.length) {
            continue;
          }
          
          const cell = this.map[ny][nx];
          
          // 忽略水域和已有文明的网格
          if (cell.terrain === 'water' || cell.settlement !== null) {
            continue;
          }
          
          // 计算适宜度分数
          let score = 0;
          
          // 游牧民族偏好平原和丘陵
          if (cell.terrain === 'plain') score += 10;
          if (cell.terrain === 'hill') score += 5;
          
          // 湿度和温度适中
          if (cell.humidity > 40 && cell.humidity < 70) score += 10;
          if (cell.temperature > 40 && cell.temperature < 70) score += 10;
          
          // 选择最佳网格
          if (bestCell === null || score > bestCell.score) {
            bestCell = { x: nx, y: ny, score };
          }
        }
      }
      
      // 如果找到更好的位置，就迁徙过去
      if (bestCell && bestCell.score > 0) {
        // 清除当前位置的文明标记
        const oldCell = this.getCellAt(currentPos.x, currentPos.y);
        if (oldCell) {
          oldCell.settlement = null;
        }
        
        // 更新文明位置
        civ.position = { x: bestCell.x, y: bestCell.y };
        
        // 在新位置设置文明标记
        const newCell = this.getCellAt(bestCell.x, bestCell.y);
        if (newCell) {
          newCell.settlement = {
            type: civ.type,
            resources: civ.resources,
            population: civ.population
          };
        }
      } else {
        // 如果没有找到合适的迁徙位置，确保当前位置有文明标记
        const currentCell = this.getCellAt(currentPos.x, currentPos.y);
        if (currentCell && currentCell.settlement === null) {
          currentCell.settlement = {
            type: civ.type,
            resources: civ.resources,
            population: civ.population
          };
        }
      }
    },
    
    // 尝试创建新的文明
    tryCreateNewCivilization() {
      // 选择一个合适的位置
      const suitablePositions: {pos: Coordinate, type: SettlementType}[] = [];
      
      for (let y = 0; y < this.map.length; y++) {
        for (let x = 0; x < this.map[y].length; x++) {
          const cell = this.map[y][x];
          
          // 确保没有文明
          if (cell.settlement !== null) continue;
          
          // 适合农耕的条件
          if (cell.terrain === 'plain' && cell.humidity > 60 && 
              cell.temperature > 40 && cell.temperature < 70) {
            suitablePositions.push({ pos: { x, y }, type: 'agriculture' });
          }
          
          // 适合渔猎的条件
          if (cell.terrain === 'plain' && this.isNearWater(x, y)) {
            suitablePositions.push({ pos: { x, y }, type: 'fishing' });
          }
          
          // 适合游牧的条件
          if ((cell.terrain === 'plain' || cell.terrain === 'hill') && 
              cell.humidity < 50 && cell.humidity > 20) {
            suitablePositions.push({ pos: { x, y }, type: 'nomad' });
          }
          
          // 适合新的农耕文明的条件（四周都是平原或丘陵）
          if ((cell.terrain === 'plain' || cell.terrain === 'hill') && 
              this.isSurroundedByPlainOrHill(x, y) && 
              cell.humidity > 40 && cell.humidity < 80 && 
              cell.temperature > 30 && cell.temperature < 80) {
            suitablePositions.push({ pos: { x, y }, type: 'farming' });
          }
        }
      }
      
      // 如果有合适的位置，随机选择一个创建文明
      if (suitablePositions.length > 0) {
        const selection = suitablePositions[Math.floor(Math.random() * suitablePositions.length)];
        const pos = selection.pos;
        const type = selection.type;
        const cell = this.getCellAt(pos.x, pos.y);
        
        if (cell) {
          // 根据文明类型设置资源和人口
          let food = 20;
          let tools = 5;
          let population = 10;
          
          // 根据文明类型调整初始资源和人口
          switch(type) {
            case 'agriculture':
              food = 25;
              tools = 4;
              population = 12;
              break;
            case 'fishing':
              food = 22;
              tools = 6;
              population = 10;
              break;
            case 'nomad':
              food = 18;
              tools = 8;
              population = 8;
              break;
            case 'farming':
              food = 30;
              tools = 7;
              population = 15;
              break;
          }
          
          // 创建文明数据
          const newCiv: Civilization = {
            id: this.nextCivId++,
            type,
            position: pos,
            resources: {
              food,
              tools
            },
            population
          };
          
          // 添加到文明列表
          this.civilizations.push(newCiv);
          
          // 在地图上标记
          cell.settlement = {
            type,
            resources: newCiv.resources,
            population: newCiv.population
          };
          
          // 更新统计数据
          this.gameStatistics.civilizationsCreated++;
        }
      }
    },
    
    // 创建初始文明
    createInitialCivilization() {
      // 初始化时创建多个文明，每种类型至少一个
      const initialCivilizations = {
        nomad: 0,
        agriculture: 0,
        fishing: 0,
        farming: 0
      };
      
      // 寻找适合创建文明的区域
      for (let y = 0; y < this.map.length; y++) {
        for (let x = 0; x < this.map[y].length; x++) {
          const cell = this.map[y][x];
          
          // 已经创建了足够的初始文明
          if (initialCivilizations.nomad >= 1 && 
              initialCivilizations.agriculture >= 1 && 
              initialCivilizations.fishing >= 1 &&
              initialCivilizations.farming >= 1) {
            return;
          }
          
          // 检查是否已有文明
          if (cell.settlement !== null) continue;
          
          let civType: SettlementType | null = null;
          
          // 判断适合的文明类型
          if (cell.terrain === 'plain' && initialCivilizations.nomad < 1) {
            civType = 'nomad';
          } else if (cell.terrain === 'plain' && cell.humidity > 60 && initialCivilizations.agriculture < 1) {
            civType = 'agriculture';
          } else if (this.isNearWater(x, y) && initialCivilizations.fishing < 1) {
            civType = 'fishing';
          } else if ((cell.terrain === 'plain' || cell.terrain === 'hill') && 
                     this.isSurroundedByPlainOrHill(x, y) && 
                     initialCivilizations.farming < 1) {
            civType = 'farming';
          }
          
          // 如果这个位置适合创建文明
          if (civType) {
            // 根据文明类型设置资源和人口
            let food = 20;
            let tools = 5;
            let population = 10;
            
            // 根据文明类型调整初始资源和人口
            switch(civType) {
              case 'agriculture':
                food = 25;
                tools = 4;
                population = 12;
                break;
              case 'fishing':
                food = 22;
                tools = 6;
                population = 10;
                break;
              case 'nomad':
                food = 18;
                tools = 8;
                population = 8;
                break;
              case 'farming':
                food = 30;
                tools = 7;
                population = 15;
                break;
            }
            
            // 创建文明
            const newCiv: Civilization = {
              id: this.nextCivId++,
              type: civType,
              position: { x, y },
              resources: {
                food,
                tools
              },
              population
            };
            
            // 添加到文明列表
            this.civilizations.push(newCiv);
            
            // 在地图上标记
            cell.settlement = {
              type: civType,
              resources: newCiv.resources,
              population: newCiv.population
            };
            
            // 更新计数
            initialCivilizations[civType]++;
            
            // 更新统计数据
            this.gameStatistics.civilizationsCreated++;
          }
        }
      }
      
      // 如果没有创建任何文明，尝试创建一个游牧文明作为后备
      if (this.civilizations.length === 0) {
        this.tryCreateNewCivilization();
      }
    },
    
    // 更新全局趋势
    updateGlobalTrends() {
      // 计算当前全局平均温度和湿度
      let totalTemp = 0;
      let totalHumidity = 0;
      let cellCount = 0;
      
      for (let y = 0; y < this.map.length; y++) {
        for (let x = 0; x < this.map[y].length; x++) {
          const cell = this.map[y][x];
          totalTemp += cell.temperature;
          totalHumidity += cell.humidity;
          cellCount++;
        }
      }
      
      // 计算平均值
      const avgTemp = cellCount > 0 ? Math.round(totalTemp / cellCount) : 50;
      const avgHumidity = cellCount > 0 ? Math.round(totalHumidity / cellCount) : 50;
      
      // 添加到趋势数据中
      this.globalTrends.temperature.push(avgTemp);
      this.globalTrends.humidity.push(avgHumidity);
      
      // 保持最近10个记录点
      if (this.globalTrends.temperature.length > 10) {
        this.globalTrends.temperature.shift();
      }
      if (this.globalTrends.humidity.length > 10) {
        this.globalTrends.humidity.shift();
      }
    },
    
    // 检查游戏结局条件
    checkGameOutcomes() {
      // 检查是否有农耕文明建立村落
      const hasAgriculture = this.civilizations.some(civ => civ.type === 'agriculture');
      
      if (hasAgriculture) {
        // 触发结局：文明建立首个村落
        this.triggerGameOutcome({
          title: '文明建立首个村落！',
          description: '在你的环境引导下，第一个农耕文明开始定居形成村落。这是文明发展的重要里程碑！',
          achieved: true
        });
      }
      
      // 检查沙漠化是否严重
      let desertCount = 0;
      let totalCells = 0;
      
      for (let y = 0; y < this.map.length; y++) {
        for (let x = 0; x < this.map[y].length; x++) {
          if (this.map[y][x].terrain === 'desert') {
            desertCount++;
          }
          totalCells++;
        }
      }
      
      const desertPercent = (desertCount / totalCells) * 100;
      
      // 检查是否达到极端环境阈值
      this.checkExtremeEnvironment(desertCount);
      
      if (desertPercent > 50) {
        // 触发结局：世界沙漠化
        this.triggerGameOutcome({
          title: '世界荒漠化危机！',
          description: '气候失衡导致超过一半的区域变成了沙漠。生态系统崩溃，文明面临生存危机！',
          achieved: true
        });
      }
    },
    
    // 检查极端环境条件
    checkExtremeEnvironment(desertCount: number) {
      const now = Date.now();
      
      // 检查沙漠数量是否超过阈值
      if (desertCount >= this.extremeEnvironmentThreshold) {
        // 检查文明数量
        const civilizationCount = this.civilizations.length;
        
        // 如果还没有检测到极端环境，则开始倒计时
        if (!this.extremeEnvironmentDetected) {
          this.extremeEnvironmentDetected = true;
          this.extremeEnvironmentCountdownStart = now;
          this.showExtremeEnvironmentWarning = true;
          
          // 启动倒计时
          this.startExtremeEnvironmentCountdown();
          
          console.log('检测到极端环境，开始倒计时');
        }
      } else {
        // 如果沙漠数量低于阈值，取消倒计时
        if (this.extremeEnvironmentDetected) {
          this.extremeEnvironmentDetected = false;
          this.showExtremeEnvironmentWarning = false;
          
          // 停止倒计时
          this.stopExtremeEnvironmentCountdown();
          
          console.log('极端环境条件已改善，取消倒计时');
        }
      }
      
      // 如果倒计时已经开始，检查是否已经超过持续时间
      if (this.extremeEnvironmentDetected && this.extremeEnvironmentCountdownStart > 0) {
        const elapsedTime = now - this.extremeEnvironmentCountdownStart;
        
        if (elapsedTime >= this.extremeEnvironmentDuration) {
          // 触发极端环境结算
          this.triggerExtremeEnvironmentSettlement();
        }
      }
    },
    
    // 启动极端环境倒计时
    startExtremeEnvironmentCountdown() {
      // 清除现有的倒计时
      this.stopExtremeEnvironmentCountdown();
      
      // 启动新的倒计时，每秒检查一次
      this.extremeEnvironmentCountdown = window.setInterval(() => {
        const now = Date.now();
        const elapsedTime = now - this.extremeEnvironmentCountdownStart;
        const remainingTime = Math.max(0, this.extremeEnvironmentDuration - elapsedTime);
        
        // 如果倒计时结束，触发极端环境结算
        if (remainingTime <= 0) {
          this.triggerExtremeEnvironmentSettlement();
        }
      }, 1000);
    },
    
    // 停止极端环境倒计时
    stopExtremeEnvironmentCountdown() {
      if (this.extremeEnvironmentCountdown !== null) {
        clearInterval(this.extremeEnvironmentCountdown);
        this.extremeEnvironmentCountdown = null;
        this.extremeEnvironmentCountdownStart = 0;
      }
    },
    
    // 触发极端环境结算
    triggerExtremeEnvironmentSettlement() {
      // 停止倒计时
      this.stopExtremeEnvironmentCountdown();
      
      // 隐藏极端环境警告组件
      this.extremeEnvironmentDetected = false;
      this.showExtremeEnvironmentWarning = false;
      
      // 清除文明
      this.civilizations = [];
      
      // 随机生成一些新的随机地块
      this.generateRandomTerrainBlocks();
      
      // 触发游戏结算
      this.startSettlement('extreme');
    },
    
    // 生成随机地形块
    generateRandomTerrainBlocks() {
      const terrainTypes: TerrainType[] = ['desert', 'water', 'plain', 'hill'];
      const blockCount = Math.floor(Math.random() * 5) + 3; // 生成 3-7 个随机地形块
      
      for (let i = 0; i < blockCount; i++) {
        const x = Math.floor(Math.random() * this.map[0].length);
        const y = Math.floor(Math.random() * this.map.length);
        const terrainType = terrainTypes[Math.floor(Math.random() * terrainTypes.length)];
        
        // 设置随机地形
        if (this.map[y] && this.map[y][x]) {
          this.map[y][x].terrain = terrainType;
        }
      }
    },
    
    // 触发游戏结局
    triggerGameOutcome(outcome: { title: string; description: string; achieved: boolean }) {
      console.log('Game Outcome:', outcome);
      
      // 这里可以实现显示结局弹窗的逻辑
      // 为了简化，暂时只打印到控制台
      
      // 暂停游戏
      this.gamePaused = true;
      this.stopGameTimer();
    },
    
    // 应用天气效果
    applyWeather(x: number, y: number, effect: WeatherEffect) {
      // 判断是否有足够的金币
      const weatherCost = 3; // 天气操作消耗金币
      if (this.coins < weatherCost) {
        console.log('金币不足，无法应用天气效果');
        return;
      }
      
      // 消耗金币
      this.coins -= weatherCost;
      this.gameStatistics.coinsSpent += weatherCost;
      
      const cell = this.getCellAt(x, y);
      if (!cell) return;
      
      // 将效果添加到激活效果列表
      if (!cell.activeWeatherEffects.includes(effect)) {
        cell.activeWeatherEffects.push(effect);
        
        // 更新统计数据
        switch (effect) {
          case 'wet':
            this.gameStatistics.weatherChanges.rain++;
            // 播放下雨音效，持续5秒
            soundService.playRainSound(5000);
            break;
          case 'dry':
            this.gameStatistics.weatherChanges.drought++;
            break;
          case 'hot':
            this.gameStatistics.weatherChanges.heatwave++;
            break;
          case 'cold':
            this.gameStatistics.weatherChanges.coldwave++;
            break;
        }
      }
      
      // 更新时间戳
      cell.lastUpdated = Date.now();
      
      // 根据不同效果修改环境参数
      switch (effect) {
        case 'hot':
          cell.temperature = Math.min(100, cell.temperature + 15);
          break;
        case 'cold':
          cell.temperature = Math.max(0, cell.temperature - 15);
          break;
        case 'dry':
          cell.humidity = Math.max(0, cell.humidity - 15);
          // 如果是平原地形且原始地形是沙漠，则重置潮湿计数
          if (cell.terrain === 'plain' && cell.originalTerrain === 'desert') {
            cell.wetCount = 0;
          }
          break;
        case 'wet':
          cell.humidity = Math.min(100, cell.humidity + 15);
          
          // 如果是沙漠地形，则追踪潮湿次数
          if (cell.terrain === 'desert') {
            // 初始化潮湿计数和原始地形
            if (cell.wetCount === undefined) {
              cell.wetCount = 0;
              cell.originalTerrain = 'desert';
            }
            
            // 增加潮湿计数
            cell.wetCount++;
            
            // 如果达到五次潮湿，则有 50% 概率转换为平原
            if (cell.wetCount >= 5) {
              const convertToPlainsChance = Math.random();
              if (convertToPlainsChance < 0.5) {
                // 转换为平原
                cell.terrain = 'plain';
                // 调整湿度以匹配平原
                cell.humidity = Math.max(cell.humidity, 50);
              } else {
                // 重置潮湿计数
                cell.wetCount = 0;
              }
            }
          }
          break;
      }
      
      // 应用天气扩散效果到相邻地块
      this.applyWeatherDiffusion(x, y, effect);
    },
    
    // 应用天气扩散效果
    applyWeatherDiffusion(x: number, y: number, effect: WeatherEffect) {
      // 定义相邻地块的方向（上、下、左、右）
      const directions = [
        { dx: 0, dy: -1 }, // 上
        { dx: 0, dy: 1 },  // 下
        { dx: -1, dy: 0 }, // 左
        { dx: 1, dy: 0 }   // 右
      ];
      
      // 遍历四个相邻地块
      for (const dir of directions) {
        const nx = x + dir.dx;
        const ny = y + dir.dy;
        
        // 检查坐标是否有效
        const neighborCell = this.getCellAt(nx, ny);
        if (!neighborCell) continue;
        
        // 将效果添加到激活效果列表
        if (!neighborCell.activeWeatherEffects.includes(effect)) {
          neighborCell.activeWeatherEffects.push(effect);
        }
        
        // 更新时间戳
        neighborCell.lastUpdated = Date.now();
        
        // 计算扩散效果的强度系数（默认为0.5）
        let diffusionFactor = 0.5;
        
        // 根据地形调整扩散系数
        switch (neighborCell.terrain) {
          case 'water':
            // 水域：湿度扩散+20%，温度扩散-30%
            if (effect === 'wet' || effect === 'dry') {
              diffusionFactor += 0.2;
            } else if (effect === 'hot' || effect === 'cold') {
              diffusionFactor -= 0.3;
            }
            break;
          case 'desert':
            // 沙漠：干旱扩散+30%，湿度扩散-40%
            if (effect === 'dry') {
              diffusionFactor += 0.3;
            } else if (effect === 'wet') {
              diffusionFactor -= 0.4;
            }
            break;
          case 'hill':
            // 丘陵：所有扩散效果-20%
            diffusionFactor -= 0.2;
            break;
        }
        
        // 确保扩散系数在有效范围内
        diffusionFactor = Math.max(0.1, Math.min(0.9, diffusionFactor));
        
        // 根据不同效果修改环境参数（强度减半）
        let effectValue = 0;
        
        switch (effect) {
          case 'hot':
            // 温度增加（原本+15，扩散后约+7.5）
            const hotEffect = 15 * diffusionFactor;
            effectValue = hotEffect;
            neighborCell.temperature = Math.min(100, neighborCell.temperature + hotEffect);
            break;
          case 'cold':
            // 温度降低（原本-15，扩散后约-7.5）
            const coldEffect = 15 * diffusionFactor;
            effectValue = coldEffect;
            neighborCell.temperature = Math.max(0, neighborCell.temperature - coldEffect);
            break;
          case 'dry':
            // 湿度降低（原本-15，扩散后约-7.5）
            const dryEffect = 15 * diffusionFactor;
            effectValue = dryEffect;
            neighborCell.humidity = Math.max(0, neighborCell.humidity - dryEffect);
            break;
          case 'wet':
            // 湿度增加（原本+15，扩散后约+7.5）
            const wetEffect = 15 * diffusionFactor;
            effectValue = wetEffect;
            neighborCell.humidity = Math.min(100, neighborCell.humidity + wetEffect);
            
            // 如果是沙漠地形，则追踪潮湿次数（扩散效果也计入）
            if (neighborCell.terrain === 'desert') {
              // 初始化潮湿计数和原始地形
              if (neighborCell.wetCount === undefined) {
                neighborCell.wetCount = 0;
                neighborCell.originalTerrain = 'desert';
              }
              
              // 增加潮湿计数（扩散效果只计半次）
              neighborCell.wetCount += 0.5;
              
              // 如果达到五次潮湿，则有 50% 概率转换为平原
              if (neighborCell.wetCount >= 5) {
                const convertToPlainsChance = Math.random();
                if (convertToPlainsChance < 0.5) {
                  // 转换为平原
                  neighborCell.terrain = 'plain';
                  // 调整湿度以匹配平原
                  neighborCell.humidity = Math.max(neighborCell.humidity, 50);
                } else {
                  // 重置潮湿计数
                  neighborCell.wetCount = 0;
                }
              }
            }
            break;
        }
        
        // 发送天气扩散事件，通知UI显示扩散效果
        window.dispatchEvent(new CustomEvent('weather-diffusion', {
          detail: {
            sourceX: x,
            sourceY: y,
            targetX: nx,
            targetY: ny,
            effect,
            value: effectValue
          }
        }));
        
        // 添加扩散动画效果
        window.dispatchEvent(new CustomEvent('weather-diffusion-animation', {
          detail: {
            sourceX: x,
            sourceY: y,
            targetX: nx,
            targetY: ny,
            effect
          }
        }));
        
        // 检查文明是否需要迁徙（当扩散影响超过阈值时）
        this.checkCivilizationMigrationDueToWeather(nx, ny, effect);
      }
    },
    
    // 检查文明是否需要因天气扩散而迁徙
    checkCivilizationMigrationDueToWeather(x: number, y: number, effect: WeatherEffect) {
      const cell = this.getCellAt(x, y);
      if (!cell || !cell.settlement) return;
      
      // 检查是否有文明在该地块
      const civ = this.civilizations.find(c => 
        c.position.x === x && c.position.y === y && !c.migrating
      );
      
      if (!civ) return;
      
      // 定义迁徙阈值
      let migrationThreshold = false;
      
      // 根据文明类型和天气效果判断是否需要迁徙
      switch (civ.type) {
        case 'agriculture':
          // 农耕文明对干旱和炎热比较敏感
          if ((effect === 'dry' && cell.humidity < 30) || 
              (effect === 'hot' && cell.temperature > 80)) {
            migrationThreshold = true;
          }
          break;
        case 'nomad':
          // 游牧文明对极端温度比较敏感
          if ((effect === 'hot' && cell.temperature > 85) || 
              (effect === 'cold' && cell.temperature < 15)) {
            migrationThreshold = true;
          }
          break;
        case 'fishing':
          // 渔牧文明对干旱和寒冷比较敏感
          if ((effect === 'dry' && cell.humidity < 40) || 
              (effect === 'cold' && cell.temperature < 20)) {
            migrationThreshold = true;
          }
          break;
      }
      
      // 如果超过阈值，强制文明迁徙
      if (migrationThreshold) {
        // 触发迁徙
        this.forceMigrateCivilization(civ, effect as any);
        
        // 显示迁徙提示
        console.log(`[部落]因[${effect}]扩散被迫迁移`);
        
        // 可以在这里添加一个事件通知UI显示迁徙提示
        window.dispatchEvent(new CustomEvent('civilization-migration', {
          detail: {
            civId: civ.id,
            civType: civ.type,
            cause: effect,
            position: { x, y }
          }
        }));
      }
    },
    
    // 获取指定坐标的网格
    getCellAt(x: number, y: number): Cell | null {
      if (y >= 0 && y < this.map.length && x >= 0 && x < this.map[y].length) {
        return this.map[y][x];
      }
      return null;
    },
    
    // 选择网格
    selectCell(x: number, y: number) {
      this.selectedCell = this.getCellAt(x, y);
      this.selectedCoordinate = { x, y };
    },
    
    // 初始化村民交流事件系统
    initializeVillagerEventSystem() {
      // 初始化金币数量
      if (this.coins === 0) {
        this.coins = 50; // 初始给玩50金币
      }
    },
    
    // 保存初始单元格状态，用于比较变化
    saveInitialCellState(x: number, y: number) {
      const cell = this.getCellAt(x, y);
      if (cell) {
        // 使用坐标作为键值
        const key = `${x},${y}`;
        this.initialCellStates[key] = { ...cell };
      }
    },
    
    // 获取初始单元格状态
    getInitialCellState(x: number, y: number): Cell | null {
      const key = `${x},${y}`;
      return this.initialCellStates[key] || null;
    },
    
    // 消费金币
    spendCoins(amount: number): boolean {
      if (this.coins >= amount) {
        this.coins -= amount;
        return true;
      }
      return false;
    },
    
    // 增加金币
    addCoins(amount: number) {
      this.coins += amount;
    },
    
    // 创建指定类型的文明
    createCivilizationOfType(position: { x: number, y: number }, type: string) {
      // 检查位置是否有效
      const cell = this.getCellAt(position.x, position.y);
      if (!cell) return false;
      
      // 检查该位置是否已有文明
      if (cell.settlement !== null) return false;
      
      // 检查文明数量是否达到上限
      if (this.civilizations.length >= 50) {
        // 如果达到上限，随机选择一个文明增加资源
        const randomCivIndex = Math.floor(Math.random() * this.civilizations.length);
        const randomCiv = this.civilizations[randomCivIndex];
        randomCiv.resources.food += 100;
        return true;
      }
      
      // 创建新文明
      const newCivilization: Civilization = {
        id: this.nextCivId++,
        type: type as 'nomad' | 'agriculture' | 'fishing',
        resources: {
          food: 100,
          tools: 50
        },
        position: { ...position },
        population: 10 + Math.floor(Math.random() * 20), // 10-30的初始人口
        migrating: false,
        migrationTarget: null,
        migrationProgress: 0,
        migrationSpeed: 0,
        lastResourceUpdate: Date.now()
      };
      
      // 添加到文明列表
      this.civilizations.push(newCivilization);
      
      // 更新单元格的定居点状态
      cell.settlement = {
        type: newCivilization.type,
        civId: newCivilization.id,
        established: Date.now()
      };
      
      // 更新统计数据
      this.gameStatistics.civilizationsCreated++;
      
      return true;
    },
    
    // 开始结算游戏
    startSettlement(settlementType: string = 'normal') {
      // 设置结算状态
      this.isSettling = true;
      
      // 暂停游戏
      this.gamePaused = true;
      
      // 收集游戏数据
      const gameData = this.collectGameData();
      
      // 添加结算类型
      gameData.settlementType = settlementType;
      
      // 生成结局文本
      this.generateOutcomeText(gameData);
      
      // 生成结算海报
      this.generateSettlementPoster(gameData);
      
      // 显示结算弹窗
      this.showSettlementModal = true;
      this.isSettling = false;
    },
    
    // 收集游戏数据
    collectGameData() {
      // 地形分布统计
      const terrainStats = {
        plain: 0,
        desert: 0,
        water: 0,
        hill: 0
      };
      
      // 环境参数统计
      let totalTemperature = 0;
      let totalHumidity = 0;
      let extremeConditionCells = 0;
      
      // 遍历地图计算统计数据
      for (let y = 0; y < this.map.length; y++) {
        for (let x = 0; x < this.map[y].length; x++) {
          const cell = this.map[y][x];
          
          // 地形统计
          terrainStats[cell.terrain]++;
          
          // 环境参数统计
          totalTemperature += cell.temperature;
          totalHumidity += cell.humidity;
          
          // 极端条件统计
          if (cell.temperature > 80 || cell.temperature < 20 || 
              cell.humidity > 80 || cell.humidity < 20) {
            extremeConditionCells++;
          }
        }
      }
      
      // 计算总网格数
      const totalCells = this.map.length * this.map[0].length;
      
      // 计算平均值
      const avgTemperature = totalTemperature / totalCells;
      const avgHumidity = totalHumidity / totalCells;
      
      // 文明统计
      const civilizationStats = {
        total: this.civilizations.length,
        byType: {
          nomad: 0,
          agriculture: 0,
          fishing: 0
        },
        totalPopulation: 0,
        totalFood: 0,
        totalTools: 0,
        averagePopulation: 0
      };
      
      // 计算文明统计数据
      this.civilizations.forEach(civ => {
        civilizationStats.byType[civ.type]++;
        civilizationStats.totalPopulation += civ.population;
        civilizationStats.totalFood += civ.resources.food;
        civilizationStats.totalTools += civ.resources.tools;
      });
      
      if (civilizationStats.total > 0) {
        civilizationStats.averagePopulation = 
          civilizationStats.totalPopulation / civilizationStats.total;
      }
      
      // 计算地形比例
      const terrainRatio = {
        plain: (terrainStats.plain / totalCells) * 100,
        desert: (terrainStats.desert / totalCells) * 100,
        water: (terrainStats.water / totalCells) * 100,
        hill: (terrainStats.hill / totalCells) * 100
      };
      
      // 计算环境分数
      const environmentScore = Math.round(
        (50 + // 基础分
        (avgTemperature >= 40 && avgTemperature <= 60 ? 20 : 0) + // 温度适中
        (avgHumidity >= 40 && avgHumidity <= 60 ? 20 : 0) - // 湿度适中
        (extremeConditionCells / totalCells * 50)) // 极端条件惩罚
      );
      
      // 返回收集的游戏数据
      return {
        terrainStats,
        terrainRatio,
        environmentParams: {
          avgTemperature,
          avgHumidity,
          extremeConditionCells,
          extremeConditionRatio: (extremeConditionCells / totalCells) * 100
        },
        civilizationStats,
        gameStatistics: this.gameStatistics,
        environmentScore
      };
    },
    
    // 生成结局文本
    generateOutcomeText(gameData: any) {
      // 根据游戏数据生成结局标题
      let outcomeTitle = '';
      let outcomeDescription = '';
      let outcomeComment = '';
      
      // 基于环境分数和地形分布决定结局类型
      const { environmentScore, terrainRatio, civilizationStats, settlementType } = gameData;
      
      // 检查是否是极端环境结算
      if (settlementType === 'extreme') {
        // 极端环境结局标题
        const extremeTitles = [
          '沙漠之神的愤怒',
          '天空之殇',
          '荒芜世界的终结',
          '气候灾难的深渊',
          '危机之神的宣判'
        ];
        outcomeTitle = extremeTitles[Math.floor(Math.random() * extremeTitles.length)];
        
        // 极端环境结局描述
        const extremeDescriptions = [
          '您创造的极端环境最终将世界推向了毁灭的边缘。大片的沙漠吸干了最后的水源，文明在极端干旱中渐渐消失。',
          '当沙漠覆盖了大部分土地，生态系统达到了崩溃的不可逆转点。您目睛了最后一个文明的灭亡，如同沙漠中的幻影。',
          '您的天气操纵导致了全球气候系统的崩溃。当沙漠覆盖了大部分地图，生命的最后一丝希望也被无情的热浪吞噬。',
          '极端的气候变化导致了一个没有生命的世界。您的天气操控创造了一个广衰的沙漠星球，文明的痕迹被永远埋藏在深深的黄沙之下。'
        ];
        outcomeDescription = extremeDescriptions[Math.floor(Math.random() * extremeDescriptions.length)];
        
        // 极端环境结局评语
        const extremeComments = [
          '作为气候之神，您见证了自己力量的极限——不仅能创造生命，也能将其完全摧毁。也许下一次，您可以尝试与自然和谐相处，而非与之对抗。',
          '您的实验创造了一个没有生命的世界。在这个沙漠星球上，只有风吹过沙丘的微弱回声。这是对所有气候操控者的警示——力量必须远见地使用。',
          '当最后一个文明消失在沙海中，您的心中只剩下深深的遗憾。也许在下一个世界中，您会记得生态平衡的重要性。',
          '极端环境的毁灭性力量超出了您的想象。当沙漠占据了大部分土地，即使是最顶尖的文明也无法适应。这是关于生态系统脉弱性的深刻教训。'
        ];
        outcomeComment = extremeComments[Math.floor(Math.random() * extremeComments.length)];
        
        // 直接返回，不继续处理其他结局类型
        this.settlementResult.outcomeTitle = outcomeTitle;
        this.settlementResult.outcomeDescription = outcomeDescription;
        this.settlementResult.outcomeComment = outcomeComment;
        return;
      }
      
      // 正常结局处理
      // 生成结局标题
      if (environmentScore >= 80) {
        // 生态平衡结局
        const balancedTitles = [
          '自然与文明的交响曲',
          '和谐之地',
          '生命之源的守护者',
          '平衡之道'
        ];
        outcomeTitle = balancedTitles[Math.floor(Math.random() * balancedTitles.length)];
      } else if (environmentScore >= 60) {
        // 繁荣结局
        const prosperousTitles = [
          '绿洲城邦',
          '丰收之地',
          '文明的摇篮',
          '新生之地'
        ];
        outcomeTitle = prosperousTitles[Math.floor(Math.random() * prosperousTitles.length)];
      } else if (environmentScore >= 40) {
        // 挑战结局
        const challengingTitles = [
          '绿洲与沙海的博弈',
          '生存的边缘',
          '阴晴不定的天空',
          '危境中的希望'
        ];
        outcomeTitle = challengingTitles[Math.floor(Math.random() * challengingTitles.length)];
      } else if (environmentScore >= 20) {
        // 困难结局
        const harshTitles = [
          '艰难的征程',
          '危机四伏',
          '生存的挑战',
          '艰难时代'
        ];
        outcomeTitle = harshTitles[Math.floor(Math.random() * harshTitles.length)];
      } else {
        // 灾难结局
        const disasterTitles = [
          '黄沙埋葡的沉默史诗',
          '末日之地',
          '自然的反抗',
          '荒芜大地'
        ];
        outcomeTitle = disasterTitles[Math.floor(Math.random() * disasterTitles.length)];
      }
      
      // 生成结局描述
      // 根据地形分布生成描述
      const dominantTerrain = Object.entries(terrainRatio).reduce((a, b) => a[1] > b[1] ? a : b)[0];
      
      if (dominantTerrain === 'plain' && terrainRatio.plain > 50) {
        if (environmentScore >= 60) {
          outcomeDescription = `在您的引导下，这片广袖的平原成为了生命的摇篮。节制的降雨和温和的气候为农耕文明创造了理想的条件，他们的收获丰确。`;
        } else if (environmentScore >= 40) {
          outcomeDescription = `平原占据了大部分土地，但温湿度的波动使农作物产量不稳定。文明在适应这种变化方面展现出了韧性。`;
        } else {
          outcomeDescription = `虾裂的土地和干枯的河流说明了这片平原的困境。尽管您尝试改变气候，但干旱似乎已经不可逆转。`;
        }
      } else if (dominantTerrain === 'desert' && terrainRatio.desert > 50) {
        if (environmentScore >= 60) {
          outcomeDescription = `您已经成功地在这片沙漠中创造了绿洲。渴望生存的游牧部落在您的帮助下找到了宝贵的水源，并在危险的环境中繁荣发展。`;
        } else if (environmentScore >= 40) {
          outcomeDescription = `沙漠占据了大部分土地，生存在这里是一场挑战。仅存的绿洲为文明提供了避难所，但沙漠的扩张仍然是一个威胁。`;
        } else {
          outcomeDescription = `无情的沙海吞噬了一切。您的尝试未能阻止沙漠化的迅速蔓延，文明的痕迹被黄沙深深埋葬。`;
        }
      } else if (dominantTerrain === 'water' && terrainRatio.water > 50) {
        if (environmentScore >= 60) {
          outcomeDescription = `充沛的水域为渔猎文明提供了丰富的资源。在您的引导下，他们建造了先进的船只和渔具，开启了水上文明的新纪元。`;
        } else if (environmentScore >= 40) {
          outcomeDescription = `广阔的水域既是神赐也是挑战。渔猎部落在浪潮与风暴中挑战生存，但他们的韧性令人钩服。`;
        } else {
          outcomeDescription = `水位不断上升，浮冰与风暴肃虾着水域。尽管您尝试平衡气候，但海洋似乎已经决定吞噬这片土地。`;
        }
      } else if (dominantTerrain === 'hill' && terrainRatio.hill > 40) {
        if (environmentScore >= 60) {
          outcomeDescription = `起伏的丘陵为游牧文明提供了安全的避难所。在您的引导下，他们学会了利用地形优势进行政治和防御，建立了繁荣的山地文明。`;
        } else if (environmentScore >= 40) {
          outcomeDescription = `嵌在丘陵之间的部落艰难求生，但他们的韧性令人钩服。您的引导帮助他们在这片嵌崖之地开辟了生存的空间。`;
        } else {
          outcomeDescription = `险峰嵌崖的地形与恶劣的气候让这里几乎不适合人类生存。尽管您尝试改善条件，但大自然的力量过于强大。`;
        }
      } else {
        // 平衡的地形分布
        if (environmentScore >= 60) {
          outcomeDescription = `在您的引导下，这片土地实现了完美的生态平衡。平原、水域和丘陵的和谐分布为不同类型的文明提供了理想的生存环境。`;
        } else if (environmentScore >= 40) {
          outcomeDescription = `地形的多样性为文明提供了不同的生存选择，但环境的波动仍然带来了挑战。在您的引导下，文明学会了适应这种变化。`;
        } else {
          outcomeDescription = `尽管地形多样，但极端的气候条件使得生存变得异常困难。您的干预只能缓解而非逆转这一趋势。`;
        }
      }
      
      // 生成文明评语
      if (civilizationStats.total === 0) {
        outcomeComment = `这片土地上没有文明生存。或许下一次，您可以尝试创造更适合生存的环境。`;
      } else if (civilizationStats.total === 1) {
        const civType = Object.entries(civilizationStats.byType).find(([_, count]) => count > 0)?.[0];
        if (civType === 'nomad') {
          outcomeComment = `一个孤独的游牧部落在这片土地上顶着自然的考验。他们的韧性令人钩服，但未来仍充满不确定性。`;
        } else if (civType === 'agriculture') {
          outcomeComment = `一个农耕部落在这片土地上艰难地生存着。他们的农作物提供了基本的生存资源，但缺乏多样性使他们易受环境变化的影响。`;
        } else {
          outcomeComment = `一个渔猎部落在水边安家落户。他们的渔获提供了丰富的营养，但单一的生存方式使他们面临着不确定的未来。`;
        }
      } else if (civilizationStats.total >= 2 && civilizationStats.total <= 4) {
        if (environmentScore >= 60) {
          outcomeComment = `${civilizationStats.total}个部落在这片土地上和平共处，共享资源。他们的交流与合作创造了文化的繁荣，每个部落都为这个小世界贡献着自己的独特专长。`;
        } else {
          outcomeComment = `${civilizationStats.total}个部落在这片充满挑战的土地上挑战生存。他们在资源稀缺的情况下学会了合作，但他们的未来仍然充满不确定性。`;
        }
      } else {
        if (environmentScore >= 60) {
          outcomeComment = `这片土地上繁荣着${civilizationStats.total}个多元文明，形成了一个复杂而繁荣的社会网络。他们的交流与合作创造了文化的黄金时代，每个文明都为这个世界贡献着独特的智慧。`;
        } else {
          outcomeComment = `尽管环境条件严峻，但${civilizationStats.total}个文明仍然在这片土地上顶着艰难生存。他们的韧性令人钩服，但每一天都是与自然的斗争。`;
        }
      }
      
      // 更新结算结果
      this.settlementResult.outcomeTitle = outcomeTitle;
      this.settlementResult.outcomeDescription = outcomeDescription;
      this.settlementResult.outcomeComment = outcomeComment;
    },
    
    // 生成结算海报
    generateSettlementPoster(gameData: any) {
      // 创建一个画布来生成像素风格的海报
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // 设置画布大小
      const width = 600;
      const height = 450;
      canvas.width = width;
      canvas.height = height;
      
      if (!ctx) return;
      
      // 填充背景
      const { environmentScore, settlementType } = gameData;
      let bgColor = '';
      
      // 检查是否是极端环境结局
      if (settlementType === 'extreme') {
        // 极端环境结局 - 深暗的沙漠色调
        bgColor = 'linear-gradient(135deg, #b71c1c 0%, #ff8a65 100%)';
      } else if (environmentScore >= 80) {
        // 生态平衡结局 - 清新的蓝绿色背景
        bgColor = 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';
      } else if (environmentScore >= 60) {
        // 繁荣结局 - 温暖的绿色背景
        bgColor = 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)';
      } else if (environmentScore >= 40) {
        // 挑战结局 - 混合的黄蓝色背景
        bgColor = 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)';
      } else if (environmentScore >= 20) {
        // 困难结局 - 暗沉的橙色背景
        bgColor = 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)';
      } else {
        // 灾难结局 - 暗红色背景
        bgColor = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
      }
      
      // 创建渐变背景
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      
      if (bgColor.includes('linear-gradient')) {
        // 解析线性渐变
        const colorStops = bgColor.match(/#[a-f0-9]{6}/gi) || [];
        if (colorStops.length >= 2) {
          gradient.addColorStop(0, colorStops[0]);
          gradient.addColorStop(1, colorStops[1]);
        } else {
          gradient.addColorStop(0, '#a8edea');
          gradient.addColorStop(1, '#fed6e3');
        }
      } else {
        gradient.addColorStop(0, '#a8edea');
        gradient.addColorStop(1, '#fed6e3');
      }
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      
      // 绘制地图网格
      const cellSize = 30;
      const mapWidth = this.mapWidth;
      const mapHeight = this.mapHeight;
      const offsetX = (width - mapWidth * cellSize) / 2;
      const offsetY = (height - mapHeight * cellSize) / 2 + 30; // 留出空间给标题
      
      // 检查是否是极端环境结局
      const isExtremeEnvironment = settlementType === 'extreme';
      
      // 绘制每个地图单元格
      for (let y = 0; y < this.map.length; y++) {
        for (let x = 0; x < this.map[y].length; x++) {
          const cell = this.map[y][x];
          const cellX = offsetX + x * cellSize;
          const cellY = offsetY + y * cellSize;
          
          // 根据地形类型选择颜色
          let cellColor = '';
          switch (cell.terrain) {
            case 'plain':
              // 平原 - 绿色
              const greenIntensity = Math.min(100, Math.max(50, cell.humidity));
              if (isExtremeEnvironment) {
                // 极端环境下的平原显得较干燥
                cellColor = `rgb(${180 - greenIntensity / 2}, ${150 + (greenIntensity - 50) / 4}, ${80})`;
              } else {
                cellColor = `rgb(${155 - greenIntensity}, ${200 + (greenIntensity - 50) / 2}, ${100 - (greenIntensity - 50) / 2})`;
              }
              break;
            case 'desert':
              // 沙漠 - 黄色
              if (isExtremeEnvironment) {
                // 极端环境下的沙漠显得更强烈和干燥
                cellColor = `rgb(${240 + cell.temperature / 20}, ${190 + cell.temperature / 20}, ${100})`;
              } else {
                cellColor = `rgb(${220 + cell.temperature / 10}, ${180 + cell.temperature / 10}, ${100})`;
              }
              break;
            case 'water':
              // 水域 - 蓝色
              const blueIntensity = Math.min(100, Math.max(50, cell.humidity));
              if (isExtremeEnvironment) {
                // 极端环境下的水域显得更浅和浑浊
                cellColor = `rgb(${140 - blueIntensity / 8}, ${170 + blueIntensity / 8}, ${200})`;
              } else {
                cellColor = `rgb(${100 - blueIntensity / 4}, ${150 + blueIntensity / 4}, ${220})`;
              }
              break;
            case 'hill':
              // 丘陵 - 棕色
              if (isExtremeEnvironment) {
                // 极端环境下的丘陵显得更干燥和荒芜
                cellColor = `rgb(${170 + cell.temperature / 4}, ${130 + cell.humidity / 10}, ${70})`;
              } else {
                cellColor = `rgb(${150 + cell.temperature / 5}, ${120 + cell.humidity / 5}, ${80})`;
              }
              break;
            default:
              cellColor = '#aaaaaa';
          }
          
          // 绘制单元格
          ctx.fillStyle = cellColor;
          ctx.fillRect(cellX, cellY, cellSize - 2, cellSize - 2);
          
          // 如果是极端环境结局，添加特殊效果
          if (isExtremeEnvironment) {
            if (cell.terrain === 'desert') {
              // 为沙漠单元格添加裂缝效果
              ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
              ctx.lineWidth = 1;
              
              // 随机绘制裂缝
              if (Math.random() > 0.5) {
                ctx.beginPath();
                ctx.moveTo(cellX + Math.random() * cellSize, cellY);
                ctx.lineTo(cellX + Math.random() * cellSize, cellY + cellSize);
                ctx.stroke();
              }
              
              if (Math.random() > 0.5) {
                ctx.beginPath();
                ctx.moveTo(cellX, cellY + Math.random() * cellSize);
                ctx.lineTo(cellX + cellSize, cellY + Math.random() * cellSize);
                ctx.stroke();
              }
            }
          }
          
          // 如果有文明，绘制文明图标
          if (cell.settlement && !isExtremeEnvironment) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(cellX + cellSize / 2, cellY + cellSize / 2, cellSize / 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      
      // 添加标题
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(this.settlementResult.outcomeTitle, width / 2, 20);
      
      // 添加水印
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText('AI生成 | 集成设计游戏', width - 10, height - 10);
      
      // 将画布转换为Base64编码的图片
      const posterImage = canvas.toDataURL('image/png');
      
      // 更新结算结果
      this.settlementResult.posterImage = posterImage;
    },
    
    // 关闭结算弹窗
    closeSettlementModal() {
      this.showSettlementModal = false;
    },
    
      /**
     * 触发结算
     */
    triggerSettlement() {
      // 计算得分
      this.calculateScore();
      
      // 根据得分和游戏状态决定结局
      this.determineOutcome();
      
      // 显示结算弹窗
      this.showSettlementModal = true;
      
      // 暂停游戏
      this.gamePaused = true;
    },
    
    /**
     * 文明数量达到上限时触发结算
     */
    triggerCivilizationLimitSettlement() {
      // 计算得分
      this.calculateScore();
      
      // 设置特殊结局 - 文明繁荣
      this.settlementResult = {
        outcomeTitle: '《文明繁荣》',
        outcomeDescription: `您的世界上已经有${this.civilizations.length}个文明共存，这些文明在您的引导下和谐相处，共同繁荣。不同类型的文明各自发展出独特的文化与技术，形成了一个多元化的世界。`,
        outcomeComment: `您的游戏得分为 ${this.score} 分。您创造了一个文明繁荣的世界，在这里，人类与自然和谐相处，各种文明相互学习、交流，共同进步。这是一个罕见的成就！`,
        posterImage: 'civilization-prosperity.jpg' // 需要添加对应的图片
      };
      
      // 更新统计数据
      this.gameStatistics.specialOutcomes.push('文明繁荣');
      
      // 显示结算弹窗
      this.showSettlementModal = true;
      
      // 暂停游戏
      this.gamePaused = true;
    },
  
    // 重新开始游戏
    restartGame() {
      // 关闭结算弹窗
      this.showSettlementModal = false;
      
      // 重置极端环境相关状态
      this.extremeEnvironmentDetected = false;
      this.showExtremeEnvironmentWarning = false;
      this.stopExtremeEnvironmentCountdown();
      this.extremeEnvironmentCountdownStart = 0;
      
      // 重置游戏状态
      this.initializeMap(this.mapWidth, this.mapHeight);
      
      // 重置金币数量
      this.coins = 50;
      
      // 重置统计数据
      this.gameStatistics = {
        turnsPlayed: 0,
        extremeEvents: 0,
        civilizationsCreated: 0,
        civilizationsLost: 0,
        coinsSpent: 0,
        weatherChanges: {
          rain: 0,
          drought: 0,
          heatwave: 0,
          coldwave: 0
        }
      };
      
      // 重新开始游戏
      this.gamePaused = false;
    },

    // 检查计时器健康状态
    checkTimersHealth() {
      const now = Date.now();
      
      // 检查供奉计时器健康状态
      if (this.lastOfferingTime && now - this.lastOfferingTime > this.offeringInterval * 2) {
        console.warn('供奉计时器可能已失效，重新启动...');
        this.stopOfferingTimer();
        this.startOfferingTimer();
      }
      
      // 检查自动创建文明计时器
      if (this.autoCivilizationTimer && now - this.lastAutoCivilizationTime > this.autoCivilizationInterval * 2) {
        console.warn('自动创建文明计时器可能已失效，重新启动...');
        this.stopAutoCivilizationTimer();
        this.startAutoCivilizationTimer();
      }
    },
  }
});
