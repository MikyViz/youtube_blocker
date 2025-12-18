// ===== BACKGROUND SERVICE WORKER =====
// Автоматическое начисление наград за дни без YouTube

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
    
    // Проверяем и начисляем награды за дни без YouTube
    const data = await chrome.storage.sync.get(['lastVisitDate', 'daysWithoutYouTube', 'lastCheckDate', 'willpowerScore']);
    const lastVisitDate = data.lastVisitDate || '';
    const lastCheckDate = data.lastCheckDate || '';
    let days = parseInt(data.daysWithoutYouTube || '0');
    
    // Проверяем, прошёл ли новый день с последней проверки
    if (lastCheckDate !== todayDate) {
      // Вычисляем количество дней с последнего посещения YouTube
      if (lastVisitDate && lastVisitDate !== '') {
        const lastVisit = new Date(lastVisitDate);
        const today = new Date(todayDate);
        const daysDiff = Math.floor((today - lastVisit) / (1000 * 60 * 60 * 24));
        
        // Если прошёл хотя бы один день с последнего посещения
        if (daysDiff > 0) {
          // Увеличиваем счётчик дней
          days = parseInt(data.daysWithoutYouTube || '0') + daysDiff;
          
          // Начисляем награду за каждый пропущенный день
          let totalPoints = 0;
          let hasWeekBonus = false;
          let hasMonthBonus = false;
          
          for (let i = 1; i <= daysDiff; i++) {
            const currentDay = days - daysDiff + i;
            let bonusPoints = 5; // базовая награда
            
            // Проверяем бонусы для каждого дня
            if (currentDay % 30 === 0 && currentDay > 0) {
              bonusPoints += 500; // месяц
              hasMonthBonus = true;
            }
            if (currentDay % 7 === 0 && currentDay > 0) {
              bonusPoints += 50; // неделя
              hasWeekBonus = true;
            }
            
            totalPoints += bonusPoints;
          }
          
          // Обновляем общие очки и дни
          const currentScore = parseInt(data.willpowerScore || '0');
          const newScore = currentScore + totalPoints;
          
          await chrome.storage.sync.set({ 
            daysWithoutYouTube: days,
            lastCheckDate: todayDate,
            willpowerScore: newScore,
            pendingReward: true // ставим флаг ожидающей награды
          });
          
          // Показываем уведомление о награде
          let title = '🎌 Награда за дисциплину!';
          let bonusText = '';
          if (hasMonthBonus) bonusText += ' 🏯 МЕСЯЦ!';
          if (hasWeekBonus) bonusText += ' ⚔️ НЕДЕЛЯ!';
          
          let message = `${days} ${days === 1 ? 'день' : 'дней'} без YouTube!${bonusText}\n+${totalPoints} очков чести! Всего: ${newScore}`;
          
          // Показываем Chrome notification
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/128_samurai.png',
            title: title,
            message: message,
            priority: 2,
            requireInteraction: true
          });
          
          console.log(`✅ Награда начислена: +${totalPoints} очков за ${daysDiff} дней`);
        } else {
          // День не прошёл, но обновляем дату проверки
          await chrome.storage.sync.set({ lastCheckDate: todayDate });
        }
      } else {
        // Первый запуск - устанавливаем начальную дату
        await chrome.storage.sync.set({ 
          lastCheckDate: todayDate,
          lastVisitDate: todayDate 
        });
      }
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

