document.addEventListener('DOMContentLoaded', async () => {
  const loadingElement = document.getElementById('loading');
  const bookmarkTreeContainer = document.getElementById('bookmarkTree');
  const searchInput = document.getElementById('searchInput');

  try {
    // Get the entire bookmark tree
    const bookmarkTree = await chrome.bookmarks.getTree();
    
    // Process and display the bookmark tree
    bookmarkTree[0].children.forEach(folder => {
      displayBookmarkNode(folder, bookmarkTreeContainer);
    });

    // Add search functionality
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      filterBookmarks(searchTerm);
      // Select first visible item after filtering
      selectFirstVisibleBookmark();
    });

    // Handle keyboard navigation
    searchInput.addEventListener('keydown', (e) => {
      const visibleBookmarks = Array.from(document.querySelectorAll('.bookmark-item:not(.hidden)'));
      if (visibleBookmarks.length === 0) return;

      const currentSelected = document.querySelector('.bookmark-item.selected');
      const currentIndex = currentSelected ? visibleBookmarks.indexOf(currentSelected) : -1;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex < visibleBookmarks.length - 1) {
            selectBookmark(visibleBookmarks[currentIndex + 1]);
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) {
            selectBookmark(visibleBookmarks[currentIndex - 1]);
          }
          break;

        case 'Enter':
          e.preventDefault();
          const selectedBookmark = document.querySelector('.bookmark-item.selected');
          if (selectedBookmark) {
            const url = selectedBookmark.dataset.url;
            // Replace current tab with the selected bookmark
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              chrome.tabs.update(tabs[0].id, { url });
            });
          }
          break;
      }
    });

    // Focus search input and select first bookmark
    searchInput.focus();
    selectFirstVisibleBookmark();

    loadingElement.style.display = 'none';
  } catch (error) {
    loadingElement.textContent = 'Error loading bookmarks: ' + error.message;
  }
});

function selectFirstVisibleBookmark() {
  const firstVisible = document.querySelector('.bookmark-item:not(.hidden)');
  if (firstVisible) {
    selectBookmark(firstVisible);
  }
}

function selectBookmark(bookmarkElement) {
  // Remove selection from previously selected bookmark
  const previouslySelected = document.querySelector('.bookmark-item.selected');
  if (previouslySelected) {
    previouslySelected.classList.remove('selected');
  }
  
  // Add selection to new bookmark
  bookmarkElement.classList.add('selected');
  
  // Ensure the selected item is visible in the viewport
  bookmarkElement.scrollIntoView({ block: 'nearest' });
}

function filterBookmarks(searchTerm) {
  const bookmarkItems = document.querySelectorAll('.bookmark-item');
  
  // Filter bookmarks
  bookmarkItems.forEach(item => {
    const title = item.querySelector('.bookmark-title').textContent.toLowerCase();
    const url = item.dataset.url ? item.dataset.url.toLowerCase() : '';
    
    if (searchTerm === '' || title.includes(searchTerm) || url.includes(searchTerm)) {
      item.classList.remove('hidden');
    } else {
      item.classList.add('hidden');
    }
  });
}

function displayBookmarkNode(node, container) {
  if (node.children) {
    // If it's a folder, just process its children
    node.children.forEach(child => {
      displayBookmarkNode(child, container);
    });
  } else if (node.url) {
    // This is a bookmark
    const bookmarkElement = document.createElement('div');
    bookmarkElement.className = 'bookmark-item';
    bookmarkElement.dataset.url = node.url; // Store URL for search
    bookmarkElement.addEventListener('click', () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.update(tabs[0].id, { url: node.url });
      });
    });

    const favicon = document.createElement('img');
    favicon.className = 'bookmark-favicon';
    favicon.src = `chrome://favicon/size/16/${node.url}`;
    favicon.alt = '';
    favicon.onerror = () => {
      favicon.src = 'chrome://favicon/size/16';
    };

    const title = document.createElement('div');
    title.className = 'bookmark-title';
    title.textContent = node.title || node.url;

    bookmarkElement.appendChild(favicon);
    bookmarkElement.appendChild(title);
    container.appendChild(bookmarkElement);
  }
} 