import { render } from 'preact';
import '@fontsource/geist-sans/latin-400.css';
import '@fontsource/geist-sans/latin-500.css';
import '@fontsource/geist-sans/latin-600.css';
import '@fontsource/geist-mono/latin-400.css';
import '@fontsource/geist-mono/latin-500.css';
import '@fontsource/newsreader/latin-400.css';
import '@fontsource/newsreader/latin-400-italic.css';
import '@fontsource/newsreader/latin-500.css';
import 'katex/dist/katex.min.css';
import './styles.css';
import { App } from './app';
import { registerSW } from './lib/offline';

render(<App />, document.getElementById('app')!);
registerSW();
