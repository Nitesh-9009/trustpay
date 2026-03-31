/**
 * One-time Storacha setup — NO EMAIL REQUIRED.
 */
import * as Client from "@storacha/client";
import { StoreConf } from "@storacha/client/stores/conf";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const CONF_FILE = path.join(os.homedir(), "AppData", "Roaming", "w3access", "Config", "trustpay.json");
if (fs.existsSync(CONF_FILE)) { fs.unlinkSync(CONF_FILE); }

const store = new StoreConf({ profile: "trustpay" });
const client = await Client.create({ store });

// skipGatewayAuthorization avoids the expired built-in w3s.link proof
const space = await client.createSpace("trustpay-uploads", { skipGatewayAuthorization: true });
await client.setCurrentSpace(space.did());

console.log("\n✅ Space created:", space.did());
console.log("   Run pnpm dev, then upload at http://localhost:3000/submit-work\n");
