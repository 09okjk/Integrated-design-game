/**
 * 游戏修复服务
 * 用于修复游戏中的各种问题，包括：
 * 1. 金币收益减少问题
 * 2. 警告事件不消失问题
 * 3. 天气效果持续存在问题
 * 4. 网页进程卡住问题
 */

import { useGameStore } from '../store/gameStore';

class GameFixer {
  private gameStore: ReturnType<typeof useGameStore> | null = null;
  
  /**
   * 初始化游戏修复服务
   */
  initialize() {
    this.gameStore = useGameStore();
    console.log('游戏修复服务已初始化');
    
    // 添加页面卸载前的保存功能
    window.addEventListener('beforeunload', () => {
      this.saveGameBeforeUnload();
    });
    
    // 添加游戏状态检查定时器
    setInterval(() => {
      this.checkGameState();
    }, 60000); // 每分钟检查一次游戏状态
    
    return this;
  }
  
  /**
   * 应用所有修复
   */
  applyAllFixes() {
    this.fixCoinIncome();
    this.fixWarningEvents();
    this.fixWeatherEffects();
    this.fixGameLoop();
    console.log('已应用所有游戏修复');
  }
  
  /**
   * 修复金币收益减少问题
   */
  fixCoinIncome() {
    if (!this.gameStore) return;
    
    // 修改计算供奉值的方法
    const originalCalculateOfferings = this.gameStore.calculateOfferings;
    
    this.gameStore.calculateOfferings = function() {
      // 调用原始方法
      originalCalculateOfferings.call(this);
      
      // 确保每次至少获得一些金币
      if (this.civilizations.length > 0 && this.offeringPoints === 0) {
        // 如果有文明但没有获得供奉值，添加一些基础供奉值
        const minOffering = Math.max(5, this.civilizations.length * 2);
        this.offeringPoints += minOffering;
        
        // 每10点供奉值转化为1枚金币
        const newCoins = Math.floor(this.offeringPoints / 10);
        if (newCoins > 0) {
          this.coins += newCoins;
          this.offeringPoints %= 10; // 保留余数
          
          console.log(`应用收益修复: 添加了 ${minOffering} 点供奉值，转化为 ${newCoins} 枚金币`);
        }
      }
    };
    
    console.log('金币收益问题修复已应用');
  }
  
