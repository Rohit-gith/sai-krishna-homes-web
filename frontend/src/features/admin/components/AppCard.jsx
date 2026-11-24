import { useEffect, useState } from 'react';
import { BellRing, Check, Download, Smartphone } from 'lucide-react';
import { Btn, Card } from './ui';
import { useUiStore } from '@/store/useUiStore';
import {
  canPromptInstall,
  disablePush,
  enablePush,
  isInstalled,
  onInstallChange,
  platform,
  promptInstall,
  pushState,
  sendTestPush,
} from '../pwa';

/** My account: install the CRM as an app, and turn new-enquiry notifications on for this device. */
export default function AppCard() {
  const toast = useUiStore((s) => s.showToast);
  const [installable, setInstallable] = useState(canPromptInstall());
  const [installed] = useState(isInstalled());
  const [state, setState] = useState('…');
  const [busy, setBusy] = useState(false);
  const os = platform();

  useEffect(() => onInstallChange(() => setInstallable(canPromptInstall())), []);
  const refresh = () => pushState().then(setState, () => setState('unsupported'));
  useEffect(() => {
    refresh();
  }, []);

  const run = async (fn, ok) => {
    setBusy(true);
    try {
      await fn();
      if (ok) toast(ok);
    } catch (e) {
      toast(e.message || 'Something went wrong.', 'error');
    }
    setBusy(false);
    refresh();
  };

  return (
    <Card className="p-5 sm:p-6 lg:col-span-2">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold">
        <Smartphone className="h-5 w-5 text-primary-600" /> App & notifications
      </h2>
      <div className="mt-4 grid gap-5 md:grid-cols-2">
        <div>
          <p className="text-sm font-semibold text-navy-900">Install on this device</p>
          {installed ? (
            <p className="mt-2 flex items-center gap-2 text-sm font-medium text-emerald-700">
              <Check className="h-4 w-4" /> You are using the installed app.
            </p>
          ) : installable ? (
            <>
              <p className="mt-1 text-sm text-slate-600">
                Open the CRM from your home screen or desktop in one tap, like an app.
              </p>
              <Btn className="mt-3" disabled={busy} onClick={() => run(promptInstall)}>
                <Download className="h-4 w-4" /> Install app
              </Btn>
            </>
          ) : os === 'ios' ? (
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-600">
              <li>
                Open this page in <b>Safari</b>.
              </li>
              <li>
                Tap the <b>Share</b> button (square with an arrow).
              </li>
              <li>
                Tap <b>Add to Home Screen</b>, then <b>Add</b>.
              </li>
            </ol>
          ) : (
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-600">
              <li>
                Open this page in <b>Chrome</b> or <b>Edge</b>.
              </li>
              <li>
                {os === 'android' ? (
                  <>
                    Tap the <b>⋮</b> menu → <b>Install app</b> (or <b>Add to Home screen</b>).
                  </>
                ) : (
                  <>
                    Click the <b>install icon</b> at the right end of the address bar.
                  </>
                )}
              </li>
            </ol>
          )}
        </div>

        <div>
          <p className="text-sm font-semibold text-navy-900">New website enquiry alerts</p>
          {state === 'on' ? (
            <>
              <p className="mt-2 flex items-center gap-2 text-sm font-medium text-emerald-700">
                <BellRing className="h-4 w-4" /> On for this device.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Btn
                  variant="outline"
                  disabled={busy}
                  onClick={() => run(sendTestPush, 'Test sent. It should appear in a few seconds.')}
                >
                  Send a test
                </Btn>
                <Btn
                  variant="outline"
                  disabled={busy}
                  onClick={() => run(() => disablePush(), 'Notifications turned off')}
                >
                  Turn off
                </Btn>
              </div>
            </>
          ) : state === 'off' ? (
            <>
              <p className="mt-1 text-sm text-slate-600">
                Get a notification on this phone or laptop the moment a customer fills a form on the
                website, even when the CRM is closed.
              </p>
              <Btn
                className="mt-3"
                disabled={busy}
                onClick={() => run(enablePush, 'Notifications are on for this device')}
              >
                <BellRing className="h-4 w-4" /> Turn on notifications
              </Btn>
            </>
          ) : state === 'blocked' ? (
            <p className="mt-2 text-sm text-rose-700">
              Notifications are blocked for this site in the browser settings. Allow them there,
              then come back.
            </p>
          ) : state === 'unsupported' ? (
            <p className="mt-2 text-sm text-slate-600">
              {os === 'ios'
                ? 'On iPhone, first add the CRM to your Home Screen (left), open it from there, then turn notifications on here.'
                : 'This browser cannot show notifications. Use Chrome, Edge or Firefox.'}
            </p>
          ) : (
            <p className="mt-2 text-sm text-slate-500">Checking…</p>
          )}
          <p className="mt-3 text-xs text-slate-500">
            Only this device. Logging out turns it off, so the next person never gets your alerts.
          </p>
        </div>
      </div>
    </Card>
  );
}
