import { createRoot } from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import App from './App.tsx';
import './index.css';
import './i18n';
import { PLATFORM_LOGO_URL } from './config';
import { installCurrencyFetchInterceptor } from './utils/apiClient';

// Before anything renders. Context providers fetch during their first effect, and
// an interceptor installed later would miss those requests — the cart in
// particular would load in the wrong currency and stay that way until a refetch.
// While the store is on INR this is a pure passthrough.
installCurrencyFetchInterceptor();

// Feed the logo to CSS (the printed-invoice watermark) so src/config.ts stays
// the single place the platform logo is defined.
document.documentElement.style.setProperty(
  '--platform-logo-url',
  `url("${PLATFORM_LOGO_URL}")`
);

// #region agent log
const _t0 = performance.now();
fetch('http://127.0.0.1:7247/ingest/59cab846-9e60-4704-8103-2f60eefca997',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f7305f'},body:JSON.stringify({sessionId:'f7305f',location:'main.tsx:after-imports',message:'main_ready_to_render',data:{t0:_t0,timeSinceNav:typeof performance.timing !== 'undefined' ? performance.now() - (performance.timing.navigationStart || 0) : null},timestamp:Date.now(),hypothesisId:'H1-H3'})}).catch(()=>{});
// #endregion

createRoot(document.getElementById('root')!).render(
    <ChakraProvider>
      <App />
    </ChakraProvider>
);
// #region agent log
fetch('http://127.0.0.1:7247/ingest/59cab846-9e60-4704-8103-2f60eefca997',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'f7305f'},body:JSON.stringify({sessionId:'f7305f',location:'main.tsx:after-render',message:'main_render_invoked',data:{t:performance.now(),t0:_t0,deltaMs:Math.round(performance.now()-_t0)},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
// #endregion