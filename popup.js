// Функция для форматирования времени
function formatTime(milliseconds) {
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
  
  if (hours > 0) {
    return `${hours}ч ${minutes}м ${seconds}с`;
  } else if (minutes > 0) {
    return `${minutes}м ${seconds}с`;
  } else {
    return `${seconds}с`;
  }
}

// Получение звания
function getRank(score) {
  // Отрицательные звания (путь падения)
  if (score <= -1001) return "Сэппуку (切腹)";
  if (score <= -501) return "Курой Кэнси (黒い剣士)";
  if (score <= -201) return "Хансэй (反省)";
  if (score <= -51) return "Ронин (浪人)";
  if (score < 0) return "Мукэ (無家)";
  
  // Положительные звания (путь самурая)
  if (score < 51) return "Минсэй (ученик)";
  if (score < 201) return "Сюгёся (практикующий)";
  if (score < 501) return "Кэнси (мечник)";
  if (score < 1001) return "Самурай";
  if (score < 2001) return "Сэнсэй (наставник)";
  return "Даймё (лорд дисциплины)";
}

// Загрузка статистики
async function loadStats() {
  try {
    const result = await chrome.storage.sync.get([
      'youtubeTimeToday',
      'daysWithoutYouTube',
      'willpowerScore',
      'timeLimit',
      'notificationInterval',
      'enableBlocking',
      'workingHoursOnly',
      'pendingReward'
    ]);

    // Проверка отложенной награды
    if (result.pendingReward) {
      // Показываем награду
      showPendingRewardNotification(result);
    }

    // Обновление статистики
    const timeToday = parseInt(result.youtubeTimeToday || '0');
    const daysWithout = parseInt(result.daysWithoutYouTube || '0');
    const score = parseInt(result.willpowerScore || '0');

    document.getElementById('timeToday').textContent = formatTime(timeToday);
    document.getElementById('daysWithout').textContent = daysWithout;
    
    const scoreElement = document.getElementById('score');
    scoreElement.textContent = score;
    
    // Добавляем класс для отрицательных очков
    if (score < 0) {
      scoreElement.classList.add('negative');
    } else {
      scoreElement.classList.remove('negative');
    }
    
    const rankElement = document.getElementById('rank');
    rankElement.textContent = getRank(score);
    
    // Добавляем класс для отрицательных званий
    if (score < 0) {
      rankElement.classList.add('negative');
    } else {
      rankElement.classList.remove('negative');
    }

    // Загрузка настроек
    document.getElementById('timeLimit').value = result.timeLimit || 15;
    document.getElementById('notificationInterval').value = result.notificationInterval || 15;
    document.getElementById('enableBlocking').checked = result.enableBlocking !== false;
    document.getElementById('workingHoursOnly').checked = result.workingHoursOnly || false;
  } catch (error) {
    console.error('Ошибка загрузки данных:', error);
  }
}

// Показ отложенной награды
async function showPendingRewardNotification(data) {
  const days = parseInt(data.daysWithoutYouTube || '0');
  const score = parseInt(data.willpowerScore || '0');
  
  let bonusMessage = '';
  if (days % 7 === 0 && days > 0) {
    bonusMessage = '\n\n⚔️ Неделя дисциплины! Твоя воля крепка, как сталь.';
  }
  if (days % 30 === 0 && days > 0) {
    bonusMessage = '\n\n🏯 Месяц без слабости! Ты достоин звания истинного воина.';
  }
  
  // Создаем временное уведомление в popup
  const notification = document.createElement('div');
  notification.className = 'reward-notification';
  notification.innerHTML = `
    <div class="reward-content">
      <h3>🎌 Награда самурая!</h3>
      <p>Ты держишься ${days} дней без YouTube!${bonusMessage}</p>
      <p><strong>⚔️ Звание:</strong> ${getRank(score)}</p>
      <p><strong>🏆 Очки чести:</strong> ${score}</p>
      <button id="closeReward" class="btn btn-primary">Принять награду ⚔️</button>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Закрытие уведомления
  document.getElementById('closeReward').addEventListener('click', async () => {
    notification.remove();
    await chrome.storage.sync.set({ pendingReward: null });
  });
}

// Сохранение настроек
document.getElementById('saveSettings').addEventListener('click', async () => {
  const settings = {
    timeLimit: parseInt(document.getElementById('timeLimit').value),
    notificationInterval: parseInt(document.getElementById('notificationInterval').value),
    enableBlocking: document.getElementById('enableBlocking').checked,
    workingHoursOnly: document.getElementById('workingHoursOnly').checked
  };

  try {
    await chrome.storage.sync.set(settings);
    
    // Визуальная обратная связь
    const btn = document.getElementById('saveSettings');
    const originalText = btn.textContent;
    btn.textContent = '✅ Сохранено!';
    btn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    
    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = '';
    }, 2000);
  } catch (error) {
    console.error('Ошибка сохранения:', error);
    alert('Ошибка при сохранении настроек');
  }
});

// Сброс статистики
document.getElementById('resetStats').addEventListener('click', async () => {
  if (confirm('Точно сбросить всю статистику?')) {
    try {
      await chrome.storage.sync.set({
        youtubeTimeToday: 0,
        daysWithoutYouTube: 0,
        willpowerScore: 0,
        lastNotificationTime: 0,
        lastYouTubeDate: '',
        lastVisitDate: ''
      });
      
      await loadStats();
      alert('✅ Статистика сброшена!');
    } catch (error) {
      console.error('Ошибка сброса:', error);
    }
  }
});

// Режим паники
document.getElementById('panicMode').addEventListener('click', async () => {
  if (confirm('⚔️ Активировать режим железной воли?\n\nYouTube будет полностью заблокирован на 1 час!\n\n"Истинный самурай владеет собой в любой ситуации."')) {
    try {
      const panicEndTime = Date.now() + (60 * 60 * 1000); // +1 час
      await chrome.storage.sync.set({
        panicMode: true,
        panicEndTime: panicEndTime
      });
      
      alert('⚔️ Режим железной воли активирован! Блокировка на 1 час.');
      window.close();
    } catch (error) {
      console.error('Ошибка активации режима паники:', error);
    }
  }
});

// Загрузка при открытии
document.addEventListener('DOMContentLoaded', loadStats);

// Автообновление каждые 2 секунды
setInterval(loadStats, 2000);
