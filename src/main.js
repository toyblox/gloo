import { readText, writeText } from "@tauri-apps/plugin-clipboard-manager";
import { listen } from "@tauri-apps/api/event";
import { getSnippets, saveSnippet, deleteSnippet } from "./db.js";
import {
  addToHistory,
  filterHistory,
  filterSnippets,
  getFoldersFromSnippets,
  truncateLabel,
} from "./logic.js";

const MAX_HISTORY = 50;
let history = [];
let snippets = [];
let activeTab = "history";
let activeFolder = "All";
let lastText = "";
let editingSnippet = null;

const itemList = document.getElementById("item-list");
const emptyState = document.getElementById("empty-state");
const searchInput = document.getElementById("search");
const folderSidebar = document.getElementById("folder-sidebar");
const snippetEditor = document.getElementById("snippet-editor");

// --- Clipboard watcher ---

async function startClipboardWatcher() {
  setInterval(async () => {
    try {
      const text = await readText();
      if (text && text !== lastText) {
        lastText = text;
        history = addToHistory(history, text, MAX_HISTORY);
        if (activeTab === "history") renderList();
      }
    } catch (e) {
      console.error("clipboard read error:", e);
    }
  }, 500);
}

// --- Render ---

function renderList() {
  const query = searchInput.value.toLowerCase();

  if (activeTab === "history") {
    folderSidebar.style.display = "none";
    renderItems(filterHistory(history, query), (item) => item.text, (item) => pasteItem(item.text));
  } else {
    folderSidebar.style.display = "flex";
    renderFolderSidebar();
    renderItems(
      filterSnippets(snippets, activeFolder, query),
      (s) => s.name,
      (s) => pasteItem(s.content),
      true
    );
  }
}

function renderItems(items, labelFn, clickFn, showActions = false) {
  itemList.innerHTML = "";
  emptyState.style.display = items.length === 0 ? "flex" : "none";

  items.forEach((item, index) => {
    const li = document.createElement("li");
    li.className = "clip-item" + (index === 0 ? " selected" : "");

    const span = document.createElement("span");
    span.className = "clip-label";
    const label = labelFn(item);
    span.textContent = truncateLabel(label);
    span.title = label;
    li.appendChild(span);

    if (showActions) {
      const actions = document.createElement("div");
      actions.className = "clip-actions";
      const editBtn = document.createElement("button");
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", (e) => { e.stopPropagation(); openEditor(item); });
      const delBtn = document.createElement("button");
      delBtn.textContent = "Delete";
      delBtn.addEventListener("click", (e) => { e.stopPropagation(); removeSnippet(item.id); });
      actions.appendChild(editBtn);
      actions.appendChild(delBtn);
      li.appendChild(actions);
    }

    li.addEventListener("click", () => clickFn(item));
    itemList.appendChild(li);
  });
}

function renderFolderSidebar() {
  folderSidebar.innerHTML = "";
  getFoldersFromSnippets(snippets).forEach((folder) => {
    const btn = document.createElement("button");
    btn.className = "folder-btn" + (folder === activeFolder ? " active" : "");
    btn.textContent = folder;
    btn.addEventListener("click", () => { activeFolder = folder; renderList(); });
    folderSidebar.appendChild(btn);
  });

  const addBtn = document.createElement("button");
  addBtn.className = "folder-btn new-snippet-btn";
  addBtn.textContent = "+ New";
  addBtn.addEventListener("click", () => openEditor(null));
  folderSidebar.appendChild(addBtn);
}

// --- Snippet editor ---

function openEditor(snippet) {
  editingSnippet = snippet;
  document.getElementById("editor-name").value = snippet?.name ?? "";
  document.getElementById("editor-folder").value = snippet?.folder ?? "General";
  document.getElementById("editor-content").value = snippet?.content ?? "";
  snippetEditor.style.display = "flex";
}

function closeEditor() {
  snippetEditor.style.display = "none";
  editingSnippet = null;
}

document.getElementById("editor-save").addEventListener("click", async () => {
  const name = document.getElementById("editor-name").value.trim();
  const folder = document.getElementById("editor-folder").value.trim() || "General";
  const content = document.getElementById("editor-content").value;
  if (!name || !content) return;
  await saveSnippet({ id: editingSnippet?.id, folder, name, content });
  snippets = await getSnippets();
  closeEditor();
  renderList();
});

document.getElementById("editor-cancel").addEventListener("click", closeEditor);

async function removeSnippet(id) {
  await deleteSnippet(id);
  snippets = await getSnippets();
  renderList();
}

// --- Paste ---

async function pasteItem(text) {
  await writeText(text);
  // TODO Phase 4: simulate Cmd+V after hiding window
}

// --- Tabs ---

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    activeTab = tab.dataset.tab;
    closeEditor();
    renderList();
  });
});

searchInput.addEventListener("input", renderList);

listen("tauri://focus", async () => {
  searchInput.value = "";
  searchInput.focus();
  if (activeTab === "snippets") snippets = await getSnippets();
  renderList();
});

async function init() {
  snippets = await getSnippets();
  startClipboardWatcher();
  renderList();
}

init();
