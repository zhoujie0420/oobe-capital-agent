import { Keypair, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import bs58 from "bs58";
import fs from "fs";

export const WELL_KNOWN_MINTS = {
  SOL: new PublicKey("So11111111111111111111111111111111111111112"),
  USDC: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
  USDT: new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"),
  jupSOL: new PublicKey("jupSoLaHXQiZZTSfEWMTRRfpnygnvq8UMFLasNxQphq"),
  bSOL: new PublicKey("bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1"),
};

export function loadKeypair(keyOrPath?: string): Keypair {
  if (!keyOrPath) {
    // Generate an ephemeral keypair if none provided (useful for dry runs/simulations)
    return Keypair.generate();
  }

  // Check if file exists
  if (fs.existsSync(keyOrPath)) {
    const raw = fs.readFileSync(keyOrPath, "utf-8");
    const parsed = JSON.parse(raw);
    return Keypair.fromSecretKey(new Uint8Array(parsed));
  }

  // Treat as base58 secret key
  try {
    const decoded = bs58.decode(keyOrPath);
    return Keypair.fromSecretKey(decoded);
  } catch (err) {
    throw new Error(`Failed to parse Solana private key: ${(err as Error).message}`);
  }
}

export function shortenAddress(address: string | PublicKey, chars: number = 4): string {
  const str = typeof address === "string" ? address : address.toBase58();
  return `${str.slice(0, chars)}...${str.slice(-chars)}`;
}

export { LAMPORTS_PER_SOL };
