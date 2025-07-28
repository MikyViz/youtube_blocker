const messages = [
  "Ты правда уверен, что это нужно?",
  "А как насчёт твоих целей?",
  "YouTube затягивает... сопротивляйся!",
  "Ты же обещал себе не заходить сюда!",
  "Закрой вкладку и будь молодцом!"
];

let i = 0;
function showModal() {
  if (i < messages.length) {
    alert(messages[i]);
    i++;
    setTimeout(showModal, 1500);
  }
}

showModal();

// Создание стилей анимации
const style = document.createElement('style');
style.textContent = `
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}
.pulse-button {
  animation: pulse 1s infinite;
}
`;
document.head.appendChild(style);

// Создание кнопки
const closeButton = document.createElement("button");
closeButton.textContent = "Закрыть сайт 💥";
closeButton.classList.add("pulse-button");

Object.assign(closeButton.style, {
  position: "fixed",
  top: "20px",
  right: "20px",
  zIndex: "9999",
  padding: "10px 20px",
  backgroundColor: "#ff3333",
  color: "#fff",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  fontSize: "16px"
});

document.body.appendChild(closeButton);

// Обработка клика
closeButton.addEventListener("click", () => {
  window.location.href = "about:blank";
});


document.body.appendChild(closeButton);

let score = localStorage.getItem("willpowerScore") || 0;

closeButton.addEventListener("click", () => {
  score++;
  localStorage.setItem("willpowerScore", score);
  alert(`+1 Очко силы! 🏆 Сейчас у тебя ${score} очков.`);
  window.location.href = "about:blank";
});