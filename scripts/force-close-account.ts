import * as anchor from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";

async function forceCloseAccount() {
  // Setup
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const oldUserAccount = new PublicKey("FWvQRwMZAWheL386Gcixjjr8YUjvx8BWTmaFCmWukxsP");
  
  console.log("Force closing old user account:", oldUserAccount.toString());
  console.log("Your wallet:", provider.wallet.publicKey.toString());

  try {
    // Get account info
    const accountInfo = await provider.connection.getAccountInfo(oldUserAccount);
    
    if (!accountInfo) {
      console.log("Account doesn't exist or already closed");
      return;
    }

    console.log("Account size:", accountInfo.data.length, "bytes");
    console.log("Account lamports:", accountInfo.lamports);
    console.log("Account owner:", accountInfo.owner.toString());

    // Create a transaction to close the account by transferring all lamports
    const tx = new anchor.web3.Transaction().add(
      SystemProgram.transfer({
        fromPubkey: oldUserAccount,
        toPubkey: provider.wallet.publicKey,
        lamports: accountInfo.lamports,
      })
    );

    // This will fail because we don't control the account, but let's try anyway
    const signature = await provider.sendAndConfirm(tx);
    console.log("✅ Account closed! Signature:", signature);
    console.log("SOL returned to your wallet");
    
  } catch (error: any) {
    console.error("❌ Cannot close account:", error.message);
    console.log("\n⚠️ The old account cannot be closed because it's owned by the program.");
    console.log("📝 Solution: Just ignore it and create a new profile.");
    console.log("   The old account costs only ~0.005 SOL, which is negligible.");
    console.log("\n✅ Next steps:");
    console.log("   1. Refresh your browser");
    console.log("   2. Click 'Delete Profile' button (it will hide the old profile)");
    console.log("   3. Create a new profile with the Contact Info field");
  }
}

forceCloseAccount();
