// ===== NOTIFICATIONS MODULE =====
// Управление уведомлениями и проверками времени

const Notifications = {
  // Проверка рабочего времени
  isWorkingHours() {
    const hour = new Date().getHours();
    return hour >= 9 && hour < 18;
  },

  // Проверка режима паники
  async checkPanicMode() {
    const data = await chrome.storage.sync.get(['panicMode', 'panicEndTime']);
    
    if (data.panicMode && Date.now() < data.panicEndTime) {
      return true; // Режим паники активен
    } else if (data.panicMode && Date.now() >= data.panicEndTime) {
      // Режим паники истек
      await chrome.storage.sync.set({
        panicMode: false,
        panicEndTime: 0
      });
    }
    
    return false;
  },

  // Проверка, нужно ли показывать уведомление
  async shouldNotify(sessionStartTime) {
    const settings = await chrome.storage.sync.get([
      'lastNotificationTime',
      'notificationInterval',
      'youtubeTimeToday',
      'enableBlocking',
      'workingHoursOnly'
    ]);

    // Проверка, включена ли блокировка
    if (settings.enableBlocking === false) {
      return { shouldNotify: false, reason: 'blocking_disabled' };
    }

    // Проверка рабочего времени
    if (settings.workingHoursOnly && !this.isWorkingHours()) {
      return { shouldNotify: false, reason: 'outside_working_hours' };
    }

    const currentTime = Date.now();
    const sessionTime = currentTime - sessionStartTime;
    const totalTime = (settings.youtubeTimeToday || 0) + sessionTime;
    
    const lastNotification = settings.lastNotificationTime || 0;
    const interval = (settings.notificationInterval || 15) * 60 * 1000; // в миллисекундах
    const timeSinceLastNotification = currentTime - lastNotification;

    if (timeSinceLastNotification >= interval) {
      return {
        shouldNotify: true,
        totalTime,
        sessionTime
      };
    }

    return { shouldNotify: false, reason: 'interval_not_reached' };
  },

  // Обновление времени последнего уведомления
  async updateLastNotificationTime() {
    await chrome.storage.sync.set({
      lastNotificationTime: Date.now()
    });
  },

  // Показать уведомление о времени
  async showTimeNotification(totalTime, sessionTime) {
    const formattedTime = UIComponents.formatTime(totalTime);
    
    UIComponents.showModal(
      '⏰ Напоминание',
      `Время на YouTube сегодня: ${formattedTime}\n\nПора заняться чем-то полезным! 💪`,
      'warning'
    );

    // Наказание за продолжительный просмотр
    const result = await Gamification.punishForYouTube();
    
    // Дополнительное toast уведомление
    setTimeout(() => {
      UIComponents.showToast(`-10 очков! Осталось: ${result.score}`, 'warning');
    }, 500);

    await this.updateLastNotificationTime();
  },

  // Показать приветственные сообщения
  async showWelcomeMessages(messages) {
    for (let i = 0; i < messages.length; i++) {
      // Показываем модалку и ждем её закрытия
      await UIComponents.showModal('🚨 Внимание!', messages[i], 'warning');
    }
  },

  // Блокировка в режиме паники
  async blockPanicMode() {
    const isPanic = await this.checkPanicMode();
    
    if (isPanic) {
      UIComponents.showModal(
        '🚨 РЕЖИМ ПАНИКИ АКТИВИРОВАН!',
        'YouTube полностью заблокирован.\n\nСайт будет закрыт через 3 секунды...',
        'warning'
      );

      setTimeout(() => {
        window.location.href = 'about:blank';
      }, 3000);

      return true;
    }

    return false;
  }
};

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Notifications;
}
