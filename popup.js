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
  if (score < 50) return "Новичок";
  if (score < 200) return "Боец";
  if (score < 500) return "Воин дисциплины";
  if (score < 1000) return "Мастер самоконтроля";
  return "Легенда силы воли";
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
      'workingHoursOnly'
    ]);

    // Обновление статистики
    const timeToday = parseInt(result.youtubeTimeToday || '0');
    const daysWithout = parseInt(result.daysWithoutYouTube || '0');
    const score = parseInt(result.willpowerScore || '0');

    document.getElementById('timeToday').textContent = formatTime(timeToday);
    document.getElementById('daysWithout').textContent = daysWithout;
    document.getElementById('score').textContent = score;
    document.getElementById('rank').textContent = getRank(score);

    // Загрузка настроек
    document.getElementById('timeLimit').value = result.timeLimit || 15;
    document.getElementById('notificationInterval').value = result.notificationInterval || 15;
    document.getElementById('enableBlocking').checked = result.enableBlocking !== false;
    document.getElementById('workingHoursOnly').checked = result.workingHoursOnly || false;
  } catch (error) {
    console.error('Ошибка загрузки данных:', error);
  }
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
  if (confirm('🚨 Активировать режим паники? YouTube будет полностью заблокирован на 1 час!')) {
    try {
      const panicEndTime = Date.now() + (60 * 60 * 1000); // +1 час
      await chrome.storage.sync.set({
        panicMode: true,
        panicEndTime: panicEndTime
      });
      
      alert('🚨 Режим паники активирован! Блокировка на 1 час.');
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
