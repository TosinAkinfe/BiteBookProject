import { fetchCurrentUser, getAuthMode } from "./auth";

const SEARCH_HISTORY_LIMIT = 10;
const GUEST_HISTORY_KEY = "bitebook_guest_search_history";

function normalizeTerm(term: string) {
  return term.trim().replace(/\s+/g, " ");
}

function serializeKey(term: string) {
  return normalizeTerm(term).toLowerCase();
}

function getGuestHistoryKey() {
  return GUEST_HISTORY_KEY;
}

async function getUserHistoryKey() {
  const user = await fetchCurrentUser();
  if (!user?.id) {
    return null;
  }

  return `bitebook_user_search_history_${user.id}`;
}

function readHistory(key: string) {
  try {
    const raw = localStorage.getItem(key) || sessionStorage.getItem(key);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((entry) => typeof entry === "string");
  } catch {
    return [];
  }
}

function writeHistory(key: string, values: string[], sessionOnly: boolean) {
  const payload = JSON.stringify(values.slice(0, SEARCH_HISTORY_LIMIT));
  if (sessionOnly) {
    sessionStorage.setItem(key, payload);
    return;
  }

  localStorage.setItem(key, payload);
}

export async function getSearchHistory() {
  const mode = getAuthMode();

  if (mode === "guest") {
    return readHistory(getGuestHistoryKey());
  }

  const userKey = await getUserHistoryKey();
  if (!userKey) {
    return [];
  }

  return readHistory(userKey);
}

export async function addSearchHistory(term: string) {
  const normalized = normalizeTerm(term);
  if (!normalized) return;

  const mode = getAuthMode();
  const sessionOnly = mode === "guest";
  const key = sessionOnly ? getGuestHistoryKey() : await getUserHistoryKey();

  if (!key) {
    return;
  }

  const existing = readHistory(key);
  const next = [
    normalized,
    ...existing.filter(
      (entry) => serializeKey(entry) !== serializeKey(normalized),
    ),
  ].slice(0, SEARCH_HISTORY_LIMIT);

  writeHistory(key, next, sessionOnly);
}

export async function clearSearchHistory() {
  const mode = getAuthMode();

  if (mode === "guest") {
    sessionStorage.removeItem(getGuestHistoryKey());
    return;
  }

  const userKey = await getUserHistoryKey();
  if (!userKey) {
    return;
  }

  localStorage.removeItem(userKey);
}
