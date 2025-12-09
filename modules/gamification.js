// ===== GAMIFICATION MODULE =====
// Система наград, очков и достижений

const Gamification = {
  // Получение звания по очкам
  getRank(score) {
    if (score < 50) return "Новичок";
    if (score < 200) return "Боец";
    if (score < 500) return "Воин дисциплины";
    if (score < 1000) return "Мастер самоконтроля";
    return "Легенда силы воли";
  },

  // Награда за дисциплину (день без YouTube)
  async rewardDiscipline() {
    const data = await chrome.storage.sync.get(['willpowerScore', 'daysWithoutYouTube']);
    let score = parseInt(data.willpowerScore || '0');
    let days = parseInt(data.daysWithoutYouTube || '0');

    score += 5; // базовая награда за день
    
    // Бонусы за достижения
    if (days % 7 === 0 && days > 0) score += 50; // неделя
    if (days % 30 === 0 && days > 0) score += 500; // месяц

    await chrome.storage.sync.set({ willpowerScore: score });

    return {
      score,
      days,
      rank: this.getRank(score),
      message: `🎉 Отлично! Ты держишься уже ${days} дней.\n🏆 Текущее звание: ${this.getRank(score)}\nОчки силы: ${score}`
    };
  },

  // Наказание за просмотр YouTube
  async punishForYouTube() {
    const data = await chrome.storage.sync.get(['willpowerScore']);
    let score = parseInt(data.willpowerScore || '0');
    
    score = Math.max(0, score - 10); // не меньше нуля
    
    await chrome.storage.sync.set({
      willpowerScore: score,
      daysWithoutYouTube: 0 // сброс дней
    });

    return {
      score,
      rank: this.getRank(score),
      message: `⚠️ Минус 10 очков силы!\n🏆 Текущее звание: ${this.getRank(score)}\nОчки силы: ${score}`
    };
  },

  // Награда за закрытие сайта
  async rewardForClosing(timeSpent) {
    const data = await chrome.storage.sync.get(['willpowerScore']);
    let score = parseInt(data.willpowerScore || '0');
    
    score++; // +1 очко за самоконтроль
    
    await chrome.storage.sync.set({ willpowerScore: score });

    return {
      score,
      rank: this.getRank(score),
      timeSpent
    };
  },

  // Проверка дней без YouTube
  async checkDaysWithoutYouTube() {
    const data = await chrome.storage.sync.get(['lastVisitDate', 'daysWithoutYouTube']);
    const todayDate = new Date().toDateString();
    const lastVisitDate = data.lastVisitDate;
    let days = parseInt(data.daysWithoutYouTube || '0');

    if (lastVisitDate !== todayDate) {
      // Если вчера не было захода — увеличиваем счетчик
      if (lastVisitDate) {
        days++;
        await chrome.storage.sync.set({ daysWithoutYouTube: days });
        return await this.rewardDiscipline();
      }
      await chrome.storage.sync.set({ lastVisitDate: todayDate });
    }

    return null;
  }
};

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Gamification;
}
