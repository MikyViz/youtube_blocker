// ===== BACKGROUND SERVICE WORKER =====
// Автоматическое начисление наград за дни без YouTube

// Импорт модуля геймификации
importScripts('modules/gamification.js');

// Проверка и начисление наград при старте браузера
chrome.runtime.onStartup.addListener(async () => {
  await checkAndRewardDiscipline();
});

// Проверка и начисление наград при установке расширения
chrome.runtime.onInstalled.addListener(async () => {
  await checkAndRewardDiscipline();
});

// Слушаем открытие новых вкладок
chrome.tabs.onCreated.addListener(async (tab) => {
  await checkAndRewardDiscipline();
});

// Слушаем активацию вкладок
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await checkAndRewardDiscipline();
});

// Главная функция проверки и начисления наград за дни без YouTube
async function checkAndRewardDiscipline() {
  try {
    // Проверка и обнуление счётчика времени при смене даты
    const todayDate = new Date().toDateString();
    const dateCheck = await chrome.storage.sync.get(['lastYouTubeDate', 'youtubeTimeToday']);
    
    if (dateCheck.lastYouTubeDate !== todayDate && dateCheck.lastYouTubeDate) {
      // Новый день - обнуляем счётчик времени на YouTube
      await chrome.storage.sync.set({
        youtubeTimeToday: 0,
        lastYouTubeDate: todayDate
      });
    }
    
    // Используем метод из gamification.js для начисления наград
    const result = await Gamification.checkDaysWithoutYouTube();
    
    if (result && result.totalPoints > 0) {
      // Показываем уведомление о награде
      let title = '🎌 Награда за дисциплину!';
      let bonusText = '';
      
      // Определяем бонусы
      const days = result.days;
      if (days % 30 === 0 && days > 0) bonusText += ' 🏯 МЕСЯЦ!';
      else if (days % 7 === 0 && days > 0) bonusText += ' ⚔️ НЕДЕЛЯ!';
      
      let message = `${days} ${days === 1 ? 'день' : 'дней'} без YouTube!${bonusText}\n+${result.totalPoints} очков чести! Всего: ${result.score}`;
      
      // Показываем Chrome notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/128_samurai.png',
        title: title,
        message: message,
        priority: 2,
        requireInteraction: true
      });
      
      console.log(`✅ Награда начислена: +${result.totalPoints} очков за ${result.daysDiff} дней`);
    }
  } catch (error) {
    console.error('Ошибка проверки и начисления наград:', error);
  }
}

// Периодическая проверка каждый час
chrome.alarms.create('checkDailyRewards', { periodInMinutes: 60 });

// Проверка каждый час в 00:00 (полночь)
chrome.alarms.create('midnightCheck', { 
  when: getMidnightTime(),
  periodInMinutes: 1440 // каждые 24 часа
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkDailyRewards' || alarm.name === 'midnightCheck') {
    checkAndRewardDiscipline();
  }
});

// Функция для получения времени следующей полуночи
function getMidnightTime() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime();
}

