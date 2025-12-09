// ===== STATE MANAGER =====
// Управление состоянием приложения с chrome.storage.sync

const StateManager = {
  // Получение данных
  async get(keys) {
    try {
      return await chrome.storage.sync.get(keys);
    } catch (error) {
      console.error('Ошибка получения данных:', error);
      return {};
    }
  },

  // Сохранение данных
  async set(data) {
    try {
      await chrome.storage.sync.set(data);
    } catch (error) {
      console.error('Ошибка сохранения данных:', error);
    }
  },

  // Инициализация значений по умолчанию
  async init() {
    const defaults = {
      youtubeTimeToday: 0,
      daysWithoutYouTube: 0,
      willpowerScore: 0,
      lastNotificationTime: 0,
      lastYouTubeDate: '',
      lastVisitDate: '',
      timeLimit: 15,
      notificationInterval: 15,
      enableBlocking: true,
      workingHoursOnly: false,
      panicMode: false,
      panicEndTime: 0
    };

    const current = await this.get(Object.keys(defaults));
    
    // Устанавливаем только отсутствующие значения
    const updates = {};
    for (const key in defaults) {
      if (current[key] === undefined) {
        updates[key] = defaults[key];
      }
    }

    if (Object.keys(updates).length > 0) {
      await this.set(updates);
    }
  },

  // Проверка нового дня
  async checkNewDay() {
    const today = new Date().toDateString();
    const data = await this.get(['lastYouTubeDate', 'youtubeTimeToday']);
    
    if (data.lastYouTubeDate !== today) {
      await this.set({
        youtubeTimeToday: 0,
        lastYouTubeDate: today
      });
      return true;
    }
    return false;
  },

  // Обновление времени на сайте
  async updateTime(additionalTime) {
    const data = await this.get(['youtubeTimeToday']);
    const newTime = (data.youtubeTimeToday || 0) + additionalTime;
    await this.set({ youtubeTimeToday: newTime });
    return newTime;
  },

  // Получение настроек
  async getSettings() {
    return await this.get([
      'timeLimit',
      'notificationInterval',
      'enableBlocking',
      'workingHoursOnly',
      'panicMode',
      'panicEndTime'
    ]);
  }
};

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StateManager;
}
