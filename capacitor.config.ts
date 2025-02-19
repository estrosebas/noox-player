import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.srestro.nooxmusic',
  appName: 'noox-music',
  webDir: 'dist',
  plugins: {
    MusicControls: {
      enabled: true,
    },
  }
};

export default config;
