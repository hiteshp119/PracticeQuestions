import { useEffect, useState } from 'preact/hooks';
import type { Index } from '../lib/types';
import { resetAll, setSettings, useAppState } from '../lib/store';
import { connect, disconnect, getToken, onSyncStatus, syncNow, type SyncStatus } from '../lib/sync';

function statusText(s: SyncStatus): string {
  switch (s.kind) {
    case 'off': return 'Not connected. Progress is saved on this device only.';
    case 'syncing': return 'Syncing…';
    case 'ok': return `Synced ${new Date(s.at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}.`;
    case 'offline': return 'Offline. Will sync when you reconnect.';
    case 'error': return s.message;
  }
}

export function Settings({ index }: { index: Index }) {
  const state = useAppState();
  const [sync, setSync] = useState<SyncStatus>({ kind: 'off' });
  const [token, setToken] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const connected = !!getToken();
  useEffect(() => { const off = onSyncStatus(setSync); return () => { off(); }; }, []);

  const chosen = new Set(state.settings.qotdChapters);
  const toggleCh = (id: string) => {
    const next = new Set(chosen); next.has(id) ? next.delete(id) : next.add(id);
    setSettings({ qotdChapters: [...next] });
  };

  return (
    <>
      <div class="page-head"><h1>Settings</h1></div>

      <section class="panel">
        <h2 style="margin:0;font-size:18px">Sync across devices</h2>
        <p class="muted" style="margin:0;font-size:14px;line-height:1.5">
          Progress and notes are stored in one private GitHub Gist. The token stays on this device and is never shared.
        </p>
        <p role="status" style="margin:0;font-size:14px" class={sync.kind === 'error' ? 'error' : ''}>{statusText(sync)}</p>
        {connected ? (
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn primary" onClick={() => syncNow()}>Sync now</button>
            <button class="btn" onClick={disconnect}>Disconnect this device</button>
          </div>
        ) : (
          <form style="display:flex;flex-direction:column;gap:8px" onSubmit={(e) => { e.preventDefault(); if (token.trim()) connect(token); }}>
            <label for="gist-token" style="font-size:14px;font-weight:500">GitHub token with the "gist" permission</label>
            <div class="answer-row">
              <input id="gist-token" type="password" autoComplete="off" placeholder="ghp_… or github_pat_…" value={token} onInput={(e) => setToken((e.target as HTMLInputElement).value)} />
              <button class="btn primary" type="submit">Connect</button>
            </div>
            <ol class="muted" style="margin:0;padding-left:1.2em;font-size:13px;line-height:1.6">
              <li>On GitHub: Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token.</li>
              <li>Tick only <b>gist</b>, set no expiry or a long one, generate, and copy it.</li>
              <li>Paste it here. Do the same once on your other device.</li>
            </ol>
          </form>
        )}
      </section>

      <section class="panel">
        <h2 style="margin:0;font-size:18px">Question of the day</h2>
        <p class="muted" style="margin:0;font-size:14px">Pick from these chapters only. Leave all off to use every chapter.</p>
        <div class="chips">
          {index.books.flatMap((b) => b.chapters.filter((c) => c.available).map((c) => {
            const id = `${b.id}:${c.n}`;
            return <button key={id} type="button" class={`btn ${chosen.has(id) ? 'primary' : ''}`} style="height:38px;font-size:14px" aria-pressed={chosen.has(id)} onClick={() => toggleCh(id)}>{c.title}</button>;
          }))}
        </div>
        <p class="muted" style="margin:0;font-size:12px">Applies from tomorrow's pick; today's stays fixed.</p>
      </section>

      <section class="panel">
        <h2 style="margin:0;font-size:18px">Install on iPhone</h2>
        <p class="muted" style="margin:0;font-size:14px;line-height:1.5">
          In Safari tap Share, then Add to Home Screen. It opens like an app, and today's cards work without signal.
        </p>
      </section>

      <section class="panel">
        <h2 style="margin:0;font-size:18px">Reset progress</h2>
        <p class="muted" style="margin:0;font-size:14px">Clears ratings, schedule, streak and notes on this device. If sync is on, your saved copy comes back on the next sync, so disconnect sync first for a truly fresh start.</p>
        {confirmReset ? (
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn" style="color:var(--again)" onClick={() => { resetAll(); setConfirmReset(false); }}>Yes, clear everything</button>
            <button class="btn" onClick={() => setConfirmReset(false)}>Cancel</button>
          </div>
        ) : <button class="btn" style="align-self:flex-start" onClick={() => setConfirmReset(true)}>Reset…</button>}
      </section>

      <p class="muted" style="font-size:12px;text-align:center">Questions built {new Date(index.built).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p>
    </>
  );
}
