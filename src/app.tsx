import { useEffect, useState } from 'preact/hooks';
import type { Index } from './lib/types';
import { loadIndex } from './lib/data';
import { getState, setQotd, useAppState } from './lib/store';
import { dueKeys, qotdPair } from './lib/plan';
import { addDays, today } from './lib/dates';
import { keepOffline } from './lib/offline';
import { startSync } from './lib/sync';
import { Icon, useHash, useOnline } from './ui';
import { Today } from './views/Today';
import { Browse } from './views/Browse';
import { Deck } from './views/Deck';
import { Study } from './views/Study';
import { Retest } from './views/Retest';
import { Notes } from './views/Notes';
import { Settings } from './views/Settings';

export function App() {
  const [index, setIndex] = useState<Index | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const hash = useHash();
  const online = useOnline();
  const state = useAppState();

  useEffect(() => {
    loadIndex().then(setIndex).catch(() => setErr('Could not load questions. Check your connection and reload.'));
    startSync();
  }, []);

  // Fix today's and tomorrow's question of the day, then keep those + due cards offline.
  useEffect(() => {
    if (!index) return;
    const pair = qotdPair(index, getState());
    setQotd(pair.fresh);
    const keys = new Set<string>([...dueKeys(index, getState(), addDays(today(), 1))]);
    if (pair.today) keys.add(pair.today);
    if (pair.tomorrow) keys.add(pair.tomorrow);
    keepOffline([...keys]);
  }, [index, online, state.u]);

  const [route, ...parts] = hash.replace(/^#\/?/, '').split('/');
  const tab = route === '' || route === 'deck' ? 'today' : route === 'q' || route === 'browse' ? 'browse' : route;
  const wide = route === 'q';

  let view;
  if (err) view = <div class="empty"><p class="error">{err}</p><button class="btn" onClick={() => location.reload()}>Reload</button></div>;
  else if (!index) view = <div class="empty"><p>Loading…</p></div>;
  else if (route === '' ) view = <Today index={index} />;
  else if (route === 'browse') view = <Browse index={index} book={parts[0]} chapter={parts[1]} />;
  else if (route === 'deck') view = <Deck index={index} kind={parts[0]} arg={parts.slice(1).join('/')} />;
  else if (route === 'q') view = <Study index={index} qkey={`${parts[0]}/${parts[1]}`} />;
  else if (route === 'retest') view = <Retest index={index} />;
  else if (route === 'notes') view = <Notes index={index} />;
  else if (route === 'settings') view = <Settings index={index} />;
  else view = <div class="empty"><p>Page not found.</p><a class="btn" href="#/">Go to Today</a></div>;

  const inDeck = route === 'deck';
  const tabs: [string, string, string][] = [['today', '#/', 'Today'], ['browse', '#/browse', 'Browse'], ['retest', '#/retest', 'Retest'], ['notes', '#/notes', 'Notes']];

  return (
    <div class="app">
      {!online && <div class="offline-bar" role="status">Offline. Today's cards still work; progress syncs when you reconnect.</div>}
      <header class="topbar">
        <a class="brand" href="#/">Practice Questions</a>
        <nav aria-label="Main">
          {tabs.map(([id, href, label]) => <a key={id} href={href} class={tab === id ? 'on' : ''}>{label}</a>)}
          <a href="#/settings" class={tab === 'settings' ? 'on' : ''}>Settings</a>
        </nav>
      </header>
      <main class={`main ${wide ? 'wide' : ''}`}>{view}</main>
      {!inDeck && (
        <nav class="tabbar" aria-label="Main">
          {tabs.map(([id, href, label]) => (
            <a key={id} href={href} class={tab === id ? 'on' : ''} aria-current={tab === id ? 'page' : undefined}>
              <Icon name={id} size={22} stroke={1.8} />
              <span>{label}</span>
            </a>
          ))}
        </nav>
      )}
    </div>
  );
}
