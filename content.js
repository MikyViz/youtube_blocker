// ===== REFACTORED CONTENT SCRIPT =====
// Использование модульной архитектуры с chrome.storage.sync

// Мотивационные сообщения в самурайском стиле
const messages = [
  "⚔️ Каждая минута — это битва. Победи её!",
  "🏯 Закрой вкладку, воин, и укрепи свою честь.",
  "🎌 Путь самурая требует дисциплины.",
  "💥 Ты сильнее своих слабостей. Докажи это!",
  "⛩️ Истинный воин владеет собой."
];

// Инициализация
let sessionStartTime = Date.now();

// Основная функция инициализации
async function init() {
  try {
    // Инициализация значений по умолчанию
    await StateManager.init();
    
    // Проверка режима паники
    const isPanic = await Notifications.blockPanicMode();
    if (isPanic) return; // Выход, если режим паники активен
    
    // Проверка нового дня
    await StateManager.checkNewDay();
    
    // Проверка отложенных наград (показываем на YouTube)
    const pendingReward = await Gamification.checkAndShowPendingReward();
    if (pendingReward.hasPendingReward) {
      await UIComponents.showModal('🎌 Награда самурая!', pendingReward.message, 'success');
    }
    
    // Сбрасываем счётчик дней при посещении YouTube (без штрафа)
    await Gamification.resetDaysWithoutYouTube();
    
    // Создать кнопку закрытия
    UIComponents.createCloseButton(handleCloseClick);
    
    // Показать приветственные сообщения
    await Notifications.showWelcomeMessages(messages);
    
    // Запустить проверку времени
    startTimeTracking();
    
    // Обработчик ухода со страницы
    window.addEventListener('beforeunload', handleBeforeUnload);
    
  } catch (error) {
    console.error('Ошибка инициализации:', error);
  }
}

// Трекинг времени
async function startTimeTracking() {
  // Сохраняем время каждые 10 секунд
  setInterval(async () => {
    try {
      const sessionTime = Date.now() - sessionStartTime;
      const data = await chrome.storage.sync.get(['youtubeTimeToday']);
      const currentTotal = data.youtubeTimeToday || 0;
      
      // Обновляем общее время
      await chrome.storage.sync.set({
        youtubeTimeToday: currentTotal + sessionTime
      });
      
      // Сбрасываем sessionStartTime
      sessionStartTime = Date.now();
    } catch (error) {
      console.error('Ошибка сохранения времени:', error);
    }
  }, 10000); // Каждые 10 секунд

  // Проверка на уведомления каждую минуту
  setInterval(async () => {
    try {
      const result = await Notifications.shouldNotify(sessionStartTime);
      
      if (result.shouldNotify) {
        // Показываем уведомление с учётом превышения лимита
        await Notifications.showTimeNotification(result.totalTime, result.isOverLimit);
      }
    } catch (error) {
      console.error('Ошибка проверки времени:', error);
    }
  }, 60000); // Проверка каждую минуту
}

// Обработчик закрытия страницы
async function handleBeforeUnload() {
  try {
    const sessionTime = Date.now() - sessionStartTime;
    const data = await chrome.storage.sync.get(['youtubeTimeToday']);
    const currentTotal = data.youtubeTimeToday || 0;
    
    await chrome.storage.sync.set({
      youtubeTimeToday: currentTotal + sessionTime
    });
  } catch (error) {
    console.error('Ошибка сохранения времени:', error);
  }
}

// Обработчик клика на кнопку закрытия
async function handleCloseClick() {
  try {
    const sessionTime = Date.now() - sessionStartTime;
    const data = await chrome.storage.sync.get(['youtubeTimeToday']);
    const currentTotal = data.youtubeTimeToday || 0;
    const totalTime = currentTotal + sessionTime;
    
    await chrome.storage.sync.set({
      youtubeTimeToday: totalTime
    });
    
    const reward = await Gamification.rewardForClosing(totalTime);
    
    await UIComponents.showModal(
      '⚔️ Победа над собой!',
      `Ты победил внутреннего демона!\n\n+1 Очко чести! 🏆\nТвоя честь крепнет, как сталь катаны.\n\n🏯 Очки чести: ${reward.score}\n⏰ Время сегодня: ${UIComponents.formatTime(reward.timeSpent)}\n⚔️ Звание: ${reward.rank}`,
      'success'
    );
    
    setTimeout(() => {
      window.location.href = "about:blank";
    }, 2000);
  } catch (error) {
    console.error('Ошибка закрытия:', error);
    window.location.href = "about:blank";
  }
}

// Запуск приложения
init();

