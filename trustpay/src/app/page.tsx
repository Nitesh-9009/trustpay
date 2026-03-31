// src/app/page.tsx
"use client";

import Link from "next/link";
import { EscrowPanel } from "@/components/EscrowPanel";
import { ConnectButton } from "@/components/ConnectButton";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <span className="font-semibold text-gray-900">TrustPay</span>
          <span className="text-gray-400 text-sm ml-2">Decentralised Payroll</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/submit-work"
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Submit Work (Worker)
          </Link>
          <ConnectButton />
        </div>
      </nav>

      {/* Main content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8 mt-4">
          <h1 className="text-3xl font-semibold text-gray-900">Employer Dashboard</h1>
          <p className="text-gray-500 mt-2">
            Create jobs, deposit payment into escrow, and release funds when work is verified on Filecoin.
          </p>
        </div>

        {/* Tech stack badges */}
        <div className="flex flex-wrap gap-2 mb-8">
          {["Filecoin / Storacha", "Starknet", "NEAR", "Cairo Contracts"].map((t) => (
            <span
              key={t}
              className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-200"
            >
              {t}
            </span>
          ))}
        </div>

        {/* How it works */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { step: "1", title: "Create job", desc: "Employer deposits STRK to escrow" },
            { step: "2", title: "Submit work", desc: "Worker uploads file to Filecoin" },
            { step: "3", title: "On-chain proof", desc: "CID registered on Starknet" },
            { step: "4", title: "Auto payment", desc: "NEAR agent releases funds" },
          ].map((s) => (
            <div key={s.step} className="bg-white border rounded-xl p-4">
              <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-medium flex items-center justify-center mb-2">
                {s.step}
              </div>
              <p className="text-sm font-medium text-gray-800">{s.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Escrow panel */}
        <EscrowPanel />
      </div>
    </main>
  );
}
