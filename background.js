chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({
    url: 'fullscreen.html'
  });
}); 