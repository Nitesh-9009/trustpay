// src/components/ConnectButton.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useAccount, useConnect, useDisconnect } from "@starknet-react/core";

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  if (isConnected && address) {
    return (
      <button
        onClick={() => {
          navigator.clipboard.writeText(address);
          alert("Address copied: " + address);
        }}
        title={address}
        className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200"
      >
        {address.slice(0, 6)}...{address.slice(-4)} 📋
      </button>
    );
  }

  const available = connectors.filter((c) => c.available());
  const unavailable = connectors.filter((c) => !c.available());

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
      >
        Connect Wallet
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <p className="text-xs text-gray-400 px-4 pt-3 pb-1 font-medium uppercase tracking-wide">
            Select Wallet
          </p>

          {available.length === 0 && (
            <p className="px-4 py-3 text-sm text-gray-500">
              No Starknet wallet detected.{" "}
              <a
                href="https://chromewebstore.google.com/detail/argent-x/dlcobpjiigpikoobohmabehhmhfoodbb"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 underline"
              >
                Install Argent X
              </a>
            </p>
          )}

          {available.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                connect({ connector: c });
                setOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-800 hover:bg-indigo-50 transition-colors"
            >
              {c.icon && typeof c.icon === "string" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.icon} alt={c.name} className="w-6 h-6 rounded" />
              ) : (
                <span className="w-6 h-6 rounded bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
                  {c.name.charAt(0)}
                </span>
              )}
              <span className="font-medium">{c.name}</span>
              <span className="ml-auto text-xs text-green-500">Ready</span>
            </button>
          ))}

          {unavailable.length > 0 && (
            <>
              <div className="border-t border-gray-100 mt-1" />
              <p className="text-xs text-gray-400 px-4 pt-2 pb-1 font-medium uppercase tracking-wide">
                Not installed
              </p>
              {unavailable.map((c) => (
                <div
                  key={c.id}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-400 cursor-not-allowed"
                >
                  {c.icon && typeof c.icon === "string" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.icon} alt={c.name} className="w-6 h-6 rounded opacity-40" />
                  ) : (
                    <span className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-bold">
                      {c.name.charAt(0)}
                    </span>
                  )}
                  <span>{c.name}</span>
                  <span className="ml-auto text-xs text-gray-400">Not installed</span>
                </div>
              ))}
            </>
          )}

          <div className="border-t border-gray-100 mt-1 pb-1" />
        </div>
      )}
    </div>
  );
}
