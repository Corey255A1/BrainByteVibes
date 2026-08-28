import { render } from 'preact';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
import { App } from './App';

// Register PWA Service Worker for complete offline operation
registerSW({
  immediate: true,
  onOfflineReady() {
    console.log('[BrainByte] App is ready to work offline.');
  },
  onNeedRefresh() {
    console.log('[BrainByte] New update available on server.');
    window.dispatchEvent(new CustomEvent('brainbyte-sw-update'));
  }
});

render(<App />, document.getElementById('app')!);

