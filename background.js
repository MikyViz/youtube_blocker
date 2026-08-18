// ===== BACKGROUND SERVICE WORKER =====
// Автоматическое начисление наград за дни без YouTube

// Импорт модулей
importScripts('modules/api-compatibility.js');
importScripts('modules/gamification.js');

// Проверка и начисление наград при старте браузера
API.onStartup(async () => {
  await checkAndRewardDiscipline();
});

// Проверка и начисление наград при установке расширения
API.onInstalled(async () => {
  await checkAndRewardDiscipline();
});

// Слушаем открытие новых вкладок
API.onTabCreated(async (tab) => {
  await checkAndRewardDiscipline();
});

// Слушаем активацию вкладок
API.onTabActivated(async (activeInfo) => {
  await checkAndRewardDiscipline();
});

// Главная функция проверки и начисления наград за дни без YouTube
async function checkAndRewardDiscipline() {
  try {
    // Проверка и обнуление счётчика времени при смене даты
    const todayDate = new Date().toDateString();
    const dateCheck = await API.getStorage(['lastYouTubeDate', 'youtubeTimeToday']);
    
    if (dateCheck.lastYouTubeDate !== todayDate && dateCheck.lastYouTubeDate) {
      // Новый день - обнуляем счётчик времени на YouTube
      await API.setStorage({
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
      
      // Показываем уведомление
      API.showNotification(title, {
        message: message,
        icon: 'icons/128_samurai.png'
      });
      
      console.log(`✅ Награда начислена: +${result.totalPoints} очков за ${result.daysDiff} дней`);
    }
  } catch (error) {
    console.error('Ошибка проверки и начисления наград:', error);
  }
}

// Периодическая проверка каждый час
API.setAlarm('checkDailyRewards', 60);
API.setAlarm('midnightCheck', 1440);

API.onAlarm((alarm) => {
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

