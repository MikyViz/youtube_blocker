# API Compatibility Layer - Developer Guide

## Обзор

Модуль `modules/api-compatibility.js` предоставляет единый интерфейс для работы с браузерными API в Chrome и Firefox.

## Почему это нужно?

Firefox использует `browser` API, а Chrome использует `chrome` API. Они функционально идентичны, но имеют разные имена.

### До совместимости:
```javascript
// Код работает только в Chrome
await chrome.storage.sync.get(['key']);

// Firefox код должен быть:
await browser.storage.sync.get(['key']);
```

### После совместимости:
```javascript
// Код работает везде
await API.getStorage(['key']);
```

## Структура модуля

```javascript
const API = (() => {
  // Автоматически определяет доступный API
  const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
  
  // Возвращает унифицированный интерфейс
  return {
    // Методы для работы с хранилищем
    getStorage(keys),
    setStorage(data),
    
    // Методы для уведомлений
    showNotification(title, options),
    
    // Методы для сигналов
    setAlarm(name, delayInMinutes),
    
    // Методы для вкладок
    getCurrentTab(),
    sendMessage(tabId, message),
    
    // Слушатели событий
    onMessage(callback),
    onInstalled(callback),
    onStartup(callback),
    onTabCreated(callback),
    onTabActivated(callback),
    onAlarm(callback),
    
    // Утилиты
    getExtensionId(),
    getBrowser() // 'firefox' или 'chrome'
  };
})();
```

## API Методы

### Работа с хранилищем

#### `API.getStorage(keys)`
Получить значения из синхронизированного хранилища.

```javascript
const data = await API.getStorage(['score', 'daysWithoutYouTube']);
console.log(data.score); // значение или undefined
```

#### `API.setStorage(data)`
Сохранить значения в синхронизированное хранилище.

```javascript
await API.setStorage({ 
  score: 100,
  daysWithoutYouTube: 5 
});
```

### Уведомления

#### `API.showNotification(title, options)`
Показать системное уведомление.

```javascript
API.showNotification('Награда!', {
  message: 'Поздравляем с новым достижением!',
  icon: '/icons/128_samurai.png'
});
```

### Сигналы (Alarms)

#### `API.setAlarm(name, delayInMinutes)`
Установить сигнал для выполнения в будущем.

```javascript
API.setAlarm('checkDailyRewards', 60); // Через 60 минут
```

#### `API.onAlarm(callback)`
Слушать сигналы.

```javascript
API.onAlarm((alarm) => {
  if (alarm.name === 'checkDailyRewards') {
    console.log('Пора проверять награды!');
  }
});
```

### Вкладки

#### `API.getCurrentTab()`
Получить текущую активную вкладку.

```javascript
const tab = await API.getCurrentTab();
console.log(tab.url);
```

#### `API.sendMessage(tabId, message)`
Отправить сообщение на вкладку.

```javascript
await API.sendMessage(tabId, { 
  action: 'updateTime',
  time: 5000
});
```

### События

#### `API.onInstalled(callback)`
Событие при установке расширения.

```javascript
API.onInstalled(async (details) => {
  if (details.reason === 'install') {
    console.log('Расширение установлено!');
  }
});
```

#### `API.onStartup(callback)`
Событие при старте браузера.

```javascript
API.onStartup(async () => {
  console.log('Браузер запустился');
});
```

#### `API.onTabCreated(callback)`
Событие при создании новой вкладки.

```javascript
API.onTabCreated((tab) => {
  console.log('Новая вкладка:', tab.url);
});
```

#### `API.onTabActivated(callback)`
Событие при активации вкладки.

```javascript
API.onTabActivated((activeInfo) => {
  console.log('Активирована вкладка:', activeInfo.tabId);
});
```

## Примеры использования

### Пример 1: Отслеживание времени

```javascript
async function trackYouTubeTime(sessionTime) {
  // Получить текущее время
  const data = await API.getStorage(['youtubeTimeToday']);
  const currentTime = data.youtubeTimeToday || 0;
  
  // Добавить новое время
  const newTime = currentTime + sessionTime;
  
  // Сохранить
  await API.setStorage({ youtubeTimeToday: newTime });
  
  // Показать уведомление если превышен лимит
  if (newTime > 15 * 60 * 1000) {
    API.showNotification('Лимит превышен!', {
      message: 'Ты провел слишком много времени на YouTube'
    });
  }
}
```

### Пример 2: Система наград

```javascript
async function awardDiscipline() {
  const data = await API.getStorage(['willpowerScore', 'daysWithoutYouTube']);
  let score = parseInt(data.willpowerScore || '0');
  const days = parseInt(data.daysWithoutYouTube || '0');
  
  // Добавить очки
  score += 5;
  
  // Бонус за неделю
  if (days > 0 && days % 7 === 0) {
    score += 50;
  }
  
  // Сохранить
  await API.setStorage({ willpowerScore: score });
  
  // Уведомить
  API.showNotification('🎌 Награда за дисциплину!', {
    message: `Ты получил +${score} очков чести!`
  });
}
```

### Пример 3: Фоновый сервис

```javascript
// Главный фоновый скрипт
API.onInstalled(async () => {
  console.log('Инициализация...');
  
  // Установить периодическую проверку
  API.setAlarm('dailyCheck', 1440); // Каждый день
  API.setAlarm('hourlyCheck', 60);  // Каждый час
});

// Обработка сигналов
API.onAlarm((alarm) => {
  if (alarm.name === 'dailyCheck') {
    checkAndRewardDiscipline();
  } else if (alarm.name === 'hourlyCheck') {
    syncData();
  }
});
```

## Добавление новых методов

Если нужно добавить новый API метод:

1. Добавьте в модуль `api-compatibility.js`:
```javascript
const API = (() => {
  const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
  
  return {
    // ... существующие методы ...
    
    // Новый метод
    async executeScript(tabId, details) {
      return browserAPI.scripting.executeScript({
        target: { tabId: tabId },
        func: details.func,
        args: details.args
      });
    }
  };
})();
```

2. Используйте везде как `API.executeScript(...)`

## Отладка

### Проверить текущий браузер
```javascript
console.log('Браузер:', API.getBrowser()); // 'chrome' или 'firefox'
```

### Логирование API вызовов
```javascript
const originalSetStorage = API.setStorage;
API.setStorage = async function(data) {
  console.log('Сохранение:', data);
  return originalSetStorage(data);
};
```

## Совместимость

| Функция | Chrome | Firefox |
|---------|--------|---------|
| storage.sync | ✅ | ✅ |
| notifications | ✅ | ✅ |
| alarms | ✅ | ✅ |
| tabs | ✅ | ✅ |
| runtime | ✅ | ✅ |
| permissions | ✅ | ✅ |

## Производительность

API компатибилити слой не вносит практически никаких накладных расходов:
- Он просто выбирает правильный API при загрузке
- Все методы - это прямые вызовы к браузерному API
- Нет промежуточных преобразований или прослоек
