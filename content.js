// ===== REFACTORED CONTENT SCRIPT =====
// Использование модульной архитектуры с chrome.storage.sync

// Мотивационные сообщения
const messages = [
  "ты правда уверен, что это нужно?",
  "А как насчёт твоих целей?",
  "YouTube затягивает... сопротивляйся!",
  "Ты же обещал себе не заходить сюда!",
  "Закрой вкладку и будь молодцом!"
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
    
    // Проверка дней без YouTube
    const disciplineReward = await Gamification.checkDaysWithoutYouTube();
    if (disciplineReward) {
      UIComponents.showModal('🎉 Поздравляем!', disciplineReward.message, 'success');
    }
    
    // Показать приветственные сообщения
    await Notifications.showWelcomeMessages(messages);
    
    // Создать кнопку закрытия
    UIComponents.createCloseButton(handleCloseClick);
    
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
  setInterval(async () => {
    try {
      const result = await Notifications.shouldNotify(sessionStartTime);
      
      if (result.shouldNotify) {
        // Обновляем время
        await StateManager.updateTime(result.sessionTime);
        
        // Показываем уведомление
        await Notifications.showTimeNotification(result.totalTime, result.sessionTime);
        
        // Сбрасываем sessionStartTime для корректного подсчета
        sessionStartTime = Date.now();
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
    await StateManager.updateTime(sessionTime);
  } catch (error) {
    console.error('Ошибка сохранения времени:', error);
  }
}

// Обработчик клика на кнопку закрытия
async function handleCloseClick() {
  try {
    const sessionTime = Date.now() - sessionStartTime;
    const totalTime = await StateManager.updateTime(sessionTime);
    
    const reward = await Gamification.rewardForClosing(totalTime);
    
    UIComponents.showModal(
      '✅ Отличное решение!',
      `+1 Очко силы! 🏆 Сейчас у тебя ${reward.score} очков.\n⏰ Время на YouTube сегодня: ${UIComponents.formatTime(reward.timeSpent)}\nЗвание: ${reward.rank}`,
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

