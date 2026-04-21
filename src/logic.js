export const TRUNCATE_LEN = 100;

export function addToHistory(history, text, maxHistory) {
  const deduped = history.filter((item) => item.text !== text);
  const next = [{ text, copiedAt: Date.now() }, ...deduped];
  return next.length > maxHistory ? next.slice(0, maxHistory) : next;
}

export function filterHistory(history, query) {
  if (!query) return history;
  const q = query.toLowerCase();
  return history.filter((item) => item.text.toLowerCase().includes(q));
}

export function filterSnippets(snippets, folder, query) {
  const inFolder = folder === "All" ? snippets : snippets.filter((s) => s.folder === folder);
  if (!query) return inFolder;
  const q = query.toLowerCase();
  return inFolder.filter(
    (s) => s.name.toLowerCase().includes(q) || s.content.toLowerCase().includes(q)
  );
}

export function getFoldersFromSnippets(snippets) {
  return ["All", ...new Set(snippets.map((s) => s.folder))];
}

export function truncateLabel(text, maxLen = TRUNCATE_LEN) {
  return text.length > maxLen ? text.slice(0, maxLen) + "…" : text;
}
