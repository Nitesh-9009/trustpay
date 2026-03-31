import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      fs: { browser: "./src/lib/empty.ts" },
      net: { browser: "./src/lib/empty.ts" },
      tls: { browser: "./src/lib/empty.ts" },
    },
  },
};

export default nextConfig;