  /**
   * 修复警告事件不消失问题
   */
  fixWarningEvents() {
    if (!this.gameStore) return;
    
    // 修改更新警告事件的方法
    // const originalUpdateWarningEvents = this.gameStore.updateWarningEvents;
    
    this.gameStore.updateWarningEvents = function() {
      const now = Date.now();
      let activeEvents = 0;
      
      // 检查和更新现有警告事件
      for (let y = 0; y < this.map.length; y++) {
        for (let x = 0; x < this.map[y].length; x++) {
          const cell = this.map[y][x];
          
          // 如果单元格有警告事件
          if (cell.warningEvent) {
            // 检查事件是否过期
            const eventLifetime = now - cell.warningEvent.startTime;
            
            // 使用全局警告事件持续时间，而不是事件自身的持续时间
            if (eventLifetime > this.warningEventDuration) {
              // 记录警告事件类型，用于后续处理
              const eventType = cell.warningEvent.type;
              const severity = cell.warningEvent.severity;
              
              // 警告事件结束
              cell.warningEvent = undefined;
              
              // 影响周围四个板块
              this.applyWarningEffectToSurroundings(x, y, eventType, severity);
              
              // 当前板块的地形变化
              this.applyTerrainChange(x, y, eventType, severity);
              
              console.log(`警告事件 ${eventType} 在位置(${x}, ${y})已结束，并应用了效果`);
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
      
      // 随机生成新的警告事件
      if (this.activeWarningEvents < 3 && Math.random() < this.warningEventChance) {
        this.generateWarningEvent();
      }
    };
    
    console.log('警告事件问题修复已应用');
  }
  
  /**
   * 修复天气效果持续存在问题
   */
  fixWeatherEffects() {
    if (!this.gameStore) return;
    
    // 修改更新天气效果的方法
    // const originalUpdateWeatherEffects = this.gameStore.updateWeatherEffects;
    
    this.gameStore.updateWeatherEffects = function() {
      const now = Date.now();
      
      // 遍历地图上的每个网格
      for (let y = 0; y < this.map.length; y++) {
        for (let x = 0; x < this.map[y].length; x++) {
          const cell = this.map[y][x];
          
          // 移除过期的天气效果
          if (cell.activeWeatherEffects.length > 0) {
            const effectLifetime = now - cell.lastUpdated;
            
            if (effectLifetime > this.weatherEffectDuration) {
              // 记录移除的天气效果
              const removedEffects = [...cell.activeWeatherEffects];
              
              // 清空天气效果
              cell.activeWeatherEffects = [];
              
              // 记录日志
              console.log(`位置(${x}, ${y})的天气效果 ${removedEffects.join(', ')} 已过期并移除`);
              
              // 触发天气效果移除事件
              window.dispatchEvent(new CustomEvent('weather-effects-removed', {
                detail: {
                  position: { x, y },
                  effects: removedEffects
                }
              }));
            }
          }
        }
      }
    };
    
    console.log('天气效果问题修复已应用');
  }
  
  /**
   * 修复游戏循环问题
   */
  fixGameLoop() {
    if (!this.gameStore) return;
    
    // 修改游戏更新函数
    // const originalUpdateGame = this.gameStore.updateGame;
    
    this.gameStore.updateGame = function() {
      if (this.gamePaused) return;
      
      try {
        // 更新游戏状态
        this.updateGameState();
        
        // 更新游戏统计数据
        this.gameStatistics.turnsPlayed++;
        
        // 检查供奉计时器是否在运行
        if (!this.offeringTimer) {
          console.log('供奉计时器未启动，重新启动');
          this.startOfferingTimer();
        }
        
        // 记录最后一次成功更新时间
        this.lastSuccessfulUpdate = Date.now();
        
        // 每30次更新保存一次游戏状态
        if (this.gameStatistics.turnsPlayed % 30 === 0) {
          gameFixer.saveGameState();
        }
      } catch (error) {
        console.error('游戏更新过程中发生错误:', error);
        // 尝试恢复游戏状态
        gameFixer.recoverGameState();
      }
    };
    
    console.log('游戏循环问题修复已应用');
  }
  
  /**
   * 保存游戏状态
   */
  saveGameState() {
    if (!this.gameStore) return;
    
    try {
      // 准备要保存的游戏状态
      const gameState = {
        // 游戏基本状态
        gameStarted: this.gameStore.gameStarted,
        gamePaused: this.gameStore.gamePaused,
        gameOver: this.gameStore.gameOver,
        
        // 地图数据
        map: JSON.parse(JSON.stringify(this.gameStore.map)),
        
        // 文明数据
        civilizations: JSON.parse(JSON.stringify(this.gameStore.civilizations)),
        nextCivId: this.gameStore.nextCivId,
        
        // 资源数据
        coins: this.gameStore.coins,
        offeringPoints: this.gameStore.offeringPoints,
        
        // 统计数据
        gameStatistics: JSON.parse(JSON.stringify(this.gameStore.gameStatistics)),
        
        // 全局趋势
        globalTrends: JSON.parse(JSON.stringify(this.gameStore.globalTrends)),
        
        // 时间戳
        savedAt: Date.now()
      };
      
      // 保存到本地存储
      localStorage.setItem('natural-symphony-game-state', JSON.stringify(gameState));
      console.log('游戏状态已保存');
    } catch (error) {
      console.error('保存游戏状态失败:', error);
    }
  }
  
  /**
   * 在页面卸载前保存游戏状态
   */
  saveGameBeforeUnload() {
    if (!this.gameStore || !this.gameStore.gameStarted || this.gameStore.gameOver) return;
    
    this.saveGameState();
  }
  
  /**
   * 加载游戏状态
   */
  loadGameState() {
    if (!this.gameStore) return false;
    
    try {
      // 从本地存储加载游戏状态
      const savedState = localStorage.getItem('natural-symphony-game-state');
      if (!savedState) {
        console.log('没有保存的游戏状态');
        return false;
      }
      
      const gameState = JSON.parse(savedState);
      
      // 恢复游戏状态
      this.gameStore.gameStarted = gameState.gameStarted;
      this.gameStore.gamePaused = gameState.gamePaused;
      this.gameStore.gameOver = gameState.gameOver;
      this.gameStore.map = gameState.map;
      this.gameStore.civilizations = gameState.civilizations;
      this.gameStore.nextCivId = gameState.nextCivId;
      this.gameStore.coins = gameState.coins;
      this.gameStore.offeringPoints = gameState.offeringPoints;
      this.gameStore.gameStatistics = gameState.gameStatistics;
      this.gameStore.globalTrends = gameState.globalTrends;
      
      console.log('游戏状态已加载');
      return true;
    } catch (error) {
      console.error('加载游戏状态失败:', error);
      return false;
    }
  }
  
  /**
   * 恢复游戏状态
   */
  recoverGameState() {
    if (!this.gameStore) return;
    
    console.warn('尝试恢复游戏状态...');
    
    // 尝试加载保存的游戏状态
    const loaded = this.loadGameState();
    
    if (!loaded) {
      console.warn('无法从保存的状态恢复，尝试重启游戏计时器');
      
      // 重启所有计时器
      this.gameStore.stopGameTimer();
      setTimeout(() => {
        this.gameStore.startGameTimer();
        console.log('游戏计时器已重启');
      }, 1000);
    }
  }
  
  /**
   * 检查游戏状态
   * 如果游戏长时间没有更新，尝试恢复
   */
  checkGameState() {
    if (!this.gameStore || !this.gameStore.gameStarted || this.gameStore.gamePaused) return;
    
    const now = Date.now();
    const lastUpdate = this.gameStore.lastSuccessfulUpdate || 0;
    
    // 如果超过2分钟没有更新，尝试恢复
    if (now - lastUpdate > 120000) {
      console.warn('游戏长时间未更新，尝试恢复...');
      this.recoverGameState();
    }
  }
}

// 创建单例实例
const gameFixer = new GameFixer();
export default gameFixer;
