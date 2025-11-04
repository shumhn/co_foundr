import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import fs from "fs";
import os from "os";

async function deleteOldProject() {
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
  
  const oldProjectPubkey = new PublicKey("9SoRUrEKJcpeXbxEMSkfcHiqgLcterUVyX4aHseJLRQt");
  
  console.log("🗑️ DELETING OLD PROJECT");
  console.log("Project:", oldProjectPubkey.toString());
  console.log("Your wallet:", wallet.publicKey.toString());

  try {
    const accountInfo = await connection.getAccountInfo(oldProjectPubkey);
    if (!accountInfo) {
      console.log("✅ Project doesn't exist - already deleted!");
      return;
    }

    console.log("\nProject found:");
    console.log("  Size:", accountInfo.data.length, "bytes");
    console.log("  Lamports:", accountInfo.lamports, `(~${(accountInfo.lamports / 1e9).toFixed(4)} SOL)`);
    console.log("  Owner:", accountInfo.owner.toString());

    console.log("\n🔥 Calling deleteProject...");
    
    const tx = await program.methods
      .deleteProject()
      .accounts({
        project: oldProjectPubkey,
        creator: wallet.publicKey,
      })
      .rpc();

    console.log("\n✅ SUCCESS! Project deleted!");
    console.log("TX:", tx);
    console.log(`\n💰 ~${(accountInfo.lamports / 1e9).toFixed(4)} SOL has been returned to your wallet!`);
    console.log("\n🎉 Now you can create a new project with any name!");
    
  } catch (error: any) {
    console.error("\n❌ FAILED:", error.message);
    
    if (error.logs) {
      console.log("\nProgram logs:");
      error.logs.forEach((log: string) => console.log("  ", log));
    }
    
    console.log("\n💡 The project exists but you might not be the creator.");
    console.log("   Only the project creator can delete it.");
  }
}

deleteOldProject().catch(console.error);
