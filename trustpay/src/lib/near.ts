// src/lib/near.ts
import { connect, keyStores, Near } from "near-api-js";

const NEAR_CONTRACT_ID = process.env.NEXT_PUBLIC_NEAR_CONTRACT_ID!;
const NEAR_NETWORK = process.env.NEXT_PUBLIC_NEAR_NETWORK || "testnet";

export async function getNearConnection(): Promise<Near> {
  const keyStore = new keyStores.BrowserLocalStorageKeyStore();

  return await connect({
    networkId: NEAR_NETWORK,
    keyStore,
    nodeUrl: `https://rpc.${NEAR_NETWORK}.near.org`,
  });
}

// Submit work CID to NEAR contract (called by the worker)
export async function submitWorkToNear(
  jobId: string,
  filecoinCid: string,
  accountId: string
) {
  const near = await getNearConnection();
  const account = await near.account(accountId);

  return await account.functionCall({
    contractId: NEAR_CONTRACT_ID,
    methodName: "submit_work",
    args: { job_id: jobId, filecoin_cid: filecoinCid },
    gas: BigInt("30000000000000"), // 30 TGas
  });
}

// Employer releases payment
export async function releaseNearPayment(jobId: string, accountId: string) {
  const near = await getNearConnection();
  const account = await near.account(accountId);

  return await account.functionCall({
    contractId: NEAR_CONTRACT_ID,
    methodName: "release_payment",
    args: { job_id: jobId },
    gas: BigInt("30000000000000"),
  });
}
