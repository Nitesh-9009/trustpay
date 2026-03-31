// src/components/StarknetProvider.tsx
"use client";

import { StarknetConfig, jsonRpcProvider } from "@starknet-react/core";
import { sepolia } from "@starknet-react/chains";
import { ArgentX } from "starknetkit/argentX";
import { Braavos } from "starknetkit/braavos";
import { WebWalletConnector } from "starknetkit/webwallet";

const provider = jsonRpcProvider({
  rpc: () => ({
    nodeUrl: "https://starknet-sepolia.public.blastapi.io/rpc/v0_7",
  }),
});

// All connectors listed — ConnectButton uses .available() at runtime to filter
const connectors = [
  new ArgentX(),
  new Braavos(),
  new WebWalletConnector({ url: "https://sepolia-web.argent.xyz" }),
];

export function StarknetProvider({ children }: { children: React.ReactNode }) {
  return (
    <StarknetConfig chains={[sepolia]} provider={provider} connectors={connectors}>
      {children}
    </StarknetConfig>
  );
}
