const DB_NAME = "lubriplan_offline_v1";
const DB_VERSION = 2;

const STORE_ACTIVITIES = "activities";
const STORE_QUEUE = "sync_queue";
const STORE_ATTACHMENTS = "attachments";
const STORE_META = "meta";

function hasIndexedDb() {
  return typeof indexedDB !== "undefined";
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB request failed"));
  });
}

function transactionDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("IndexedDB transaction failed"));
    tx.onabort = () => reject(tx.error || new Error("IndexedDB transaction aborted"));
  });
}

function openDb() {
  return new Promise((resolve, reject) => {
    if (!hasIndexedDb()) {
      reject(new Error("IndexedDB no disponible"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_ACTIVITIES)) {
        const store = db.createObjectStore(STORE_ACTIVITIES, { keyPath: "id" });
        store.createIndex("scopeKey", "scopeKey", { unique: false });
      }

      if (!db.objectStoreNames.contains(STORE_QUEUE)) {
        const store = db.createObjectStore(STORE_QUEUE, { keyPath: "clientActionId" });
        store.createIndex("scopeKey", "scopeKey", { unique: false });
        store.createIndex("status", "status", { unique: false });
      }

      if (!db.objectStoreNames.contains(STORE_ATTACHMENTS)) {
        const store = db.createObjectStore(STORE_ATTACHMENTS, { keyPath: "id" });
        store.createIndex("scopeKey", "scopeKey", { unique: false });
        store.createIndex("executionId", "executionId", { unique: false });
      }

      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("No se pudo abrir IndexedDB"));
  });
}

async function withStore(storeName, mode, runner) {
  const db = await openDb();
  const tx = db.transaction(storeName, mode);
  const store = tx.objectStore(storeName);
  const result = await runner(store, tx);
  await transactionDone(tx);
  db.close();
  return result;
}

async function withStores(storeNames, mode, runner) {
  const db = await openDb();
  const tx = db.transaction(storeNames, mode);
  const stores = Object.fromEntries(storeNames.map((name) => [name, tx.objectStore(name)]));
  const result = await runner(stores, tx);
  await transactionDone(tx);
  db.close();
  return result;
}

export async function upsertActivitiesForScope(scopeKey, items = []) {
  if (!scopeKey || !Array.isArray(items) || items.length === 0) return;

  await withStore(STORE_ACTIVITIES, "readwrite", async (store) => {
    for (const item of items) {
      if (!item || !Number.isFinite(Number(item.id))) continue;
      store.put({ ...item, id: Number(item.id), scopeKey });
    }
  });
}

export async function putActivityForScope(scopeKey, item) {
  if (!scopeKey || !item || !Number.isFinite(Number(item.id))) return;
  await withStore(STORE_ACTIVITIES, "readwrite", async (store) => {
    store.put({ ...item, id: Number(item.id), scopeKey });
  });
}

export async function getActivitiesForScope(scopeKey) {
  if (!scopeKey) return [];

  return withStore(STORE_ACTIVITIES, "readonly", async (store) => {
    const all = await requestToPromise(store.getAll());
    return (Array.isArray(all) ? all : []).filter((item) => item?.scopeKey === scopeKey);
  });
}

export async function getActivityForScope(scopeKey, id) {
  if (!scopeKey || !Number.isFinite(Number(id))) return null;

  return withStore(STORE_ACTIVITIES, "readonly", async (store) => {
    const item = await requestToPromise(store.get(Number(id)));
    if (!item || item.scopeKey !== scopeKey) return null;
    return item;
  });
}

export async function putQueueItem(item) {
  if (!item?.clientActionId) return;
  await withStore(STORE_QUEUE, "readwrite", async (store) => {
    store.put(item);
  });
}

export async function updateQueueItem(clientActionId, patch = {}) {
  if (!clientActionId) return;
  await withStore(STORE_QUEUE, "readwrite", async (store) => {
    const current = await requestToPromise(store.get(clientActionId));
    if (!current) return;
    store.put({ ...current, ...patch });
  });
}

export async function deleteQueueItem(clientActionId) {
  if (!clientActionId) return;
  await withStore(STORE_QUEUE, "readwrite", async (store) => {
    store.delete(clientActionId);
  });
}

export async function putAttachment(item) {
  if (!item?.id) return;
  await withStore(STORE_ATTACHMENTS, "readwrite", async (store) => {
    store.put(item);
  });
}

export async function getAttachment(id) {
  if (!id) return null;
  return withStore(STORE_ATTACHMENTS, "readonly", async (store) => {
    const item = await requestToPromise(store.get(id));
    return item || null;
  });
}

export async function deleteAttachment(id) {
  if (!id) return;
  await withStore(STORE_ATTACHMENTS, "readwrite", async (store) => {
    store.delete(id);
  });
}

export async function getQueueItemsForScope(scopeKey) {
  if (!scopeKey) return [];

  return withStore(STORE_QUEUE, "readonly", async (store) => {
    const all = await requestToPromise(store.getAll());
    return (Array.isArray(all) ? all : [])
      .filter((item) => item?.scopeKey === scopeKey)
      .sort((a, b) => String(a?.createdAt || "").localeCompare(String(b?.createdAt || "")));
  });
}

export async function setMetaValue(key, value) {
  if (!key) return;
  await withStore(STORE_META, "readwrite", async (store) => {
    store.put({ key, value });
  });
}

export async function getMetaValue(key) {
  if (!key) return null;
  return withStore(STORE_META, "readonly", async (store) => {
    const row = await requestToPromise(store.get(key));
    return row?.value ?? null;
  });
}

export async function clearScopeData(scopeKey) {
  if (!scopeKey) return;

  await withStores([STORE_ACTIVITIES, STORE_QUEUE, STORE_ATTACHMENTS], "readwrite", async (stores) => {
    const activityStore = stores[STORE_ACTIVITIES];
    const queueStore = stores[STORE_QUEUE];
    const attachmentStore = stores[STORE_ATTACHMENTS];

    const [activities, queueItems] = await Promise.all([
      requestToPromise(activityStore.getAll()),
      requestToPromise(queueStore.getAll()),
    ]);
    const attachments = await requestToPromise(attachmentStore.getAll());

    for (const item of Array.isArray(activities) ? activities : []) {
      if (item?.scopeKey === scopeKey) activityStore.delete(item.id);
    }

    for (const item of Array.isArray(queueItems) ? queueItems : []) {
      if (item?.scopeKey === scopeKey) queueStore.delete(item.clientActionId);
    }

    for (const item of Array.isArray(attachments) ? attachments : []) {
      if (item?.scopeKey === scopeKey) attachmentStore.delete(item.id);
    }
  });
}
