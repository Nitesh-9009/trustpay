// src/app/payslips/page.tsx
"use client";

import Link from "next/link";
import { useAccount } from "@starknet-react/core";

export default function PayslipsPage() {
  const { isConnected } = useAccount();

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-800">
            ← Back to dashboard
          </Link>
        </div>

        <h1 className="text-2xl font-semibold text-gray-900 mb-2">My Payslips</h1>
        <p className="text-gray-500 text-sm mb-8">
          Your verified payment history — each entry links to the on-chain Filecoin proof.
        </p>

        {!isConnected ? (
          <div className="p-6 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            Connect your Starknet wallet to view your payslips.
          </div>
        ) : (
          <div className="p-8 bg-white border rounded-xl text-center text-gray-400 text-sm">
            No payslips yet. Complete a job and have the employer release payment to
            see your history here.
          </div>
        )}
      </div>
    </main>
  );
}
