#[cfg(test)]
mod tests {
    use litesvm::LiteSVM;
    use solana_keypair::Keypair;
    use solana_signer::Signer;
    use solana_transaction::Transaction;
    use anchor_lang::{InstructionData, ToAccountMetas, prelude::Pubkey, system_program};
    use program::accounts::Initialize;
    use program::instruction::Initialize as InitializeIx;

    #[test]
    fn test_initialize() {
        let mut svm = LiteSVM::new();

        // Load the compiled program into LiteSVM
        svm.add_program_from_file(
            program::ID,
            "../../target/deploy/program.so",
        ).expect("Failed to load program — run `anchor build` first");

        let admin = Keypair::new();
        svm.airdrop(&admin.pubkey(), 1_000_000_000).unwrap();

        let (config_pda, _bump) = Pubkey::find_program_address(
            &[b"config"],
            &program::ID,
        );

        let accounts = Initialize {
            admin: admin.pubkey(),
            config: config_pda,
            system_program: system_program::ID,
        };

        let ix = solana_transaction::Instruction {
            program_id: program::ID,
            accounts: accounts.to_account_metas(None),
            data: InitializeIx { yield_rate_bps: 500 }.data(),
        };

        let hash = svm.latest_blockhash();
        let tx = Transaction::new_signed_with_payer(
            &[ix],
            Some(&admin.pubkey()),
            &[&admin],
            hash,
        );

        let result = svm.send_transaction(tx);
        assert!(result.is_ok(), "initialize failed: {:?}", result);
        println!("✓ initialize passed");
    }
}