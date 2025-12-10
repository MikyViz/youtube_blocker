// ===== BACKGROUND SERVICE WORKER =====
// Проверка наград при запуске браузера и открытии вкладок

// Проверка отложенных наград при старте браузера
chrome.runtime.onStartup.addListener(async () => {
  await checkPendingRewards();
});

// Проверка отложенных наград при установке расширения
chrome.runtime.onInstalled.addListener(async () => {
  await checkPendingRewards();
});

// Слушаем открытие новых вкладок
chrome.tabs.onCreated.addListener(async (tab) => {
  await checkPendingRewards();
});

// Слушаем активацию вкладок
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await checkPendingRewards();
});

// Функция проверки и показа отложенных наград
async function checkPendingRewards() {
  try {
    const data = await chrome.storage.sync.get(['pendingReward', 'daysWithoutYouTube', 'willpowerScore', 'lastCheckDate']);
    
    const todayDate = new Date().toDateString();
    const lastCheckDate = data.lastCheckDate || todayDate;
    
    // Проверяем, нужно ли начислить награду за новый день
    if (lastCheckDate !== todayDate && data.pendingReward) {
      // Есть ожидающая награда - показываем уведомление
      const days = parseInt(data.daysWithoutYouTube || '0');
      const score = parseInt(data.willpowerScore || '0');
      
      let title = '🎌 Награда за дисциплину!';
      let message = `Ты держишься ${days} дней без YouTube! Честь растёт! (+${days >= 30 ? 555 : days >= 7 ? 55 : 5} очков)`;
      
      // Показываем Chrome notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: title,
        message: message,
        priority: 2,
        requireInteraction: true // Требует закрытия пользователем
      });
      
      // Открываем popup для детального просмотра
      setTimeout(() => {
        chrome.action.openPopup();
      }, 1000);
    }
  } catch (error) {
    console.error('Ошибка проверки наград:', error);
  }
}

// Периодическая проверка (каждый час)
chrome.alarms.create('checkRewards', { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkRewards') {
    checkPendingRewards();
  }
});

