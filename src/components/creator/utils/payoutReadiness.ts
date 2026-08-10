const KEY = 'aoin_creator_payout_ready_v1';

export function getPayoutReady(): boolean {
  try {
    return window.localStorage.getItem(KEY) === 'true';
  } catch {
    return false;
  }
}

export function setPayoutReady(value: boolean): void {
  try {
    window.localStorage.setItem(KEY, value ? 'true' : 'false');
  } catch {
    // ignore
  }
}

