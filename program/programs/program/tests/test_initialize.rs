#[cfg(test)]
mod tests {
    use litesvm::LiteSVM;
    use solana_keypair::Keypair;
    use solana_signer::Signer;
    use solana_transaction::Transaction;
    use anchor_lang::{InstructionData, ToAccountMetas, prelude::Pubkey, system_program};
    use anchor_lang::prelude::rent;

    fn setup_svm() -> LiteSVM {
        let mut svm = LiteSVM::new();
        svm.add_program_from_file(
            program::ID,
            "../../target/deploy/program.so",
        ).expect("Failed to load program");
        svm
    }

    fn do_initialize(svm: &mut LiteSVM, admin: &Keypair, yield_mint: &Keypair) -> Pubkey {
        let (config_pda, _) = Pubkey::find_program_address(&[b"config"], &program::ID);
        let ix = solana_transaction::Instruction {
            program_id: program::ID,
            accounts: program::accounts::Initialize {
                admin: admin.pubkey(),
                config: config_pda,
                yield_mint: yield_mint.pubkey(),
                token_program: anchor_spl::token::ID,
                system_program: system_program::ID,
            }.to_account_metas(None),
            data: program::instruction::Initialize { yield_rate_bps: 500 }.data(),
        };
        svm.send_transaction(Transaction::new_signed_with_payer(
            &[ix],
            Some(&admin.pubkey()),
            &[admin, yield_mint],
            svm.latest_blockhash(),
        )).expect("initialize failed");
        config_pda
    }

    #[test]
    fn test_initialize() {
        let mut svm = setup_svm();
        let admin = Keypair::new();
        let yield_mint = Keypair::new();
        svm.airdrop(&admin.pubkey(), 2_000_000_000).unwrap();

        let config_pda = do_initialize(&mut svm, &admin, &yield_mint);
        println!("✓ initialize passed. Config: {}", config_pda);
    }

    #[test]
    fn test_register_position() {
        let mut svm = setup_svm();
        let admin = Keypair::new();
        let yield_mint = Keypair::new();
        svm.airdrop(&admin.pubkey(), 2_000_000_000).unwrap();

        let config_pda = do_initialize(&mut svm, &admin, &yield_mint);

        let mint = Pubkey::new_unique();
        let (position_pda, _) = Pubkey::find_program_address(
            &[b"position", admin.pubkey().as_ref(), mint.as_ref()],
            &program::ID,
        );
        let ix = solana_transaction::Instruction {
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
        let result = svm.send_transaction(Transaction::new_signed_with_payer(
            &[ix],
            Some(&admin.pubkey()),
            &[&admin],
            svm.latest_blockhash(),
        ));
        assert!(result.is_ok(), "register_position failed: {:?}", result);
        println!("✓ register_position passed");
    }

    #[test]
    fn test_claim_yield() {
        let mut svm = setup_svm();
        let admin = Keypair::new();
        let yield_mint = Keypair::new();
        svm.airdrop(&admin.pubkey(), 2_000_000_000).unwrap();

        let config_pda = do_initialize(&mut svm, &admin, &yield_mint);

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

        // Warp time forward
        let mut clock = svm.get_sysvar::<solana_clock::Clock>();
        clock.unix_timestamp += 120;
        svm.set_sysvar(&clock);

        let user_yield_ata = anchor_spl::associated_token::get_associated_token_address(
            &admin.pubkey(),
            &yield_mint.pubkey(),
        );
        let claim_ix = solana_transaction::Instruction {
            program_id: program::ID,
            accounts: program::accounts::ClaimYield {
                owner: admin.pubkey(),
                config: config_pda,
                position: position_pda,
                yield_mint: yield_mint.pubkey(),
                user_yield_ata,
                token_program: anchor_spl::token::ID,
                associated_token_program: anchor_spl::associated_token::ID,
                system_program: system_program::ID,
                rent: rent::ID,
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
        let mut svm = setup_svm();
        let admin = Keypair::new();
        let yield_mint = Keypair::new();
        svm.airdrop(&admin.pubkey(), 2_000_000_000).unwrap();

        let config_pda = do_initialize(&mut svm, &admin, &yield_mint);

        let ix = solana_transaction::Instruction {
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
            &[ix],
            Some(&admin.pubkey()),
            &[&admin],
            svm.latest_blockhash(),
        ));
        assert!(result.is_ok(), "update_config failed: {:?}", result);
        println!("✓ update_config passed");
    }
}