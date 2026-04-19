import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.smarter.app',
  appName: 'SmarterOS',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
