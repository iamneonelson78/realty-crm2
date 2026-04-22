import { useEffect, useState } from 'react';
import { Send, MessageCircle, Phone, ThumbsUp, CheckCircle2, Link as LinkIcon } from 'lucide-react';
import Button from '../../ui/Button';

const ICONS = { Send, MessageCircle, Phone, ThumbsUp };

export default function PlatformCard({ platform, connection, onConnect, onDisconnect }) {
  const [handle, setHandle] = useState(connection?.handle ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHandle(connection?.handle ?? '');
  }, [connection?.handle]);

  const Icon = ICONS[platform.icon] ?? Send;
  const isConnected = connection?.status === 'connected';

  const handleConnect = async () => {
    if (!handle.trim()) return;
    setSaving(true);
    await onConnect(platform.id, handle.trim());
    setSaving(false);
  };

  const handleDisconnect = async () => {
    setSaving(true);
    await onDisconnect(platform.id);
    setSaving(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
      <div className={`bg-gradient-to-br ${platform.brandClass} px-5 py-4 flex items-center justify-between text-white`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center ring-4 ${platform.ringClass}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base leading-tight">{platform.name}</h3>
            <p className="text-white/80 text-xs leading-tight">{platform.tagline}</p>
          </div>
        </div>
        <StatusPill connected={isConnected} />
      </div>

      <div className="p-5 flex-1 flex flex-col gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            {platform.inputLabel}
          </label>
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder={platform.placeholder}
              disabled={isConnected}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60 placeholder:text-slate-400 transition-colors"
            />
          </div>
        </div>

        <div className="mt-auto flex gap-2">
          {isConnected ? (
            <>
              <Button
                variant="secondary"
                size="md"
                fullWidth
                disabled
                className="opacity-80"
                icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              >
                Connected
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={handleDisconnect}
                disabled={saving}
              >
                Disconnect
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={handleConnect}
              disabled={saving || !handle.trim()}
            >
              {saving ? 'Connecting…' : 'Connect'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusPill({ connected }) {
  return (
    <span
      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${
        connected
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-white/20 text-white border-white/30'
      }`}
    >
      {connected ? 'Connected' : 'Not connected'}
    </span>
  );
}
