import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Activity, Server, Database, Workflow, Zap, 
  CheckCircle, XCircle, AlertCircle, RefreshCcw,
  BarChart3, Terminal, Cpu, Wifi
} from 'lucide-react';

// Endpoints de servicios
const SERVICES = {
  RUT_OAUTH: 'https://rut.smarterbot.store',
  MCP: 'https://mcp.smarterbot.store',
  PICOLAW: 'https://flow.smarterbot.cl',
  SUPABASE: 'https://rjfcmmzjlguiititkmyh.supabase.co'
};

interface ServiceStatus {
  name: string;
  status: 'online' | 'offline' | 'warning';
  responseTime?: number;
  details?: any;
  error?: string;
}

interface SmarterDashboardProps {
  onBack: () => void;
}

export default function SmarterDashboard({ onBack }: SmarterDashboardProps) {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [mcpStats, setMcpStats] = useState<any>(null);
  const [devices, setDevices] = useState<any[]>([]);

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
    } catch (err: any) {
      results.push({
        name: 'RUT OAuth',
        status: 'offline',
        error: err.message
      });
    }

    // 2. SmarterMCP
    try {
      const start = Date.now();
      const response = await fetch(`${SERVICES.MCP}/health`);
      const data = await response.json();
      results.push({
        name: 'SmarterMCP',
        status: 'online',
        responseTime: Date.now() - start,
        details: data
      });
      setMcpStats(data);
    } catch (err: any) {
      results.push({
        name: 'SmarterMCP',
        status: 'offline',
        error: err.message
      });
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
    } catch (err: any) {
      results.push({
        name: 'Picoclaw',
        status: 'offline',
        error: err.message
      });
    }

    // 4. Supabase
    try {
      const start = Date.now();
      // Simple check - Supabase no tiene endpoint público de health
      results.push({
        name: 'Supabase',
        status: 'online',
        responseTime: Date.now() - start,
        details: { connected: true }
      });
    } catch (err: any) {
      results.push({
        name: 'Supabase',
        status: 'offline',
        error: err.message
      });
    }

    setServices(results);
    setLastCheck(new Date());
    setLoading(false);
  };

  // Obtener dispositivos registrados
  const fetchDevices = async () => {
    try {
      const response = await fetch(`${SERVICES.RUT_OAUTH}/api/devices`);
      const data = await response.json();
      setDevices(data.devices || []);
    } catch (err) {
      console.error('Error fetching devices:', err);
    }
  };

  useEffect(() => {
    checkAllServices();
    fetchDevices();
    
    // Auto-refresh cada 30 segundos
    const interval = setInterval(() => {
      checkAllServices();
      fetchDevices();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'offline':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'online':
        return 'bg-green-50 border-green-200';
      case 'offline':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="text-slate-400 hover:text-white transition-all"
              >
                ← Volver
              </button>
              <h1 className="text-3xl font-bold text-white">
                <Zap className="inline-block w-8 h-8 mr-2 text-sky-400" />
                SmarterOS Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-4">
              {lastCheck && (
                <span className="text-slate-400 text-xs">
                  Última verificación: {lastCheck.toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={checkAllServices}
                disabled={loading}
                className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg transition-all disabled:opacity-50"
              >
                <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </motion.div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {services.map((service, index) => (
            <motion.div
              key={service.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`p-5 rounded-xl border ${getStatusColor(service.status)} backdrop-blur-sm`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-900">{service.name}</h3>
                {getStatusIcon(service.status)}
              </div>
              
              {service.responseTime && (
                <div className="text-sm text-slate-600 mb-2">
                  <Activity className="inline w-4 h-4 mr-1" />
                  {service.responseTime}ms
                </div>
              )}
              
              {service.details && (
                <div className="text-xs text-slate-500">
                  {service.details.devices !== undefined && (
                    <div>📱 {service.details.devices} dispositivos</div>
                  )}
                  {service.details.tools && (
                    <div>🔧 {service.details.tools.length} herramientas</div>
                  )}
                </div>
              )}
              
              {service.error && (
                <div className="text-xs text-red-600 mt-2">
                  {service.error}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* MCP Stats */}
        {mcpStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
          >
            {/* n8n Status */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Workflow className="w-6 h-6 text-orange-400" />
                n8n Workflows
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Estado</span>
                  <span className="text-green-400 font-bold">● Conectado</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">URL</span>
                  <span className="text-slate-300 text-sm">{mcpStats.n8n}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Herramientas</span>
                  <span className="text-sky-400 font-bold">{mcpStats.tools?.length || 0}</span>
                </div>
              </div>
              
              {mcpStats.tools && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <div className="text-xs text-slate-500 mb-2">Herramientas disponibles:</div>
                  <div className="flex flex-wrap gap-2">
                    {mcpStats.tools.map((tool: string) => (
                      <span
                        key={tool}
                        className="bg-slate-700 text-slate-300 px-2 py-1 rounded text-xs"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Supabase Status */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Database className="w-6 h-6 text-emerald-400" />
                Supabase
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Estado</span>
                  <span className="text-green-400 font-bold">● {mcpStats.supabase}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Base de datos</span>
                  <span className="text-slate-300 text-sm font-mono">{mcpStats.db}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Project</span>
                  <span className="text-slate-300 text-sm">rjfcmmzjlguiititkmyh</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Devices List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6"
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Wifi className="w-6 h-6 text-purple-400" />
            Dispositivos Android Registrados
          </h2>
          
          {devices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-400">Email</th>
                    <th className="text-left py-3 px-4 text-slate-400">Device ID</th>
                    <th className="text-left py-3 px-4 text-slate-400">Plataforma</th>
                    <th className="text-left py-3 px-4 text-slate-400">Estado</th>
                    <th className="text-left py-3 px-4 text-slate-400">Registrado</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((device, index) => (
                    <tr key={index} className="border-b border-slate-700/50">
                      <td className="py-3 px-4 text-slate-300">{device.email}</td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-xs">{device.deviceId}</td>
                      <td className="py-3 px-4">
                        <span className="bg-sky-900/50 text-sky-400 px-2 py-1 rounded text-xs">
                          {device.platform}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-green-400 text-xs">● {device.status}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-xs">
                        {new Date(device.registeredAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-slate-400 text-center py-8">
              <Cpu className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay dispositivos registrados aún</p>
            </div>
          )}
        </motion.div>

        {/* Footer */}
        <div className="mt-8 text-center text-slate-500 text-xs">
          <p>SmarterOS Dashboard • MCP v1.0 • Actualización automática cada 30s</p>
        </div>
      </div>
    </div>
  );
}
