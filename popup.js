document.addEventListener('DOMContentLoaded', async () => {
  const loadingElement = document.getElementById('loading');
  const bookmarkTreeContainer = document.getElementById('bookmarkTree');

  try {
    // Get the entire bookmark tree
    const bookmarkTree = await chrome.bookmarks.getTree();
    
    // Process and display the bookmark tree
    bookmarkTree[0].children.forEach(folder => {
      displayBookmarkNode(folder, bookmarkTreeContainer);
    });

    loadingElement.style.display = 'none';
  } catch (error) {
    loadingElement.textContent = 'Error loading bookmarks: ' + error.message;
  }
});

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