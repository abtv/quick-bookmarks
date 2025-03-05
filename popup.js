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
    });

    // Handle Enter key
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const firstVisibleBookmark = document.querySelector('.bookmark-item:not(.hidden)');
        if (firstVisibleBookmark) {
          const url = firstVisibleBookmark.dataset.url;
          chrome.tabs.create({ url });
        }
      }
    });

    // Focus search input
    searchInput.focus();

    loadingElement.style.display = 'none';
  } catch (error) {
    loadingElement.textContent = 'Error loading bookmarks: ' + error.message;
  }
});

function filterBookmarks(searchTerm) {
  const bookmarkItems = document.querySelectorAll('.bookmark-item');
  const bookmarkFolders = document.querySelectorAll('.bookmark-folder');
  
  // Reset visibility of all folders
  bookmarkFolders.forEach(folder => {
    folder.classList.add('hidden');
  });

  // Filter bookmarks
  let hasVisibleBookmarks = false;
  bookmarkItems.forEach(item => {
    const title = item.querySelector('.bookmark-title').textContent.toLowerCase();
    const url = item.dataset.url ? item.dataset.url.toLowerCase() : '';
    
    if (searchTerm === '' || title.includes(searchTerm) || url.includes(searchTerm)) {
      item.classList.remove('hidden');
      // Show parent folders of matching bookmarks
      let parent = item.parentElement;
      while (parent) {
        if (parent.classList.contains('bookmark-folder')) {
          parent.classList.remove('hidden');
        }
        parent = parent.parentElement;
      }
      hasVisibleBookmarks = true;
    } else {
      item.classList.add('hidden');
    }
  });
}

function displayBookmarkNode(node, container) {
  if (node.children) {
    // This is a folder
    const folderElement = document.createElement('div');
    folderElement.className = 'bookmark-folder';
    
    const folderHeader = document.createElement('div');
    folderHeader.className = 'folder-header';
    
    const folderIcon = document.createElement('span');
    folderIcon.className = 'folder-icon';
    folderIcon.textContent = '📁';
    
    const folderTitle = document.createElement('h2');
    folderTitle.textContent = node.title || 'Unnamed Folder';
    
    folderHeader.appendChild(folderIcon);
    folderHeader.appendChild(folderTitle);
    
    const bookmarkList = document.createElement('div');
    bookmarkList.className = 'bookmark-list';
    
    // Process children
    node.children.forEach(child => {
      displayBookmarkNode(child, bookmarkList);
    });
    
    folderElement.appendChild(folderHeader);
    folderElement.appendChild(bookmarkList);
    container.appendChild(folderElement);
  } else {
    // This is a bookmark
    const bookmarkElement = document.createElement('div');
    bookmarkElement.className = 'bookmark-item';
    bookmarkElement.dataset.url = node.url; // Store URL for search
    bookmarkElement.addEventListener('click', () => {
      chrome.tabs.create({ url: node.url });
    });

    const favicon = document.createElement('img');
    favicon.className = 'bookmark-favicon';
    favicon.src = `chrome://favicon/size/16@2x/${node.url}`;
    favicon.alt = '';

    const title = document.createElement('div');
    title.className = 'bookmark-title';
    title.textContent = node.title || node.url;

    bookmarkElement.appendChild(favicon);
    bookmarkElement.appendChild(title);
    container.appendChild(bookmarkElement);
  }
} 