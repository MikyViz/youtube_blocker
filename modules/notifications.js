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
    const data = await API.getStorage(['panicMode', 'panicEndTime']);
    
    if (data.panicMode && Date.now() < data.panicEndTime) {
      return true; // Режим паники активен
    } else if (data.panicMode && Date.now() >= data.panicEndTime) {
      // Режим паники истек
      await API.setStorage({
        panicMode: false,
        panicEndTime: 0
      });
    }
    
    return false;
  },

  // Проверка, нужно ли показывать уведомление
  async shouldNotify(sessionStartTime) {
    const settings = await API.getStorage([
      'lastNotificationTime',
      'notificationInterval',
      'youtubeTimeToday',
      'enableBlocking',
      'workingHoursOnly',
      'timeLimit'
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
    const totalTime = settings.youtubeTimeToday || 0;
    const timeLimit = (settings.timeLimit || 15) * 60 * 1000; // лимит в миллисекундах
    
    const lastNotification = settings.lastNotificationTime || 0;
    const interval = (settings.notificationInterval || 15) * 60 * 1000; // в миллисекундах
    const timeSinceLastNotification = currentTime - lastNotification;

    if (timeSinceLastNotification >= interval) {
      return {
        shouldNotify: true,
        totalTime,
        isOverLimit: totalTime > timeLimit
      };
    }

    return { shouldNotify: false, reason: 'interval_not_reached' };
  },

  // Обновление времени последнего уведомления
  async updateLastNotificationTime() {
    await API.setStorage({
      lastNotificationTime: Date.now()
    });
  },

  // Показать уведомление о времени
  async showTimeNotification(totalTime, isOverLimit) {
    const formattedTime = UIComponents.formatTime(totalTime);
    
    if (isOverLimit) {
      // Если превышен лимит - показываем предупреждение и штрафуем
      await UIComponents.showModal(
        '⚠️ Лимит превышен!',
        `Ты уже провёл ${formattedTime} на YouTube.\n\nПуть воина требует дисциплины! 🎌\nТы превысил свой лимит. Честь потеряна! ⚔️`,
        'warning'
      );

      // Наказание за превышение лимита
      const result = await Gamification.punishForYouTube();
      
      // Дополнительное toast уведомление
      setTimeout(() => {
        UIComponents.showToast(`Честь потеряна: ${result.score} очков`, 'warning');
      }, 500);
    } else {
      // Если лимит не превышен - просто напоминание без штрафа
      await UIComponents.showModal(
        '⏰ Путь воина',
        `Ты уже провёл ${formattedTime} на YouTube.\n\nПуть воина требует дисциплины! 🎌\nКаждая минута — это битва. Победи её! ⚔️\n\n💪 Ты пока в пределах лимита. Продолжай держаться!`,
        'info'
      );
    }

    await this.updateLastNotificationTime();
  },

  // Показать приветственные сообщения
  async showWelcomeMessages(messages) {
    for (let i = 0; i < messages.length; i++) {
      // Показываем модалку и ждем её закрытия
      await UIComponents.showModal('🎌 Испытание воина', messages[i], 'warning');
    }
  },

  // Блокировка в режиме паники
  async blockPanicMode() {
    const isPanic = await this.checkPanicMode();
    
    if (isPanic) {
      UIComponents.showModal(
        '🚨 РЕЖИМ ЖЕЛЕЗНОЙ ВОЛИ',
        'YouTube полностью заблокирован.\n\n"Истинный самурай владеет собой в любой ситуации."\n\nСайт будет закрыт через 3 секунды...',
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
