export type NetworkStatusListener = (offline: boolean) => void;

let offline = false;
const listeners = new Set<NetworkStatusListener>();

export function isNetworkOffline(): boolean {
  return offline;
}

export function subscribeNetworkStatus(listener: NetworkStatusListener): () => void {
  listeners.add(listener);
  listener(offline);

  return () => listeners.delete(listener);
}

export function setNetworkOffline(nextOffline: boolean): void {
  if (offline === nextOffline) return;
  offline = nextOffline;
  listeners.forEach((listener) => listener(offline));
}

export function resetNetworkStatusForTests(): void {
  offline = false;
  listeners.clear();
}
