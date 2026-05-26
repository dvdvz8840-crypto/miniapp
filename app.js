const tg = window.Telegram.WebApp;

tg.ready();

const btn = document.getElementById("btn");

btn.onclick = () => {
  tg.showAlert("Работает");
};