import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

async function nukeAllAccounts() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const programId = new PublicKey("F1z678h8UgZin1Dmt3iEAiR9vF7KWytkaoeGd2hgbBRn");
  const idl = await Program.fetchIdl(programId, provider);
  const program = new Program(idl!, provider);

  console.log("🔥 NUKING ALL OLD ACCOUNTS...");
  console.log("Your wallet:", provider.wallet.publicKey.toString());

  // List of known old account addresses
  const oldAccounts = [
    "FWvQRwMZAWheL386Gcixjjr8YUjvx8BWTmaFCmWukxsP", // Old user account 1
    "4uaiEcTqAgeatnuV2aAFetZff6kYmcx7u3U9PuaZ7nLj", // Old user account 2
  ];

  for (const accountAddress of oldAccounts) {
    try {
      const pubkey = new PublicKey(accountAddress);
      const accountInfo = await provider.connection.getAccountInfo(pubkey);
      
      if (!accountInfo) {
        console.log(`✓ Account ${accountAddress} doesn't exist (already closed)`);
        continue;
      }

      console.log(`\n🗑️  Attempting to close: ${accountAddress}`);
      console.log(`   Size: ${accountInfo.data.length} bytes`);
      console.log(`   Lamports: ${accountInfo.lamports}`);
      
      // Try to call delete_user
      try {
        const tx = await program.methods
          .deleteUser()
          .accounts({
            user: pubkey,
            signer: provider.wallet.publicKey,
            wallet: provider.wallet.publicKey,
          })
          .rpc();
        
        console.log(`✅ Account closed! TX: ${tx}`);
      } catch (error: any) {
        console.log(`❌ Failed to close via program: ${error.message}`);
        console.log(`   This account is orphaned and can't be closed.`);
      }
    } catch (error: any) {
      console.error(`Error processing ${accountAddress}:`, error.message);
    }
  }

  console.log("\n✅ CLEANUP COMPLETE!");
  console.log("\n📝 Next steps:");
  console.log("   1. Refresh your browser");
  console.log("   2. Go to http://localhost:3000/profile");
  console.log("   3. Create a fresh profile with all fields");
  console.log("\n🎉 You now have a clean slate!");
}

nukeAllAccounts().catch(console.error);
