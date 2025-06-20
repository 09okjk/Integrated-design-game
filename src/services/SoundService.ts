/**
 * 游戏音效和背景音乐管理服务
 * 负责加载、播放和管理游戏中的音效和背景音乐
 */

class SoundService {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private backgroundMusic: HTMLAudioElement | null = null;
  private isMuted: boolean = false;
  private isMusicMuted: boolean = false;
  private volume: number = 0.5; // 默认音效音量50%
  private musicVolume: number = 0.3; // 默认背景音乐音量30%

  constructor() {
    this.preloadSounds();
    this.loadBackgroundMusic();
  }

  /**
   * 预加载所有音效
   */
  private preloadSounds(): void {
    // 地图板块悬停音效 - 设置较小的音量
    this.loadSound('hover', 'hover.mp3', 0.02); // 设置为20%的音量
    
    // 下雨音效
    this.loadSound('rain', 'rain.mp3');
    
    // 村民请求提醒音效
    this.loadSound('villager', 'villager.mp3');
  }
  
  /**
   * 加载背景音乐
   */
  private loadBackgroundMusic(): void {
    try {
      // 尝试加载背景音乐文件
      this.backgroundMusic = new Audio('./src/assets/music/background.mp3');
      
      // 如果加载失败，尝试使用其他路径
      this.backgroundMusic.addEventListener('error', () => {
        console.log('尝试使用备用路径加载背景音乐');
        this.backgroundMusic = new Audio('/src/assets/music/background.mp3');
        this.setupBackgroundMusic();
      });
      
      this.setupBackgroundMusic();
    } catch (error) {
      console.error('背景音乐加载失败', error);
      this.backgroundMusic = null;
    }
  }
  
  /**
   * 设置背景音乐属性
   */
  private setupBackgroundMusic(): void {
    if (!this.backgroundMusic) return;
    
    // 设置属性
    this.backgroundMusic.loop = true; // 循环播放
    this.backgroundMusic.volume = this.musicVolume;
    this.backgroundMusic.preload = 'auto'; // 预加载
    
    // 当音乐播放结束时自动重新播放
    this.backgroundMusic.addEventListener('ended', () => {
      if (this.backgroundMusic && !this.isMusicMuted) {
        this.backgroundMusic.currentTime = 0;
        this.backgroundMusic.play().catch(error => {
          console.error('背景音乐重新播放失败', error);
        });
      }
    });
    
    console.log('背景音乐设置成功');
  }

  /**
   * 加载单个音效
   * @param id 音效ID
   * @param filename 文件名
   * @param customVolume 自定义音量，可选参数，范围为0-1
   */
  private loadSound(id: string, filename: string, customVolume?: number): void {
    try {
      // 尝试多种路径加载音效
      const paths = [
        `./src/assets/sounds/${filename}`,
        `/src/assets/sounds/${filename}`,
        `../assets/sounds/${filename}`,
        `../../assets/sounds/${filename}`
      ];
      
      let audio = new Audio(paths[0]);
      
      // 设置音量 - 使用自定义音量或默认音量
      const soundVolume = customVolume !== undefined ? customVolume : this.volume;
      audio.volume = soundVolume;
      
      // 如果加载失败，尝试其他路径
      let pathIndex = 0;
      
      const handleError = () => {
        pathIndex++;
        if (pathIndex < paths.length) {
          console.log(`尝试使用备用路径加载音效: ${id}, 路径: ${paths[pathIndex]}`);
          audio = new Audio(paths[pathIndex]);
          audio.volume = soundVolume; // 使用上面定义的自定义音量
          audio.addEventListener('error', handleError);
          this.sounds.set(id, audio);
        } else {
          console.warn(`所有路径都无法加载音效: ${id}`);
        }
      };
      
      audio.addEventListener('error', handleError);
      
      // 预加载音效
      audio.load();
      
      // 存储到音效集合
      this.sounds.set(id, audio);
      
      console.log(`音效加载成功: ${id}`);
    } catch (error) {
      console.error(`音效加载失败: ${id}`, error);
    }
  }

  /**
   * 播放指定音效
   * @param id 音效ID
   */
  play(id: string): void {
    if (this.isMuted) return;
    
    const sound = this.sounds.get(id);
    if (!sound) {
      console.warn(`音效不存在: ${id}`);
      return;
    }
    
    // 重置音效以便重新播放
    sound.currentTime = 0;
    
    // 播放音效
    sound.play().catch(error => {
      console.error(`音效播放失败: ${id}`, error);
    });
  }

