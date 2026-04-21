import { describe, it, expect, vi } from "vitest";
import {
  addToHistory,
  filterHistory,
  filterSnippets,
  getFoldersFromSnippets,
  truncateLabel,
  TRUNCATE_LEN,
} from "./logic.js";

vi.useFakeTimers();

describe("addToHistory", () => {
  it("prepends new text to history", () => {
    const result = addToHistory([], "hello", 50);
    expect(result[0].text).toBe("hello");
  });

  it("deduplicates — moves existing text to top", () => {
    const history = [{ text: "a" }, { text: "b" }, { text: "c" }];
    const result = addToHistory(history, "b", 50);
    expect(result.map((i) => i.text)).toEqual(["b", "a", "c"]);
  });

  it("trims to maxHistory", () => {
    const history = Array.from({ length: 5 }, (_, i) => ({ text: String(i) }));
    const result = addToHistory(history, "new", 5);
    expect(result).toHaveLength(5);
    expect(result[0].text).toBe("new");
    expect(result[4].text).toBe("3");
  });

  it("stamps copiedAt", () => {
    vi.setSystemTime(1000);
    const result = addToHistory([], "x", 50);
    expect(result[0].copiedAt).toBe(1000);
  });
});

describe("filterHistory", () => {
  const history = [{ text: "hello world" }, { text: "foo bar" }, { text: "Hello Again" }];

  it("returns all items when query is empty", () => {
    expect(filterHistory(history, "")).toHaveLength(3);
  });

  it("filters case-insensitively", () => {
    const result = filterHistory(history, "hello");
    expect(result).toHaveLength(2);
    expect(result.map((i) => i.text)).toContain("Hello Again");
  });

  it("returns empty array when nothing matches", () => {
    expect(filterHistory(history, "zzz")).toHaveLength(0);
  });
});

describe("filterSnippets", () => {
  const snippets = [
    { id: 1, folder: "Work", name: "Email sign-off", content: "Best regards" },
    { id: 2, folder: "Work", name: "Standup template", content: "Yesterday I..." },
    { id: 3, folder: "Personal", name: "Address", content: "123 Main St" },
  ];

  it("returns all snippets for folder All", () => {
    expect(filterSnippets(snippets, "All", "")).toHaveLength(3);
  });

  it("filters by folder", () => {
    const result = filterSnippets(snippets, "Work", "");
    expect(result).toHaveLength(2);
    expect(result.every((s) => s.folder === "Work")).toBe(true);
  });

  it("searches name and content", () => {
    expect(filterSnippets(snippets, "All", "regards")).toHaveLength(1);
    expect(filterSnippets(snippets, "All", "template")).toHaveLength(1);
  });

  it("combines folder filter and search", () => {
    expect(filterSnippets(snippets, "Work", "address")).toHaveLength(0);
    expect(filterSnippets(snippets, "Personal", "address")).toHaveLength(1);
  });
});

describe("getFoldersFromSnippets", () => {
  it("always starts with All", () => {
    const result = getFoldersFromSnippets([{ folder: "Work" }]);
    expect(result[0]).toBe("All");
  });

  it("deduplicates folders", () => {
    const snippets = [{ folder: "Work" }, { folder: "Work" }, { folder: "Personal" }];
    const result = getFoldersFromSnippets(snippets);
    expect(result).toEqual(["All", "Work", "Personal"]);
  });

  it("returns only All for empty snippets", () => {
    expect(getFoldersFromSnippets([])).toEqual(["All"]);
  });
});

describe("truncateLabel", () => {
  it("leaves short text unchanged", () => {
    expect(truncateLabel("short")).toBe("short");
  });

  it("truncates at TRUNCATE_LEN and appends ellipsis", () => {
    const long = "a".repeat(TRUNCATE_LEN + 10);
    const result = truncateLabel(long);
    expect(result).toHaveLength(TRUNCATE_LEN + 1); // +1 for the ellipsis char
    expect(result.endsWith("…")).toBe(true);
  });

  it("respects custom maxLen", () => {
    const result = truncateLabel("hello world", 5);
    expect(result).toBe("hello…");
  });
});
