// ===== UI COMPONENTS MODULE =====
// Кастомные модалки и UI элементы

const UIComponents = {
  // Создание кастомной модалки (вместо alert)
  showModal(title, message, type = 'info') {
    // Удаляем предыдущую модалку, если есть
    const existing = document.getElementById('ytb-custom-modal');
    if (existing) existing.remove();

    // Создание модалки
    const modal = document.createElement('div');
    modal.id = 'ytb-custom-modal';
    modal.innerHTML = `
      <div class="ytb-modal-overlay">
        <div class="ytb-modal-content ytb-modal-${type}">
          <div class="ytb-modal-header">
            <h3>${title}</h3>
            <button class="ytb-modal-close">×</button>
          </div>
          <div class="ytb-modal-body">
            <p>${message}</p>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Стили для модалки
    if (!document.getElementById('ytb-modal-styles')) {
      const styles = document.createElement('style');
      styles.id = 'ytb-modal-styles';
      styles.textContent = `
        .ytb-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(5px);
          z-index: 999999;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: ytb-fadeIn 0.3s ease;
        }

        @keyframes ytb-fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .ytb-modal-content {
          background: white;
          border-radius: 15px;
          padding: 0;
          max-width: 500px;
          width: 90%;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
          animation: ytb-slideIn 0.3s ease;
        }

        @keyframes ytb-slideIn {
          from { transform: translateY(-50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .ytb-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #e5e7eb;
        }

        .ytb-modal-header h3 {
          margin: 0;
          font-size: 20px;
          color: #1f2937;
        }

        .ytb-modal-close {
          background: none;
          border: none;
          font-size: 32px;
          color: #6b7280;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          line-height: 1;
          transition: color 0.2s;
        }

        .ytb-modal-close:hover {
          color: #1f2937;
        }

        .ytb-modal-body {
          padding: 20px;
        }

        .ytb-modal-body p {
          margin: 0;
          font-size: 16px;
          line-height: 1.6;
          color: #4b5563;
          white-space: pre-wrap;
        }

        .ytb-modal-info .ytb-modal-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .ytb-modal-info .ytb-modal-header h3 {
          color: white;
        }

        .ytb-modal-info .ytb-modal-close {
          color: white;
        }

        .ytb-modal-warning .ytb-modal-header {
          background: linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%);
        }

        .ytb-modal-warning .ytb-modal-header h3,
        .ytb-modal-warning .ytb-modal-close {
          color: white;
        }

        .ytb-modal-success .ytb-modal-header {
          background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
        }

        .ytb-modal-success .ytb-modal-header h3,
        .ytb-modal-success .ytb-modal-close {
          color: white;
        }
      `;
      document.head.appendChild(styles);
    }

    // Закрытие по клику
    const closeBtn = modal.querySelector('.ytb-modal-close');
    const overlay = modal.querySelector('.ytb-modal-overlay');
    
    const closeModal = () => {
      modal.remove();
    };
    
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });

    // Возвращаем промис для контроля закрытия
    return new Promise((resolve) => {
      const originalClose = closeModal;
      closeModal = () => {
        originalClose();
        resolve();
      };
      
      // Закрытие по Escape
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          closeModal();
          document.removeEventListener('keydown', handleEscape);
        }
      };
      document.addEventListener('keydown', handleEscape);
    });
  },

  // Toast уведомление
  showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `ytb-toast ytb-toast-${type}`;
    toast.textContent = message;

    // Стили для toast
    if (!document.getElementById('ytb-toast-styles')) {
      const styles = document.createElement('style');
      styles.id = 'ytb-toast-styles';
      styles.textContent = `
        .ytb-toast {
          position: fixed;
          bottom: 20px;
          right: 20px;
          padding: 15px 20px;
          border-radius: 10px;
          color: white;
          font-size: 14px;
          font-weight: 500;
          z-index: 1000000;
          animation: ytb-toastIn 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        @keyframes ytb-toastIn {
          from { transform: translateX(400px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        @keyframes ytb-toastOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(400px); opacity: 0; }
        }

        .ytb-toast-info {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .ytb-toast-warning {
          background: linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%);
        }

        .ytb-toast-success {
          background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
        }
      `;
      document.head.appendChild(styles);
    }

    document.body.appendChild(toast);

    // Удаление через duration
    setTimeout(() => {
      toast.style.animation = 'ytb-toastOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  // Создание кнопки закрытия
  createCloseButton(onClickCallback) {
    // Стили для кнопки
    if (!document.getElementById('ytb-close-button-styles')) {
      const styles = document.createElement('style');
      styles.id = 'ytb-close-button-styles';
      styles.textContent = `
        @keyframes ytb-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        .ytb-close-button {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 999998;
          padding: 15px 25px;
          background: linear-gradient(135deg, #ff3333 0%, #ff6b6b 100%);
          color: #fff;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
          box-shadow: 0 4px 15px rgba(255, 51, 51, 0.4);
          animation: ytb-pulse 2s infinite;
          transition: all 0.3s ease;
        }

        .ytb-close-button:hover {
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 6px 20px rgba(255, 51, 51, 0.6);
        }

        .ytb-close-button:active {
          transform: translateY(0) scale(1);
        }
      `;
      document.head.appendChild(styles);
    }

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Закрыть сайт 💥';
    closeButton.className = 'ytb-close-button';
    
    closeButton.addEventListener('click', onClickCallback);
    
    document.body.appendChild(closeButton);
    
    return closeButton;
  },

  // Форматирование времени
  formatTime(milliseconds) {
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
};

// Экспорт для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIComponents;
}
