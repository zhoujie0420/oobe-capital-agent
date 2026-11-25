"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const web3_js_1 = require("@solana/web3.js");
const bs58_1 = __importDefault(require("bs58"));
function main() {
    const kp = web3_js_1.Keypair.generate();
    const secretBase58 = bs58_1.default.encode(kp.secretKey);
    const publicKey = kp.publicKey.toBase58();
    console.log("================================================================================");
    console.log("             NEW OOBE SOLANA CAPITAL AGENT WALLET GENERATED                     ");
    console.log("================================================================================");
    console.log(`Public Key (Deposit Address): ${publicKey}`);
    console.log(`Private Key (Base58 Secret):  ${secretBase58}`);
    console.log("--------------------------------------------------------------------------------");
    console.log("To activate your autonomous agent for the Steve Capital Challenge:");
    console.log("1. Add the private key to your .env file: AGENT_PRIVATE_KEY=" + secretBase58);
    console.log("2. Fund the wallet with at least 20 USDC and 0.05 SOL (for gas reserve).");
    console.log("3. Register and monitor your agent on Steve Arena: https://steve.oobeprotocol.ai");
    console.log("================================================================================");
}
main();