  /**
   * 播放下雨音效（持续几秒）
   * @param duration 持续时间（毫秒）
   */
  playRainSound(duration: number = 5000): void {
    if (this.isMuted) return;
    
    const sound = this.sounds.get('rain');
    if (!sound) {
      console.warn('下雨音效不存在');
      return;
    }
    
    // 停止任何正在播放的雨声
    sound.pause();
    
    // 重置音效并从开头播放
    sound.currentTime = 0;
    
    // 确保音量设置正确
    sound.volume = this.volume;
    
    console.log('开始播放下雨音效，持续时间：', duration, '毫秒');
    
    // 播放音效
    const playPromise = sound.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // 设置定时器，在指定时间后渐变停止音效
          setTimeout(() => {
            // 渐变音量以应用淡出效果
            const fadeOutDuration = 1000; // 1秒淡出
            const originalVolume = sound.volume;
            const fadeOutInterval = 50; // 每50毫秒更新一次
            const steps = fadeOutDuration / fadeOutInterval;
            const volumeStep = originalVolume / steps;
            
            let currentStep = 0;
            const fadeOutTimer = setInterval(() => {
              currentStep++;
              if (currentStep >= steps) {
                sound.pause();
                sound.currentTime = 0;
                sound.volume = originalVolume; // 恢复原始音量
                clearInterval(fadeOutTimer);
                console.log('下雨音效已停止');
              } else {
                sound.volume = originalVolume - (volumeStep * currentStep);
              }
            }, fadeOutInterval);
          }, duration - 1000); // 提前1秒开始淡出
        })
        .catch(error => {
          console.error('下雨音效播放失败', error);
        });
    }
  }

  /**
   * 设置音效音量
   * @param volume 音量值（0-1）
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    
    // 更新所有音效的音量
    this.sounds.forEach(sound => {
      sound.volume = this.volume;
    });
  }

  /**
   * 设置背景音乐音量
   * @param volume 音量值（0-1）
   */
  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    
    // 更新背景音乐的音量
    if (this.backgroundMusic) {
      this.backgroundMusic.volume = this.musicVolume;
    }
  }

  /**
   * 静音/取消静音音效
   * @param muted 是否静音
   */
  setMuted(muted: boolean): void {
    this.isMuted = muted;
  }

  /**
   * 切换音效静音状态
   * @returns 当前的静音状态
   */
  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }
  
  /**
   * 静音/取消静音背景音乐
   * @param muted 是否静音
   */
  setMusicMuted(muted: boolean): void {
    this.isMusicMuted = muted;
    
    if (this.backgroundMusic) {
      if (muted) {
        this.pauseBackgroundMusic();
      } else {
        this.playBackgroundMusic();
      }
    }
  }

  /**
   * 切换背景音乐静音状态
   * @returns 当前的背景音乐静音状态
   */
  toggleMusicMute(): boolean {
    this.isMusicMuted = !this.isMusicMuted;
    
    if (this.backgroundMusic) {
      if (this.isMusicMuted) {
        this.pauseBackgroundMusic();
      } else {
        this.playBackgroundMusic();
      }
    }
    
    return this.isMusicMuted;
  }
  
  /**
   * 播放背景音乐
   */
  playBackgroundMusic(): void {
    if (this.backgroundMusic && !this.isMusicMuted) {
      // 尝试播放背景音乐
      const playPromise = this.backgroundMusic.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('背景音乐播放失败', error);
          
          // 如果是用户交互错误，可能是浏览器策略限制
          if (error.name === 'NotAllowedError') {
            console.log('浏览器限制自动播放，需要用户交互才能播放音频');
          }
        });
      }
    }
  }
  
  /**
   * 暂停背景音乐
   */
  pauseBackgroundMusic(): void {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
    }
  }
  
  /**
   * 检查背景音乐是否已加载
   * @returns 是否已加载
   */
  isMusicLoaded(): boolean {
    return this.backgroundMusic !== null;
  }
  
  /**
   * 获取背景音乐静音状态
   * @returns 是否静音
   */
  getMusicMuted(): boolean {
    return this.isMusicMuted;
  }
}

// 创建单例实例
const soundService = new SoundService();
export default soundService;
