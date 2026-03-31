// src/lib/storacha.ts
// Upload logic has moved to src/app/api/upload/route.ts (server-side).
// This file only exports the on-chain CID encoding helper.

// Convert a CID string to a felt252 for Starknet (max 31 ASCII bytes).
// The full CID is retrievable via the IPFS gateway URL returned by the upload API.
export function cidToFelt252(cid: string): string {
  const truncated = cid.slice(0, 31);
  let hex = "0x";
  for (let i = 0; i < truncated.length; i++) {
    hex += truncated.charCodeAt(i).toString(16).padStart(2, "0");
  }
  return hex;
}

