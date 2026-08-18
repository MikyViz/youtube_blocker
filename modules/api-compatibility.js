// ===== API COMPATIBILITY MODULE =====
// Слой совместимости для Chrome и Firefox

const API = (() => {
  // Определяем какой API использовать (Chrome или Firefox)
  const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
  
  return {
    // Общий API для обеих платформ
    storage: browserAPI.storage,
    runtime: browserAPI.runtime,
    tabs: browserAPI.tabs,
    notifications: browserAPI.notifications,
    alarms: browserAPI.alarms,
    
    // Функция для работы с хранилищем
    async getStorage(keys) {
      try {
        return await browserAPI.storage.sync.get(keys);
      } catch (error) {
        console.error('Ошибка получения данных:', error);
        return {};
      }
    },
    
    // Функция для сохранения в хранилище
    async setStorage(data) {
      try {
        await browserAPI.storage.sync.set(data);
      } catch (error) {
        console.error('Ошибка сохранения данных:', error);
      }
    },
    
    // Функция для показания уведомлений
    showNotification(title, options = {}) {
      return browserAPI.notifications.create({
        type: 'basic',
        title: title,
        message: options.message || '',
        iconUrl: options.icon || '/icons/128_samurai.png',
        ...options
      });
    },
    
    // Функция для установки сигналов
    setAlarm(name, delayInMinutes) {
      return browserAPI.alarms.create(name, {
        delayInMinutes: delayInMinutes
      });
    },
    
    // Функция для получения текущей вкладки
    async getCurrentTab() {
      const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true });
      return tabs[0];
    },
    
    // Функция для отправки сообщения на контент скрипт
    sendMessage(tabId, message) {
      return browserAPI.tabs.sendMessage(tabId, message);
    },
    
    // Слушатель для сообщений от контент скрипта
    onMessage(callback) {
      return browserAPI.runtime.onMessage.addListener(callback);
    },
    
    // Слушатель для установки расширения
    onInstalled(callback) {
      return browserAPI.runtime.onInstalled.addListener(callback);
    },
    
    // Слушатель для старта браузера
    onStartup(callback) {
      return browserAPI.runtime.onStartup.addListener(callback);
    },
    
    // Слушатель для создания новой вкладки
    onTabCreated(callback) {
      return browserAPI.tabs.onCreated.addListener(callback);
    },
    
    // Слушатель для активации вкладки
    onTabActivated(callback) {
      return browserAPI.tabs.onActivated.addListener(callback);
    },
    
    // Слушатель для сигналов
    onAlarm(callback) {
      return browserAPI.alarms.onAlarm.addListener(callback);
    },
    
    // Получение ID расширения
    getExtensionId() {
      return browserAPI.runtime.id;
    },
    
    // Функция для проверки браузера
    getBrowser() {
      return typeof browser !== 'undefined' ? 'firefox' : 'chrome';
    }
  };
})();
