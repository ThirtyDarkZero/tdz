import type { CapacitorConfig } from "@capacitor/cli";

// Wraps the existing Vite build (dist/) as a native iOS app.
// App code is unchanged — run `npm run ios` after any web change.
const config: CapacitorConfig = {
  appId: "com.thirtydarkzero.tdz",
  appName: "TDZ Distribution",
  webDir: "dist",
  ios: {
    contentInset: "automatic",
  },
};

export default config;
