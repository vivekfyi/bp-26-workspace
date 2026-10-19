'use client';

import { useEffect } from 'react';

type ClerkWindow = Window & {
  Clerk?: { status?: string };
};

function snapshot(label: string) {
  const script = document.querySelector<HTMLScriptElement>('script[data-clerk-js-script]');
  const performanceEntry = performance.getEntriesByName(script?.src ?? '').at(-1);
  console.info('[scroll0 Clerk debug]', JSON.stringify({
    label,
    readyState: document.readyState,
    clerkStatus: (window as ClerkWindow).Clerk?.status ?? null,
    scriptSrc: script?.src ?? null,
    scriptAsync: script?.async ?? null,
    scriptComplete: script?.dataset.clerkJsScript === 'true' ? 'clerk-script-present' : 'not-found',
    scriptTransferSize: performanceEntry && 'transferSize' in performanceEntry ? performanceEntry.transferSize : null,
  }));
}

export default function ClerkDiagnostics() {
  useEffect(() => {
    const onWindowError = (event: ErrorEvent) => {
      console.error('[scroll0 Clerk debug] window error', JSON.stringify({
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
      }), event.error);
    };
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('[scroll0 Clerk debug] unhandled rejection', event.reason);
    };
    const onCspViolation = (event: SecurityPolicyViolationEvent) => {
      console.error('[scroll0 Clerk debug] CSP violation', JSON.stringify({
        blockedURI: event.blockedURI,
        violatedDirective: event.violatedDirective,
        effectiveDirective: event.effectiveDirective,
        sourceFile: event.sourceFile,
      }));
    };
    const script = document.querySelector<HTMLScriptElement>('script[data-clerk-js-script]');
    const onScriptError = () => console.error('[scroll0 Clerk debug] Clerk script error', script?.src ?? 'script not found');

    snapshot('diagnostics mounted');
    window.addEventListener('error', onWindowError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);
    document.addEventListener('securitypolicyviolation', onCspViolation);
    script?.addEventListener('error', onScriptError);
    const timeout = window.setTimeout(() => snapshot('5 seconds after diagnostics mounted'), 5000);

    return () => {
      window.removeEventListener('error', onWindowError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
      document.removeEventListener('securitypolicyviolation', onCspViolation);
      script?.removeEventListener('error', onScriptError);
      window.clearTimeout(timeout);
    };
  }, []);

  return null;
}
