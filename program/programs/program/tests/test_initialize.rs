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
    #[test]
    fn test_register_position() {
        let mut svm = LiteSVM::new();
        svm.add_program_from_file(
            program::ID,
            "../../target/deploy/program.so",
        ).expect("Failed to load program");

        let admin = Keypair::new();
        svm.airdrop(&admin.pubkey(), 2_000_000_000).unwrap();

        // Initialize first
        let (config_pda, _) = Pubkey::find_program_address(&[b"config"], &program::ID);
        let init_accounts = program::accounts::Initialize {
            admin: admin.pubkey(),
            config: config_pda,
            system_program: system_program::ID,
        };
        let init_ix = solana_transaction::Instruction {
            program_id: program::ID,
            accounts: init_accounts.to_account_metas(None),
            data: program::instruction::Initialize { yield_rate_bps: 500 }.data(),
        };
        let tx = Transaction::new_signed_with_payer(
            &[init_ix],
            Some(&admin.pubkey()),
            &[&admin],
            svm.latest_blockhash(),
        );
        svm.send_transaction(tx).unwrap();

        // Now register a position
        let mint = Pubkey::new_unique();
        let (position_pda, _) = Pubkey::find_program_address(
            &[b"position", admin.pubkey().as_ref(), mint.as_ref()],
            &program::ID,
        );
        let reg_accounts = program::accounts::RegisterPosition {
            owner: admin.pubkey(),
            config: config_pda,
            position: position_pda,
            system_program: system_program::ID,
        };
        let reg_ix = solana_transaction::Instruction {
            program_id: program::ID,
            accounts: reg_accounts.to_account_metas(None),
            data: program::instruction::RegisterPosition {
                mint,
                amount: 1_000_000_000,
            }.data(),
        };
        let tx = Transaction::new_signed_with_payer(
            &[reg_ix],
            Some(&admin.pubkey()),
            &[&admin],
            svm.latest_blockhash(),
        );

        let result = svm.send_transaction(tx);
        assert!(result.is_ok(), "register_position failed: {:?}", result);
        println!("✓ register_position passed");
    }
    #[test]
    fn test_claim_yield() {
        let mut svm = LiteSVM::new();
        svm.add_program_from_file(
            program::ID,
            "../../target/deploy/program.so",
        ).expect("Failed to load program");

        let admin = Keypair::new();
        svm.airdrop(&admin.pubkey(), 2_000_000_000).unwrap();

        // Initialize
        let (config_pda, _) = Pubkey::find_program_address(&[b"config"], &program::ID);
        let init_ix = solana_transaction::Instruction {
            program_id: program::ID,
            accounts: program::accounts::Initialize {
                admin: admin.pubkey(),
                config: config_pda,
                system_program: system_program::ID,
            }.to_account_metas(None),
            data: program::instruction::Initialize { yield_rate_bps: 500 }.data(),
        };
        svm.send_transaction(Transaction::new_signed_with_payer(
            &[init_ix],
            Some(&admin.pubkey()),
            &[&admin],
            svm.latest_blockhash(),
        )).unwrap();

        // Register position
        let mint = Pubkey::new_unique();
        let (position_pda, _) = Pubkey::find_program_address(
            &[b"position", admin.pubkey().as_ref(), mint.as_ref()],
            &program::ID,
        );
        let reg_ix = solana_transaction::Instruction {
            program_id: program::ID,
            accounts: program::accounts::RegisterPosition {
                owner: admin.pubkey(),
                config: config_pda,
                position: position_pda,
                system_program: system_program::ID,
            }.to_account_metas(None),
            data: program::instruction::RegisterPosition {
                mint,
                amount: 1_000_000_000,
            }.data(),
        };
        svm.send_transaction(Transaction::new_signed_with_payer(
            &[reg_ix],
            Some(&admin.pubkey()),
            &[&admin],
            svm.latest_blockhash(),
        )).unwrap();

        // Warp 120 seconds forward
        // Warp forward some slots (~120 slots)
        // Warp unix timestamp forward 120 seconds
        let mut clock = svm.get_sysvar::<solana_clock::Clock>();
        clock.unix_timestamp += 120;
        svm.set_sysvar(&clock);

        // Claim yield
        let claim_ix = solana_transaction::Instruction {
            program_id: program::ID,
            accounts: program::accounts::ClaimYield {
                owner: admin.pubkey(),
                config: config_pda,
                position: position_pda,
            }.to_account_metas(None),
            data: program::instruction::ClaimYield {}.data(),
        };
        let result = svm.send_transaction(Transaction::new_signed_with_payer(
            &[claim_ix],
            Some(&admin.pubkey()),
            &[&admin],
            svm.latest_blockhash(),
        ));

        assert!(result.is_ok(), "claim_yield failed: {:?}", result);
        println!("✓ claim_yield passed");
    }
    #[test]
    fn test_update_config() {
        let mut svm = LiteSVM::new();
        svm.add_program_from_file(
            program::ID,
            "../../target/deploy/program.so",
        ).expect("Failed to load program");

        let admin = Keypair::new();
        svm.airdrop(&admin.pubkey(), 1_000_000_000).unwrap();

        // Initialize
        let (config_pda, _) = Pubkey::find_program_address(&[b"config"], &program::ID);
        let init_ix = solana_transaction::Instruction {
            program_id: program::ID,
            accounts: program::accounts::Initialize {
                admin: admin.pubkey(),
                config: config_pda,
                system_program: system_program::ID,
            }.to_account_metas(None),
            data: program::instruction::Initialize { yield_rate_bps: 500 }.data(),
        };
        svm.send_transaction(Transaction::new_signed_with_payer(
            &[init_ix],
            Some(&admin.pubkey()),
            &[&admin],
            svm.latest_blockhash(),
        )).unwrap();

        // Update config
        let update_ix = solana_transaction::Instruction {
            program_id: program::ID,
            accounts: program::accounts::UpdateConfig {
                admin: admin.pubkey(),
                config: config_pda,
            }.to_account_metas(None),
            data: program::instruction::UpdateConfig {
                new_rate_bps: 750,
                paused: false,
            }.data(),
        };
        let result = svm.send_transaction(Transaction::new_signed_with_payer(
            &[update_ix],
            Some(&admin.pubkey()),
            &[&admin],
            svm.latest_blockhash(),
        ));
        assert!(result.is_ok(), "update_config failed: {:?}", result);

        // Non-admin should fail
        let rogue = Keypair::new();
        svm.airdrop(&rogue.pubkey(), 1_000_000_000).unwrap();
        let rogue_ix = solana_transaction::Instruction {
            program_id: program::ID,
            accounts: program::accounts::UpdateConfig {
                admin: rogue.pubkey(),
                config: config_pda,
            }.to_account_metas(None),
            data: program::instruction::UpdateConfig {
                new_rate_bps: 9999,
                paused: true,
            }.data(),
        };
        let rogue_result = svm.send_transaction(Transaction::new_signed_with_payer(
            &[rogue_ix],
            Some(&rogue.pubkey()),
            &[&rogue],
            svm.latest_blockhash(),
        ));
        assert!(rogue_result.is_err(), "rogue should have failed");

        println!("✓ update_config passed");
    }
}