import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";

async function forceCloseAccount() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const programId = new PublicKey("F1z678h8UgZin1Dmt3iEAiR9vF7KWytkaoeGd2hgbBRn");
  const oldAccountPubkey = new PublicKey("FWvQRwMZAWheL386Gcixjjr8YUjvx8BWTmaFCmWukxsP");
  
  console.log("🔥 FORCE CLOSING OLD ACCOUNT");
  console.log("Account:", oldAccountPubkey.toString());
  console.log("Your wallet:", provider.wallet.publicKey.toString());

  try {
    // Load the IDL
    const idl = await Program.fetchIdl(programId, provider);
    if (!idl) {
      throw new Error("Could not fetch IDL");
    }
    const program = new Program(idl, provider);

    // Get account info to determine bump
    const accountInfo = await provider.connection.getAccountInfo(oldAccountPubkey);
    if (!accountInfo) {
      console.log("✅ Account doesn't exist - already closed!");
      return;
    }

    console.log("Account exists:");
    console.log("  Size:", accountInfo.data.length, "bytes");
    console.log("  Lamports:", accountInfo.lamports);
    console.log("  Owner:", accountInfo.owner.toString());

    // Try to call deleteUser - we'll manually specify the accounts
    console.log("\n🗑️ Attempting to delete account...");
    
    const tx = await program.methods
      .deleteUser()
      .accounts({
        user: oldAccountPubkey,
        signer: provider.wallet.publicKey,
        wallet: provider.wallet.publicKey,
      })
      .rpc();

    console.log("✅ SUCCESS! Account closed!");
    console.log("Transaction:", tx);
    console.log("\n💰 SOL has been returned to your wallet!");
    console.log("\n🎉 Now you can create a fresh profile!");
    
  } catch (error: any) {
    console.error("\n❌ Failed:", error.message);
    
    if (error.message.includes("ConstraintSeeds")) {
      console.log("\n⚠️ PDA seeds don't match - this account can't be closed via the program.");
      console.log("\n💡 SOLUTION: Use a different wallet to start fresh.");
      console.log("   The old account (~0.005 SOL) will remain orphaned.");
    }
  }
}

forceCloseAccount().catch(console.error);
