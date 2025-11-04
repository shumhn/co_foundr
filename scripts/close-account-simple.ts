import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import fs from "fs";
import os from "os";

async function closeAccount() {
  // Setup connection
  const connection = new anchor.web3.Connection("https://api.devnet.solana.com", "confirmed");
  
  // Load wallet
  const keypairPath = `${os.homedir()}/.config/solana/devnet-keypair.json`;
  const keypairData = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
  const keypair = anchor.web3.Keypair.fromSecretKey(new Uint8Array(keypairData));
  const wallet = new Wallet(keypair);
  
  const provider = new AnchorProvider(connection, wallet, {});
  anchor.setProvider(provider);

  // Load IDL from local file
  const idlPath = "./target/idl/devcol_solana.json";
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));
  
  const programId = new PublicKey("F1z678h8UgZin1Dmt3iEAiR9vF7KWytkaoeGd2hgbBRn");
  const program = new Program(idl, programId, provider);
  
  const oldAccountPubkey = new PublicKey("FWvQRwMZAWheL386Gcixjjr8YUjvx8BWTmaFCmWukxsP");
  
  console.log("🔥 ATTEMPTING TO CLOSE OLD ACCOUNT");
  console.log("Account:", oldAccountPubkey.toString());
  console.log("Wallet:", wallet.publicKey.toString());

  try {
    const accountInfo = await connection.getAccountInfo(oldAccountPubkey);
    if (!accountInfo) {
      console.log("✅ Account doesn't exist!");
      return;
    }

    console.log("\nAccount found:");
    console.log("  Size:", accountInfo.data.length, "bytes");
    console.log("  Lamports:", accountInfo.lamports);

    console.log("\n🗑️ Calling deleteUser...");
    
    const tx = await program.methods
      .deleteUser()
      .accounts({
        user: oldAccountPubkey,
        signer: wallet.publicKey,
        wallet: wallet.publicKey,
      })
      .rpc();

    console.log("\n✅ SUCCESS! Account closed!");
    console.log("TX:", tx);
    console.log("\n🎉 Now refresh your browser and create a new profile!");
    
  } catch (error: any) {
    console.error("\n❌ FAILED:", error.message);
    
    if (error.logs) {
      console.log("\nProgram logs:");
      error.logs.forEach((log: string) => console.log("  ", log));
    }
    
    console.log("\n💡 The account exists but can't be closed due to PDA mismatch.");
    console.log("   This means it was created with different seeds.");
    console.log("\n🔧 FINAL SOLUTION: Use a different Phantom wallet.");
    console.log("   The old account (~0.005 SOL) will remain orphaned.");
  }
}

closeAccount().catch(console.error);
