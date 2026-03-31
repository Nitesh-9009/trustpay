"use client";

import { useAccount, useContract, useSendTransaction } from "@starknet-react/core";
import {
  ESCROW_ABI,
  ESCROW_CONTRACT_ADDRESS,
  ERC20_APPROVE_ABI,
  STRK_TOKEN_ADDRESS,
} from "@/lib/starknet";
import { shortString, cairo } from "starknet";
import { toast } from "sonner";
import { useState } from "react";

// 10 STRK (18 decimals)
const DEPOSIT_AMOUNT = cairo.uint256(10n * 10n ** 18n);

export function EscrowPanel() {
  const { isConnected } = useAccount();
  const [jobId, setJobId] = useState("");
  const [workerAddress, setWorkerAddress] = useState("");

  const { contract: escrow } = useContract({
    address: ESCROW_CONTRACT_ADDRESS,
    abi: ESCROW_ABI,
  });

  const { contract: strk } = useContract({
    address: STRK_TOKEN_ADDRESS,
    abi: ERC20_APPROVE_ABI,
  });

  const { sendAsync } = useSendTransaction({});

  const handleDeposit = async () => {
    if (!escrow || !strk || !isConnected) return;

    try {
      toast.loading("Creating job on Starknet...");

      const jobIdFelt = shortString.encodeShortString(jobId);

      // Approve escrow to pull 10 STRK, then deposit in one multicall
      const calls = [
        strk.populate("approve", [ESCROW_CONTRACT_ADDRESS, DEPOSIT_AMOUNT]),
        escrow.populate("deposit", [
          jobIdFelt,
          workerAddress,
          0, // work_cid starts empty — worker fills it later
        ]),
      ];

      const tx = await sendAsync(calls);
      toast.dismiss();
      toast.success(`Job created! TX: ${tx.transaction_hash.slice(0, 10)}...`);
    } catch (err) {
      toast.dismiss();
      console.error(err);
      toast.error("Transaction failed");
    }
  };

  const handleRelease = async () => {
    if (!escrow || !isConnected) return;

    try {
      toast.loading("Releasing payment...");
      const calls = [
        escrow.populate("release_payment", [
          shortString.encodeShortString(jobId),
        ]),
      ];
      const tx = await sendAsync(calls);
      toast.dismiss();
      toast.success(`Payment released! TX: ${tx.transaction_hash.slice(0, 10)}...`);
    } catch (err) {
      toast.dismiss();
      console.error(err);
      toast.error("Release failed");
    }
  };

  if (!isConnected) {
    return (
      <div className="p-6 border rounded-xl bg-orange-50 text-orange-700 text-sm">
        Connect your Starknet wallet to manage escrow
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-5 border rounded-xl bg-white shadow-sm">
        <h3 className="font-medium text-gray-800 mb-3">Create Job Escrow</h3>
        <div className="space-y-2">
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="Job ID (e.g. job-001)"
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
          />
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="Worker Starknet address (0x...)"
            value={workerAddress}
            onChange={(e) => setWorkerAddress(e.target.value)}
          />
          <button
            onClick={handleDeposit}
            disabled={!jobId || !workerAddress}
            className="w-full bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Deposit 10 STRK into Escrow
          </button>
        </div>
      </div>

      <div className="p-5 border rounded-xl bg-white shadow-sm">
        <h3 className="font-medium text-gray-800 mb-3">Release Payment</h3>
        <p className="text-xs text-gray-500 mb-2">
          After worker submits their IPFS CID (work proof), you can release funds
        </p>
        <button
          onClick={handleRelease}
          disabled={!jobId}
          className="w-full bg-green-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Approve & Release Payment
        </button>
      </div>
    </div>
  );
}
