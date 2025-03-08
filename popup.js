const KEYS = Object.freeze({
  ArrowDown: "ArrowDown",
  ArrowUp: "ArrowUp",
  Enter: "Enter",
});
const EVENT_TYPE = Object.freeze({
  DOMContentLoaded: "DOMContentLoaded",
  input: "input",
  keydown: "keydown",
  click: "click",
});

document.addEventListener(EVENT_TYPE.DOMContentLoaded, async () => {
  const loadingElement = document.getElementById("loading");
  const bookmarkTreeContainer = document.getElementById("bookmarkTree");
  const searchInput = document.getElementById("searchInput");

  try {
    const bookmarks = await getBookmarks();

    for (bookmark of bookmarks) {
      displayBookmark(bookmark, bookmarkTreeContainer);
    }

    // Add search functionality
    searchInput.addEventListener(EVENT_TYPE.input, (e) => {
      const searchTerms = e.target.value.toLowerCase().split(" ");
      filterBookmarks(searchTerms);
      // Select first visible item after filtering
      selectFirstVisibleBookmark();
    });

    // Handle keyboard navigation
    searchInput.addEventListener(EVENT_TYPE.keydown, (e) => {
      const visibleBookmarks = Array.from(
        document.querySelectorAll(".bookmark-item:not(.hidden)"),
      );
      if (visibleBookmarks.length === 0) {
        const value = searchInput.value;
        if (e.key === KEYS.Enter && value) {
          openURL(`https://www.google.com/search?q=${value}`);
        }
        return;
      }

      const currentSelected = document.querySelector(".bookmark-item.selected");
      const currentIndex = currentSelected
        ? visibleBookmarks.indexOf(currentSelected)
        : -1;

      switch (e.key) {
        case KEYS.ArrowDown:
          e.preventDefault();
          if (currentIndex < visibleBookmarks.length - 1) {
            selectBookmark(visibleBookmarks[currentIndex + 1]);
          }
          break;

        case KEYS.ArrowUp:
          e.preventDefault();
          if (currentIndex > 0) {
            selectBookmark(visibleBookmarks[currentIndex - 1]);
          } else if (currentIndex === 0) {
            scrollToTop();
          }
          break;

        case KEYS.Enter:
          e.preventDefault();
          const selectedBookmark = document.querySelector(
            ".bookmark-item.selected",
          );
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

    loadingElement.style.display = "none";
  } catch (error) {
    loadingElement.textContent = "Error loading bookmarks: " + error.message;
  }
});

function selectFirstVisibleBookmark() {
  const firstVisible = document.querySelector(".bookmark-item:not(.hidden)");
  if (!firstVisible) {
    return;
  }

  selectBookmark(firstVisible);
  scrollToTop();
}

function selectBookmark(bookmarkElement) {
  // Remove selection from previously selected bookmark
  const previouslySelected = document.querySelector(".bookmark-item.selected");
  if (previouslySelected) {
    previouslySelected.classList.remove("selected");
  }

  // Add selection to new bookmark
  bookmarkElement.classList.add("selected");

  // Ensure the selected item is visible in the viewport
  bookmarkElement.scrollIntoView({ block: "nearest" });
}

function filterBookmarks(searchTerms) {
  const bookmarkItems = document.querySelectorAll(".bookmark-item");

  for (item of bookmarkItems) {
    const title = item
      .querySelector(".bookmark-title")
      .textContent.toLowerCase();
    const url = item.dataset.url ? item.dataset.url.toLowerCase() : "";

    if (
      searchTerms.length === 0 ||
      isEligible(title, searchTerms) ||
      isEligible(url, searchTerms)
    ) {
      item.classList.remove("hidden");
    } else {
      item.classList.add("hidden");
    }
  }
}

// Data utils

function isEligible(text, searchTerms) {
  return searchTerms.every((term) => text.includes(term));
}

async function getBookmarks() {
  const bookmarks = [];

  const bookmarkTree = await chrome.bookmarks.getTree();
  for (child of bookmarkTree[0].children) {
    processNode(child, "", 0);
  }

  function processNode(node, prefix, level) {
    const SEPARATOR = " => ";
    if (node.children) {
      // NOTE this is a folder
      for (child of node.children) {
        let newPrefix = "";
        if (level > 0) {
          if (prefix) {
            newPrefix = `${prefix}${SEPARATOR}${node.title}`;
          } else {
            newPrefix = node.title;
          }
        }
        processNode(child, newPrefix, level + 1);
      }
    } else if (node.url) {
      // NOTE this is a bookmark
      bookmarks.push({
        title:
          (prefix ? `${prefix}${SEPARATOR}` : "") + (node.title || node.url),
        url: node.url,
      });
    }
  }

  return bookmarks;
}

// UI utils

function displayBookmark({ title, url }, container) {
  const bookmarkEl = document.createElement("div");
  bookmarkEl.className = "bookmark-item";
  bookmarkEl.dataset.url = url; // Store URL for search
  bookmarkEl.addEventListener(EVENT_TYPE.click, () => openURL(url));

  const titleEl = document.createElement("div");
  titleEl.className = "bookmark-title";
  titleEl.textContent = title;

  bookmarkEl.appendChild(titleEl);
  container.appendChild(bookmarkEl);
}

function openURL(url) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.update(tabs[0].id, { url });
  });
}

function scrollToTop() {
  window.scrollTo(0, 0);
}
