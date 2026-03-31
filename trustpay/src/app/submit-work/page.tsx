// src/app/submit-work/page.tsx
"use client";

import { useState, useCallback } from "react";
import { useAccount, useContract, useSendTransaction } from "@starknet-react/core";
import { ESCROW_ABI, ESCROW_CONTRACT_ADDRESS } from "@/lib/starknet";
import { cidToFelt252 } from "@/lib/storacha";
import { shortString } from "starknet";
import { toast } from "sonner";
import { ConnectButton } from "@/components/ConnectButton";

type UploadStep = "idle" | "uploading-filecoin" | "submitting-chain" | "done";

export default function SubmitWorkPage() {
  const { address, isConnected } = useAccount();
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState("");
  const [description, setDescription] = useState("");
  const [step, setStep] = useState<UploadStep>("idle");
  const [result, setResult] = useState<{
    cid: string;
    url: string;
    txHash: string;
  } | null>(null);

  const { contract } = useContract({
    address: ESCROW_CONTRACT_ADDRESS,
    abi: ESCROW_ABI,
  });

  const { sendAsync } = useSendTransaction({});

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }, []);

  const handleSubmit = async () => {
    if (!file || !jobId || !address || !contract) {
      toast.error("Fill in all fields and connect wallet");
      return;
    }

    try {
      // STEP 1: Upload to Filecoin via the server-side API route
      setStep("uploading-filecoin");
      toast.loading("Uploading work proof to Filecoin...");

      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "metadata",
        JSON.stringify({
          jobId,
          workerAddress: address,
          description,
          timestamp: new Date().toISOString(),
        })
      );

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = (await res.json()) as { cid?: string; url?: string; error?: string };

      if (!res.ok || !data.cid) {
        throw new Error(data.error ?? "Upload failed");
      }

      const { cid, url } = data as { cid: string; url: string };
      toast.dismiss();
      toast.success(`Stored on Filecoin! CID: ${cid.slice(0, 20)}...`);

      // STEP 2: Submit the CID to the Starknet contract
      setStep("submitting-chain");
      toast.loading("Submitting CID to Starknet...");

      const calls = [
        contract.populate("submit_work_cid", [
          shortString.encodeShortString(jobId),
          cidToFelt252(cid),
        ]),
      ];

      const tx = await sendAsync(calls);

      toast.dismiss();
      setResult({ cid, url, txHash: tx.transaction_hash });
      setStep("done");
      toast.success("Work proof submitted on-chain!");
    } catch (err) {
      console.error(err);
      toast.dismiss();
      toast.error(err instanceof Error ? err.message : "Submission failed");
      setStep("idle");
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Submit Your Work</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Your file is stored permanently on Filecoin. The CID is registered on
            Starknet as tamper-proof work receipt.
          </p>
        </div>

        {!isConnected && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm mb-6 flex items-center justify-between">
            <span>Connect your Starknet wallet to submit work</span>
            <ConnectButton />
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job ID</label>
            <input
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. job-001"
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Work description
            </label>
            <textarea
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={3}
              placeholder="Describe what you delivered..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              file
                ? "border-indigo-400 bg-indigo-50"
                : "border-gray-300 hover:border-indigo-300"
            }`}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <input
              id="file-input"
              type="file"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
            />
            {file ? (
              <div>
                <p className="text-indigo-700 font-medium text-sm">{file.name}</p>
                <p className="text-indigo-500 text-xs mt-1">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <div>
                <p className="text-gray-500 text-sm">Drop your work file here</p>
                <p className="text-gray-400 text-xs mt-1">PDF, image, zip â€” any format</p>
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={step !== "idle" || !isConnected || !file}
            className="w-full bg-indigo-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {step === "uploading-filecoin" && "Uploading to Filecoin..."}
            {step === "submitting-chain" && "Submitting to Starknet..."}
            {step === "idle" && "Submit Work Proof"}
            {step === "done" && "Submitted!"}
          </button>
        </div>

        {result && (
          <div className="mt-6 p-5 bg-green-50 border border-green-200 rounded-xl space-y-3">
            <h3 className="text-green-800 font-medium text-sm">Work proof submitted</h3>

            <div>
              <p className="text-xs text-green-600 font-medium">Filecoin CID</p>
              <p className="text-green-800 text-xs font-mono break-all">{result.cid}</p>
            </div>

            <div>
              <p className="text-xs text-green-600 font-medium">View on IPFS Gateway</p>
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 text-xs underline break-all"
              >
                {result.url}
              </a>
            </div>

            <div>
              <p className="text-xs text-green-600 font-medium">Starknet Transaction</p>
              <a
                href={`https://sepolia.starkscan.co/tx/${result.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 text-xs underline break-all"
              >
                {result.txHash}
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
