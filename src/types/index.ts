// 地形类型
export type TerrainType = 'plain' | 'desert' | 'water' | 'hill';

// 天气效果类型
export type WeatherEffect = 'hot' | 'cold' | 'dry' | 'wet';

// 警告事件类型
export type WarningEventType = 'flood' | 'drought' | 'wildfire' | 'blizzard';

// 文明类型
export type SettlementType = 'nomad' | 'agriculture' | 'fishing' | 'farming';

// 坐标
export interface Coordinate {
  x: number;
  y: number;
}

// 人类部落
export interface Settlement {
  type: SettlementType;
  resources: {
    food: number;
    tools: number;
  };
  population: number;
}

// 网格单元
export interface Cell {
  terrain: TerrainType;
  temperature: number; // 0-100
  humidity: number; // 0-100
  settlement: Settlement | null;
  activeWeatherEffects: WeatherEffect[];
  lastUpdated: number; // 时间戳
  wetCount?: number; // 沙漠单元格被潮湿的次数
  originalTerrain?: TerrainType; // 原始地形类型，用于恢复
  warningEvent?: {
    type: WarningEventType;
    startTime: number; // 警告事件开始时间
    duration: number; // 持续时间（毫秒）
    severity: number; // 严重程度（0-100）
  };
}

// 文明数据
export interface Civilization {
  id: number;
  type: SettlementType;
  position: Coordinate;
  resources: {
    food: number;
    tools: number;
  };
  population: number;
}

// 全局趋势数据
export interface GlobalTrends {
  temperature: number[]; // 历史温度记录
  humidity: number[]; // 历史湿度记录
}

// 游戏结局
export interface GameOutcome {
  title: string;
  description: string;
  achieved: boolean;
}
