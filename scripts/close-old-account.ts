import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

async function closeOldAccount() {
  // Setup
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const programId = new PublicKey("F1z678h8UgZin1Dmt3iEAiR9vF7KWytkaoeGd2hgbBRn");
  const idl = await Program.fetchIdl(programId, provider);
  const program = new Program(idl!, provider);

  const oldUserAccount = new PublicKey("FWvQRwMZAWheL386Gcixjjr8YUjvx8BWTmaFCmWukxsP");
  
  console.log("Attempting to close old user account:", oldUserAccount.toString());
  console.log("Your wallet:", provider.wallet.publicKey.toString());

  try {
    // Try to delete using the delete_user instruction
    const tx = await program.methods
      .deleteUser()
      .accounts({
        user: oldUserAccount,
        signer: provider.wallet.publicKey,
        wallet: provider.wallet.publicKey,
      })
      .rpc();

    console.log("✅ Account closed successfully!");
    console.log("Transaction signature:", tx);
    console.log("SOL has been returned to your wallet.");
  } catch (error: any) {
    console.error("❌ Failed to close account:", error.message);
    console.log("\nThis is expected if the account schema doesn't match.");
    console.log("You'll need to create a new profile from scratch.");
  }
}

closeOldAccount();
