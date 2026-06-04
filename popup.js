const toggle = document.getElementById('toggle');
const dot    = document.getElementById('dot');

// Получаем текущее состояние из активной вкладки
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tabId = tabs[0]?.id;
  if (!tabId) return;

  chrome.tabs.sendMessage(tabId, { type: 'GET_STATE' }, (res) => {
    const on = res?.enabled ?? true;
    toggle.checked = on;
    dot.className = 'dot' + (on ? '' : ' off');
  });

  toggle.addEventListener('change', () => {
    const on = toggle.checked;
    dot.className = 'dot' + (on ? '' : ' off');
    chrome.tabs.sendMessage(tabId, { type: 'TOGGLE', value: on });
  });
});
