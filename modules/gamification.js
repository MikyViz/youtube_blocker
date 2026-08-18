// ===== GAMIFICATION MODULE =====
// Система наград, очков и достижений в самурайском стиле

const Gamification = {
  // Получение звания по очкам чести
  getRank(score) {
    // Отрицательные звания (путь падения)
    if (score <= -1001) return "Сэппуку (切腹) — Путь очищения";
    if (score <= -501) return "Курой Кэнси (黒い剣士) — Тёмный мечник";
    if (score <= -201) return "Хансэй (反省) — Раскаивающийся";
    if (score <= -51) return "Ронин (浪人) — Странствующий без чести";
    if (score < 0) return "Мукэ (無家) — Без дома, без чести";
    
    // Положительные звания (путь самурая)
    if (score < 51) return "Минсэй (ученик)";
    if (score < 201) return "Сюгёся (практикующий)";
    if (score < 501) return "Кэнси (мечник)";
    if (score < 1001) return "Самурай";
    if (score < 2001) return "Сэнсэй (наставник)";
    return "Даймё (лорд дисциплины)";
  },

  // Награда за дисциплину (день без YouTube)
  async rewardDiscipline() {
    const data = await API.getStorage(['willpowerScore', 'daysWithoutYouTube']);
    let score = parseInt(data.willpowerScore || '0');
    const days = parseInt(data.daysWithoutYouTube || '0');

    let bonusPoints = 5; // базовая награда за день
    let bonusMessage = '\n💪 Продолжай свой путь, воин! Дисциплина — твоя сила.';
    
    // Бонусы за достижения
    if (days % 30 === 0 && days > 0) {
      bonusPoints += 500; // месяц (проверяем первым, чтобы получить оба бонуса)
      bonusMessage = '\n🏯 Месяц без слабости! Ты достоин звания истинного воина. (+500 бонус)';
    }
    if (days % 7 === 0 && days > 0) {
      bonusPoints += 50; // неделя
      if (bonusMessage) {
        bonusMessage += '\n⚔️ И еще бонус за неделю! (+50 бонус)';
      } else {
        bonusMessage = '\n⚔️ Неделя дисциплины! Твоя воля крепка, как сталь. (+50 бонус)';
      }
    }

    score += bonusPoints;
    await API.setStorage({ willpowerScore: score });

    return {
      score,
      days,
      bonusPoints,
      rank: this.getRank(score),
      message: `🎌 Твоя честь растёт, воин! ${days} ${days === 1 ? 'день' : 'дней'} на пути самурая. (+${bonusPoints} очков)${bonusMessage}\n⚔️ Звание: ${this.getRank(score)}\n🏆 Очки чести: ${score}`
    };
  },

  // Сброс дней без YouTube (без штрафа, просто обнуление счётчика)
  async resetDaysWithoutYouTube() {
    const todayDate = new Date().toDateString();
    await API.setStorage({
      daysWithoutYouTube: 0,
      lastVisitDate: todayDate // Сохраняем дату ПОСЕЩЕНИЯ YouTube
    });
  },

  // Наказание за превышение лимита времени на YouTube
  async punishForYouTube() {
    const data = await API.getStorage(['willpowerScore']);
    let score = parseInt(data.willpowerScore || '0');
    
    score = score - 10; // штраф за превышение лимита
    
    await API.setStorage({
      willpowerScore: score,
      daysWithoutYouTube: 0 // сброс дней при превышении лимита
    });

    // Получаем сообщение в зависимости от уровня падения
    let customMessage = this.getDishonorMessage(score);

    return {
      score,
      rank: this.getRank(score),
      message: `⚔️ Ты потерял часть своей чести, воин. (−10 очков)\n🎭 Звание: ${this.getRank(score)}\n🏆 Очки чести: ${score}\n\n${customMessage}`
    };
  },

  // Получение сообщения о бесчестии в зависимости от уровня
  getDishonorMessage(score) {
    if (score <= -1001) {
      return "💀 Твоя честь полностью потеряна. Остался лишь путь Сэппуку — символ полного падения.\n\n\"Смерть с честью лучше, чем жизнь в позоре.\"";
    }
    if (score <= -501) {
      return "🌑 Тьма поглотила твоё сердце. Ты стал Тёмным мечником, воином без пути.\n\n\"Слабость — это яд, который разрушает воина изнутри.\"";
    }
    if (score <= -201) {
      return "😔 Ты на пути раскаяния. Хансэй — ищущий путь обратно к свету.\n\n\"Каждое падение — это шанс подняться сильнее.\"";
    }
    if (score <= -51) {
      return "🍂 Ты стал Ронином — странствующим воином без господина, утратившим честь.\n\n\"Без чести самурай — лишь тень того, кем он был.\"";
    }
    if (score < 0) {
      return "🏚️ Ты потерял свой дом и честь. Мукэ — воин без корней.\n\n\"Первый шаг к падению — это отказ от дисциплины.\"";
    }
    return "\"Путь самурая — это путь постоянной борьбы.\"";
  },

  // Награда за закрытие сайта
  async rewardForClosing(timeSpent) {
    const data = await API.getStorage(['willpowerScore']);
    let score = parseInt(data.willpowerScore || '0');
    
    score++; // +1 очко за самоконтроль
    
    await API.setStorage({ willpowerScore: score });

    return {
      score,
      rank: this.getRank(score),
      timeSpent
    };
  },

  // Проверка дней без YouTube (автоматическое начисление наград)
  async checkDaysWithoutYouTube() {
    const data = await API.getStorage(['lastVisitDate', 'lastCheckDate', 'willpowerScore']);
    const todayDate = new Date().toDateString();
    const lastVisitDate = data.lastVisitDate || '';
    const lastCheckDate = data.lastCheckDate || '';

    // Проверяем, прошёл ли новый день с последней проверки
    if (lastCheckDate !== todayDate) {
      // Вычисляем количество дней с последнего посещения YouTube
      if (lastVisitDate && lastVisitDate !== '') {
        const lastVisit = new Date(lastVisitDate);
        const today = new Date(todayDate);
        const daysDiff = Math.floor((today - lastVisit) / (1000 * 60 * 60 * 24));
        
        // Если прошёл хотя бы один день с последнего посещения
        if (daysDiff > 0) {
          // Дни без YouTube = количество дней С последнего посещения
          const days = daysDiff;
          
          // Обновляем дни в storage
          await API.setStorage({ 
            daysWithoutYouTube: days,
            lastCheckDate: todayDate,
            pendingReward: true // ставим флаг ожидающей награды
          });
          
          // Начисляем награду за каждый пропущенный день
          let totalPoints = 0;
          for (let i = 1; i <= daysDiff; i++) {
            const currentDay = i; // День в последовательности (1, 2, 3...)
            let bonusPoints = 5; // базовая награда
            
            // Проверяем бонусы для каждого дня
            if (currentDay % 30 === 0 && currentDay > 0) {
              bonusPoints += 500; // месяц
            }
            if (currentDay % 7 === 0 && currentDay > 0) {
              bonusPoints += 50; // неделя
            }
            
            totalPoints += bonusPoints;
          }
          
          // Обновляем общие очки
          const currentScore = parseInt(data.willpowerScore || '0');
          await API.setStorage({ willpowerScore: currentScore + totalPoints });
          
          return {
            days,
            totalPoints,
            daysDiff,
            score: currentScore + totalPoints,
            rank: this.getRank(currentScore + totalPoints)
          };
        }
      }
      
      // Обновляем дату проверки
      await API.setStorage({ lastCheckDate: todayDate });
    }

    return null;
  },

  // Проверка и показ отложенной награды (вызывается на любой странице)
  async checkAndShowPendingReward() {
    const data = await API.getStorage(['pendingReward', 'daysWithoutYouTube', 'willpowerScore']);
    
    if (data.pendingReward) {
      // Есть ожидающая награда - показываем её
      const days = parseInt(data.daysWithoutYouTube || '0');
      const score = parseInt(data.willpowerScore || '0');
      const rank = this.getRank(score);
      
      let bonusMessage = '';
      if (days % 7 === 0 && days > 0) {
        bonusMessage = '\n⚔️ Неделя дисциплины! Твоя воля крепка, как сталь.';
      }
      if (days % 30 === 0 && days > 0) {
        bonusMessage = '\n🏯 Месяц без слабости! Ты достоин звания истинного воина.';
      }
      
      const message = `🎌 Твоя честь растёт, воин! ${days} дней на пути самурая.${bonusMessage}\n⚔️ Звание: ${rank}\n🏆 Очки чести: ${score}`;
      
      // Сбрасываем флаг награды
      await API.setStorage({ pendingReward: null });
      
      return {
        hasPendingReward: true,
        message: message,
        score: score,
        days: days,
        rank: rank
      };
    }
    
    return { hasPendingReward: false };
  }
};

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Gamification;
}
