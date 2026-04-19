/**
 * Servicio de Sincronización Android ↔ Backend
 * Conecta la APK con RUT OAuth y Picoclaw
 */

const API_ENDPOINTS = {
  RUT_OAUTH: 'https://rut.smarterbot.store',
  PICOLAW: 'https://flow.smarterbot.cl',
  MCP: 'https://mcp.smarterbot.store'
};

export interface SyncStatus {
  rut: boolean;
  picoclaw: boolean;
  mcp: boolean;
  lastSync: Date | null;
}

export interface DeviceInfo {
  deviceId: string;
  platform: 'android' | 'web';
  email: string;
  registeredAt: string;
}

class SyncService {
  private deviceId: string | null = null;
  private heartbeatInterval: number | null = null;
  private status: SyncStatus = {
    rut: false,
    picoclaw: false,
    mcp: false,
    lastSync: null
  };

  constructor() {
    this.deviceId = this.getOrCreateDeviceId();
  }

  // Generar ID único de dispositivo
  private getOrCreateDeviceId(): string {
    const storageKey = 'smarter_device_id';
    let id = localStorage.getItem(storageKey);
    
    if (!id) {
      id = `android-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(storageKey, id);
    }
    
    return id;
  }

  // Obtener estado actual
  getStatus(): SyncStatus {
    return { ...this.status };
  }

  // Verificar conectividad con todos los backends
  async checkConnectivity(): Promise<SyncStatus> {
    const results = await Promise.allSettled([
      this.checkEndpoint(`${this.API_ENDPOINTS.RUT_OAUTH}/`, 'GET'),
      this.checkEndpoint(`${this.API_ENDPOINTS.PICOLAW}/health`, 'GET'),
      this.checkEndpoint(`${this.API_ENDPOINTS.MCP}/health`, 'GET')
    ]);

    this.status = {
      rut: results[0].status === 'fulfilled' && results[0].value.ok,
      picoclaw: results[1].status === 'fulfilled' && results[1].value.ok,
      mcp: results[2].status === 'fulfilled' && results[2].value.ok,
      lastSync: new Date()
    };

    return this.status;
  }

  private async checkEndpoint(url: string, method: string): Promise<Response> {
    const response = await fetch(url, { method, mode: 'cors' });
    if (!response.ok) throw new Error(`Endpoint ${url} failed`);
    return response;
  }

  // Registrar dispositivo en RUT OAuth
  async registerDevice(email: string): Promise<DeviceInfo | null> {
    try {
      const response = await fetch(`${this.API_ENDPOINTS.RUT_OAUTH}/api/device/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          deviceId: this.deviceId,
          platform: 'android',
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) return null;

      const data = await response.json();
      return {
        deviceId: this.deviceId!,
        platform: 'android',
        email,
        registeredAt: new Date().toISOString()
      };
    } catch (err) {
      console.error('[SyncService] Register device error:', err);
      return null;
    }
  }

  // Enviar heartbeat a Picoclaw
  async sendHeartbeat(): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_ENDPOINTS.PICOLAW}/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId: this.deviceId,
          timestamp: Date.now(),
          status: 'active',
          connectivity: 'online',
          system: {
            platform: navigator.platform,
            userAgent: navigator.userAgent
          }
        })
      });

      return response.ok;
    } catch (err) {
      console.error('[SyncService] Heartbeat error:', err);
      return false;
    }
  }

  // Iniciar heartbeats automáticos
  startHeartbeat(intervalMs: number = 30000): void {
    this.stopHeartbeat();
    
    // Enviar primer heartbeat inmediatamente
    this.sendHeartbeat();
    
    // Programar heartbeats periódicos
    this.heartbeatInterval = window.setInterval(() => {
      this.sendHeartbeat();
    }, intervalMs);
  }

  // Detener heartbeats
  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Enviar mensaje desde Android a Picoclaw
  async sendMessage(message: string, source?: string): Promise<any> {
    try {
      const response = await fetch(`${this.API_ENDPOINTS.PICOLAW}/android/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          source: source || this.deviceId,
          deviceId: this.deviceId,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) return null;

      return await response.json();
    } catch (err) {
      console.error('[SyncService] Send message error:', err);
      return null;
    }
  }

  // Sincronizar usuario autenticado
  async syncUser(user: { email: string; provider: string }): Promise<boolean> {
    try {
      // Registrar en RUT OAuth
      await this.registerDevice(user.email);
      
      // Notificar a Picoclaw
      await this.sendMessage(`Usuario ${user.email} inició sesión con ${user.provider}`, 'auth');
      
      return true;
    } catch (err) {
      console.error('[SyncService] Sync user error:', err);
      return false;
    }
  }

  // Cerrar sesión y limpiar
  async logout(): Promise<void> {
    this.stopHeartbeat();
    
    // Notificar logout a Picoclaw
    await this.sendMessage('Usuario cerró sesión', 'logout');
  }

  // Getters
  get API_ENDPOINTS() {
    return API_ENDPOINTS;
  }

  getDeviceId(): string | null {
    return this.deviceId;
  }
}

// Exportar instancia singleton
export const syncService = new SyncService();
