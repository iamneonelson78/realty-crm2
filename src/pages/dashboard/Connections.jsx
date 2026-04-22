import { useEffect, useMemo, useState } from 'react';
import { Zap, Gem, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PLATFORMS } from '../../components/dashboard/connections/platforms';
import PlatformCard from '../../components/dashboard/connections/PlatformCard';
import Button from '../../components/ui/Button';
import {
  listConnections,
  setConnectionStatus,
  upsertConnection,
  getConnectionsEnabled,
} from '../../lib/connections';

export default function Connections() {
  const { user } = useAuth();
  const toast = useToast();
  const agentId = user?.id;

  const [enabled, setEnabled] = useState(!!user?.connections_enabled);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!agentId) return;
      setLoading(true);
      try {
        const [flag, conns] = await Promise.all([
          getConnectionsEnabled(agentId),
          listConnections(agentId),
        ]);
        if (cancelled) return;
        setEnabled(flag || !!user?.connections_enabled);
        setRows(conns);
      } catch (err) {
        if (cancelled) return;
        console.error('Connections: Failed to load data:', err);
        toast.error(`Failed to load connections: ${err.message}`);
        // Fall back to whatever we already knew from the auth profile so the
        // user isn't stuck on a blank loading state.
        setEnabled(!!user?.connections_enabled);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [agentId, user?.connections_enabled, toast]);

  const byPlatform = useMemo(() => {
    const map = {};
    for (const r of rows) map[r.platform] = r;
    return map;
  }, [rows]);

  const connectedCount = rows.filter((r) => r.status === 'connected').length;

  const handleConnect = async (platform, handle) => {
    try {
      const saved = await upsertConnection(agentId, platform, {
        handle,
        status: 'connected',
        connected_at: new Date().toISOString(),
      });
      setRows((prev) => {
        const next = prev.filter((r) => r.platform !== platform);
        next.push(saved);
        return next;
      });
      toast.success(`${platform} connected.`);
    } catch (err) {
      toast.error(`Failed to connect ${platform}: ${err.message}`);
    }
  };

  const handleDisconnect = async (platform) => {
    try {
      const saved = await setConnectionStatus(agentId, platform, 'disconnected');
      setRows((prev) => {
        const next = prev.filter((r) => r.platform !== platform);
        next.push({ ...saved, status: 'disconnected' });
        return next;
      });
      toast.warning(`${platform} disconnected.`);
    } catch (err) {
      toast.error(`Failed to disconnect ${platform}: ${err.message}`);
    }
  };

  if (!enabled) {
    return <DisabledState />;
  }

  return (
    <div className="transition-colors">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-6 md:mb-8 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-400 bg-brand-100 dark:bg-brand-900/30 px-2 py-1 rounded-full mb-2">
            <Gem className="w-3 h-3" /> Premium feature
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Connections</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm max-w-xl">
            Link the channels your buyers actually use. Once connected, you can auto-reply,
            auto-post listings, and one-tap chat from every lead card — no more copy-pasting
            Messenger links.
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500 dark:text-slate-400">Connected channels</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {connectedCount}<span className="text-slate-400 dark:text-slate-500 text-base font-medium">/{PLATFORMS.length}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-slate-500 dark:text-slate-400 text-sm">Loading your connections…</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {PLATFORMS.map((p) => (
            <PlatformCard
              key={p.id}
              platform={p}
              connection={byPlatform[p.id]}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
            />
          ))}
        </div>
      )}

      <p className="mt-6 text-xs text-slate-400 dark:text-slate-500">
        Automation is coming soon. Connecting now pre-wires your handles so your listings and
        lead cards use them everywhere.
      </p>
    </div>
  );
}

function DisabledState() {
  return (
    <div className="max-w-lg mx-auto text-center py-16">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
        <Lock className="w-6 h-6 text-slate-400" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
        Connections aren't turned on yet
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        This feature links Messenger, WhatsApp, Viber and Facebook so your listings auto-route
        buyers to the right channel. Ask your admin to enable it for your account.
      </p>
      <Link to="/dashboard">
        <Button variant="secondary" icon={<Zap className="w-4 h-4" />}>
          Back to dashboard
        </Button>
      </Link>
    </div>
  );
}
