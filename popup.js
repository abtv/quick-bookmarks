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
  searchInput.focus();

  try {
    const bookmarks = await getBookmarks();
    for (const bookmark of bookmarks) {
      addItem(bookmark, "bookmark-item", bookmarkTreeContainer);
    }

    selectFirstVisibleBookmark();

    loadingElement.style.display = "none";
  } catch (error) {
    loadingElement.textContent = "Error loading bookmarks: " + error.message;
  }

  searchInput.addEventListener(EVENT_TYPE.input, (e) => {
    const text = e.target.value;
    filterBookmarks(text);
    selectFirstVisibleBookmark();
  });

  searchInput.addEventListener(EVENT_TYPE.keydown, (e) => {
    const visibleBookmarks = Array.from(
      document.querySelectorAll(".bookmark-item:not(.hidden)"),
    );

    const currentSelected = document.querySelector(".bookmark-item.selected");
    const currentIndex = currentSelected
      ? visibleBookmarks.indexOf(currentSelected)
      : -1;

    if (currentIndex < 0) {
      return;
    }

    switch (e.key) {
      case KEYS.ArrowDown:
        e.preventDefault();
        if (currentIndex < visibleBookmarks.length - 1) {
          selectBookmark(visibleBookmarks[currentIndex + 1]);
        } else {
          selectBookmark(visibleBookmarks[0]);
        }
        break;

      case KEYS.ArrowUp:
        e.preventDefault();
        if (currentIndex > 0) {
          selectBookmark(visibleBookmarks[currentIndex - 1]);
        } else {
          selectBookmark(visibleBookmarks[visibleBookmarks.length - 1]);
        }

        break;

      case KEYS.Enter:
        e.preventDefault();
        const openInNewTab = e.ctrlKey || e.metaKey || e.shiftKey;
        const selectedBookmark = document.querySelector(
          ".bookmark-item.selected",
        );
        if (selectedBookmark) {
          openURL(selectedBookmark.dataset.url, openInNewTab);
        }
        break;
    }
  });
});

function selectFirstVisibleBookmark() {
  const firstVisible = document.querySelector(".bookmark-item:not(.hidden)");
  if (!firstVisible) {
    return;
  }

  selectBookmark(firstVisible);
}

function selectBookmark(bookmarkElement) {
  // NOTE Remove selection from previously selected bookmark
  const previouslySelected = document.querySelector(".bookmark-item.selected");
  if (previouslySelected) {
    previouslySelected.classList.remove("selected");
  }

  // NOTE Add selection to new bookmark
  bookmarkElement.classList.add("selected");
  bookmarkElement.scrollIntoView({ block: "center" });
}

function filterBookmarks(searchText) {
  const searchTerms = searchText.toLowerCase().split(" ");

  const bookmarkItems = document.querySelectorAll(".bookmark-item");
  for (const item of bookmarkItems) {
    const title = item.dataset.titleLowerCase || "";
    const url = item.dataset.urlLowerCase || "";

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

/*
Data utils
*/
function isEligible(text, searchTerms) {
  return searchTerms.every((term) => text.includes(term));
}

async function getBookmarks() {
  const bookmarks = [];

  const bookmarkTree = await chrome.bookmarks.getTree();
  for (const child of bookmarkTree[0].children) {
    processNode(child, "", 0);
  }

  function processNode(node, prefix, level) {
    const SEPARATOR = " => ";
    if (node.children) {
      // NOTE this is a folder
      for (const child of node.children) {
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
      const title =
        (prefix ? `${prefix}${SEPARATOR}` : "") + (node.title || node.url);
      bookmarks.push({
        title: title,
        url: node.url,
      });
    }
  }

  return bookmarks;
}

/*
UI utils
*/
function addItem({ title, url }, className, container) {
  const titleEl = document.createElement("div");
  titleEl.className = "bookmark-title";
  titleEl.textContent = title;

  const bookmarkEl = document.createElement("div");
  bookmarkEl.className = className;
  bookmarkEl.dataset.url = url;
  bookmarkEl.dataset.urlLowerCase = url.toLowerCase();
  bookmarkEl.dataset.titleLowerCase = title.toLowerCase();
  bookmarkEl.addEventListener(EVENT_TYPE.click, () => openURL(url, false));

  bookmarkEl.appendChild(titleEl);
  container.appendChild(bookmarkEl);
}

function openURL(url, openInNewTab) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (openInNewTab) {
      chrome.tabs.create({ url, active: false });
    } else {
      chrome.tabs.update(tabs[0].id, { url });
    }
  });
}
