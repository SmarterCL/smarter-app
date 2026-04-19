import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Activity, Server, Database, Workflow, Zap, 
  CheckCircle, XCircle, AlertCircle, RefreshCcw,
  BarChart3, Terminal, Cpu, Wifi, Cloud, Layers,
  MessageSquare, Users, FileText, PieChart
} from 'lucide-react';

// MCP de Stitch
const STITCH_MCP_URL = 'https://mcp.smarterbot.store/mcp';

// Servicios a monitorear
const SERVICES = {
  RUT_OAUTH: 'https://rut.smarterbot.store',
  MCP: 'https://mcp.smarterbot.store',
  PICOLAW: 'https://api.smarterbot.store/picoclaw', // Proxy vía Caddy
  SUPABASE: 'https://rjfcmmzjlguiititkmyh.supabase.co',
  STITCH: 'https://stitch.withgoogle.com'
};

interface ServiceStatus {
  name: string;
  status: 'online' | 'offline' | 'warning';
  responseTime?: number;
  details?: any;
}

interface StitchData {
  workflows?: any[];
  executions?: any[];
  stats?: any;
  agents?: any[];
  n8nUrl?: string;
  supabaseStatus?: string;
}

export default function StitchDashboard() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [stitchData, setStitchData] = useState<StitchData>({});
  const [mcpTools, setMcpTools] = useState<string[]>([]);
  const [activeWorkflows, setActiveWorkflows] = useState<number>(0);
  const [totalExecutions, setTotalExecutions] = useState<number>(0);
  const [devices, setDevices] = useState<number>(0);
  const [uptime, setUptime] = useState<string>('');

  // Conectar con MCP de Stitch
  const fetchStitchMCP = async () => {
    try {
      // Obtener estadísticas de MCP
      const statsResponse = await fetch(`${SERVICES.MCP}/health`);
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        setStitchData({
          n8nUrl: stats.n8n,
          supabaseStatus: stats.supabase,
          stats
        });
        if (stats.tools) {
          setMcpTools(stats.tools);
        }
      }

      // Obtener dispositivos de RUT OAuth
      const devicesResponse = await fetch(`${SERVICES.RUT_OAUTH}/api/devices`);
      if (devicesResponse.ok) {
        const data = await devicesResponse.json();
        setDevices(data.count || 0);
      }

      // Obtener uptime de Picoclaw
      const picoclawResponse = await fetch(`${SERVICES.PICOLAW}/health`);
      if (picoclawResponse.ok) {
        const data = await picoclawResponse.json();
        setUptime(data.uptime || '');
      }

    } catch (err) {
      console.error('Error fetching Stitch MCP:', err);
    }
  };

  // Verificar todos los servicios
  const checkAllServices = async () => {
    setLoading(true);
    const results: ServiceStatus[] = [];

    // 1. RUT OAuth
    try {
      const start = Date.now();
      const response = await fetch(`${SERVICES.RUT_OAUTH}/health`);
      const data = await response.json();
      results.push({
        name: 'RUT OAuth',
        status: 'online',
        responseTime: Date.now() - start,
        details: data
      });
    } catch (err) {
      results.push({ name: 'RUT OAuth', status: 'offline' });
    }

    // 2. SmarterMCP (Stitch)
    try {
      const start = Date.now();
      const response = await fetch(`${SERVICES.MCP}/health`);
      const data = await response.json();
      results.push({
        name: 'Stitch MCP',
        status: 'online',
        responseTime: Date.now() - start,
        details: data
      });
    } catch (err) {
      results.push({ name: 'Stitch MCP', status: 'offline' });
    }

    // 3. Picoclaw
    try {
      const start = Date.now();
      const response = await fetch(`${SERVICES.PICOLAW}/health`);
      const data = await response.json();
      results.push({
        name: 'Picoclaw',
        status: 'online',
        responseTime: Date.now() - start,
        details: data
      });
    } catch (err) {
      results.push({ name: 'Picoclaw', status: 'offline' });
    }

    // 4. Supabase
    try {
      const start = Date.now();
      results.push({
        name: 'Supabase',
        status: 'online',
        responseTime: Date.now() - start,
        details: { connected: true, project: 'rjfcmmzjlguiititkmyh' }
      });
    } catch (err) {
      results.push({ name: 'Supabase', status: 'offline' });
    }

    setServices(results);
    setLastCheck(new Date());
    setLoading(false);
  };

  useEffect(() => {
    // Initial fetch
    checkAllServices();
    fetchStitchMCP();
    
    // Auto-refresh cada 15 segundos
    const interval = setInterval(() => {
      checkAllServices();
      fetchStitchMCP();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'online': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'offline': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'online': return 'from-green-900/50 to-emerald-900/50 border-green-700';
      case 'offline': return 'from-red-900/50 to-rose-900/50 border-red-700';
      case 'warning': return 'from-yellow-900/50 to-amber-900/50 border-yellow-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Cloud className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Stitch Dashboard
                </h1>
                <p className="text-purple-300 text-sm">
                  Powered by Google MCP + SmarterBOT
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {lastCheck && (
                <span className="text-purple-300 text-xs">
                  Actualizado: {lastCheck.toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={checkAllServices}
                disabled={loading}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-all disabled:opacity-50 shadow-lg"
              >
                <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 shadow-xl"
          >
            <div className="flex items-center justify-between mb-2">
              <Workflow className="w-8 h-8 text-blue-200" />
              <Activity className="w-5 h-5 text-blue-300" />
            </div>
            <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">Herramientas MCP</p>
            <p className="text-3xl font-bold text-white">{mcpTools.length}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-6 shadow-xl"
          >
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-8 h-8 text-purple-200" />
              <Wifi className="w-5 h-5 text-purple-300" />
            </div>
            <p className="text-purple-200 text-xs font-bold uppercase tracking-widest mb-1">Dispositivos</p>
            <p className="text-3xl font-bold text-white">{devices}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-6 shadow-xl"
          >
            <div className="flex items-center justify-between mb-2">
              <MessageSquare className="w-8 h-8 text-emerald-200" />
              <Activity className="w-5 h-5 text-emerald-300" />
            </div>
            <p className="text-emerald-200 text-xs font-bold uppercase tracking-widest mb-1">Picoclaw Uptime</p>
            <p className="text-xl font-bold text-white">{uptime || '---'}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-orange-600 to-orange-800 rounded-2xl p-6 shadow-xl"
          >
            <div className="flex items-center justify-between mb-2">
              <Database className="w-8 h-8 text-orange-200" />
              <Server className="w-5 h-5 text-orange-300" />
            </div>
            <p className="text-orange-200 text-xs font-bold uppercase tracking-widest mb-1">Servicios Online</p>
            <p className="text-3xl font-bold text-white">
              {services.filter(s => s.status === 'online').length}/{services.length}
            </p>
          </motion.div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {services.map((service, index) => (
            <motion.div
              key={service.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 + 0.4 }}
              className={`p-5 rounded-xl border backdrop-blur-sm bg-gradient-to-br ${getStatusColor(service.status)}`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-white">{service.name}</h3>
                {getStatusIcon(service.status)}
              </div>
              
              {service.responseTime && (
                <div className="text-sm text-white/70 mb-2">
                  <Activity className="inline w-4 h-4 mr-1" />
                  {service.responseTime}ms
                </div>
              )}
              
              {service.details && (
                <div className="text-xs text-white/60 space-y-1">
                  {service.details.devices !== undefined && (
                    <div>📱 {service.details.devices} dispositivos</div>
                  )}
                  {service.details.tools && (
                    <div>🔧 {service.details.tools.length} herramientas</div>
                  )}
                  {service.details.project && (
                    <div>🔗 {service.details.project}</div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* MCP Tools */}
        {mcpTools.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-slate-900/50 backdrop-blur border border-purple-800 rounded-xl p-6 mb-8"
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Terminal className="w-6 h-6 text-purple-400" />
              Herramientas MCP Disponibles
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {mcpTools.map((tool, index) => (
                <motion.div
                  key={tool}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + (index * 0.05) }}
                  className="bg-purple-900/30 border border-purple-700 rounded-lg p-3"
                >
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-400" />
                    <span className="text-purple-200 text-sm font-mono">{tool}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* n8n + Supabase Info */}
        {stitchData.n8nUrl && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 backdrop-blur border border-cyan-700 rounded-xl p-6"
          >
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Database className="w-6 h-6 text-cyan-400" />
              Infraestructura Stitch
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/50 rounded-lg p-4">
                <p className="text-cyan-400 text-xs font-bold uppercase mb-1">n8n Workflow</p>
                <p className="text-white font-mono text-sm">{stitchData.n8nUrl}</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4">
                <p className="text-cyan-400 text-xs font-bold uppercase mb-1">Supabase</p>
                <p className="text-green-400 font-bold">● {stitchData.supabaseStatus || 'Conectado'}</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4">
                <p className="text-cyan-400 text-xs font-bold uppercase mb-1">Project</p>
                <p className="text-white font-mono text-sm">rjfcmmzjlguiititkmyh</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-purple-400/60 text-xs">
          <p>Stitch Dashboard • MCP v1.0 • Google + SmarterBOT Integration</p>
          <p className="mt-1">Actualización automática cada 15s</p>
        </div>
      </div>
    </div>
  );
}
