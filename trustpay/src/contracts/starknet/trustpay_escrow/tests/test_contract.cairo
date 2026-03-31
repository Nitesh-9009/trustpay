use starknet::ContractAddress;

use snforge_std::{
    declare, ContractClassTrait, DeclareResultTrait, start_cheat_caller_address,
    stop_cheat_caller_address, start_mock_call,
};

use trustpay_escrow::{ITrustPayEscrowDispatcher, ITrustPayEscrowDispatcherTrait};

// STRK token address on Starknet Sepolia
fn strk() -> ContractAddress {
    0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d_felt252
        .try_into()
        .unwrap()
}

fn employer() -> ContractAddress {
    0x1111_felt252.try_into().unwrap()
}

fn worker() -> ContractAddress {
    0x2222_felt252.try_into().unwrap()
}

fn deploy_escrow() -> ContractAddress {
    let contract = declare("TrustPayEscrow").unwrap().contract_class();
    let (addr, _) = contract.deploy(@array![]).unwrap();
    addr
}

/// Mock STRK token so deposit() can run without a real token contract.
fn mock_strk_for_deposit(escrow: ContractAddress, amount: u256) {
    start_mock_call::<u256>(strk(), selector!("allowance"), amount);
    start_mock_call::<bool>(strk(), selector!("transfer_from"), true);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

#[test]
fn test_deposit_creates_job() {
    let escrow = deploy_escrow();
    let dispatcher = ITrustPayEscrowDispatcher { contract_address: escrow };
    let amount: u256 = 1000_u256;

    mock_strk_for_deposit(escrow, amount);

    start_cheat_caller_address(escrow, employer());
    dispatcher.deposit('job1', worker(), 0);
    stop_cheat_caller_address(escrow);

    let job = dispatcher.get_job('job1');
    assert(job.employer == employer(), 'Wrong employer');
    assert(job.worker == worker(), 'Wrong worker');
    assert(job.amount == amount, 'Wrong amount');
    assert(!job.is_released, 'Should not be released');
    assert(dispatcher.get_job_count() == 1, 'Job count should be 1');
}

#[test]
fn test_submit_work_cid_updates_job() {
    let escrow = deploy_escrow();
    let dispatcher = ITrustPayEscrowDispatcher { contract_address: escrow };

    mock_strk_for_deposit(escrow, 1000_u256);

    start_cheat_caller_address(escrow, employer());
    dispatcher.deposit('job1', worker(), 0);
    stop_cheat_caller_address(escrow);

    start_cheat_caller_address(escrow, worker());
    dispatcher.submit_work_cid('job1', 'QmSomeCIDHash');
    stop_cheat_caller_address(escrow);

    let job = dispatcher.get_job('job1');
    assert(job.work_cid == 'QmSomeCIDHash', 'Wrong work CID');
}

#[test]
fn test_release_payment_marks_job_released() {
    let escrow = deploy_escrow();
    let dispatcher = ITrustPayEscrowDispatcher { contract_address: escrow };

    mock_strk_for_deposit(escrow, 1000_u256);
    start_mock_call::<bool>(strk(), selector!("transfer"), true);

    start_cheat_caller_address(escrow, employer());
    dispatcher.deposit('job1', worker(), 0);
    stop_cheat_caller_address(escrow);

    start_cheat_caller_address(escrow, worker());
    dispatcher.submit_work_cid('job1', 'QmSomeCIDHash');
    stop_cheat_caller_address(escrow);

    start_cheat_caller_address(escrow, employer());
    dispatcher.release_payment('job1');
    stop_cheat_caller_address(escrow);

    let job = dispatcher.get_job('job1');
    assert(job.is_released, 'Should be released');
}

#[test]
#[should_panic(expected: ('Only worker can submit',))]
fn test_only_worker_can_submit() {
    let escrow = deploy_escrow();
    let dispatcher = ITrustPayEscrowDispatcher { contract_address: escrow };

    mock_strk_for_deposit(escrow, 1000_u256);

    start_cheat_caller_address(escrow, employer());
    dispatcher.deposit('job1', worker(), 0);
    // employer tries to submit work — should fail
    dispatcher.submit_work_cid('job1', 'QmFakeCID');
    stop_cheat_caller_address(escrow);
}

#[test]
#[should_panic(expected: ('Only employer can release',))]
fn test_only_employer_can_release() {
    let escrow = deploy_escrow();
    let dispatcher = ITrustPayEscrowDispatcher { contract_address: escrow };

    mock_strk_for_deposit(escrow, 1000_u256);

    start_cheat_caller_address(escrow, employer());
    dispatcher.deposit('job1', worker(), 0);
    stop_cheat_caller_address(escrow);

    start_cheat_caller_address(escrow, worker());
    dispatcher.submit_work_cid('job1', 'QmCID');
    // Worker tries to release — should fail
    dispatcher.release_payment('job1');
    stop_cheat_caller_address(escrow);
}

#[test]
#[should_panic(expected: ('No work CID submitted yet',))]
fn test_cannot_release_without_work_submission() {
    let escrow = deploy_escrow();
    let dispatcher = ITrustPayEscrowDispatcher { contract_address: escrow };

    mock_strk_for_deposit(escrow, 1000_u256);

    start_cheat_caller_address(escrow, employer());
    dispatcher.deposit('job1', worker(), 0); // work_cid = 0, none submitted yet
    dispatcher.release_payment('job1');
    stop_cheat_caller_address(escrow);
}

#[test]
#[should_panic(expected: ('Already released',))]
fn test_cannot_release_twice() {
    let escrow = deploy_escrow();
    let dispatcher = ITrustPayEscrowDispatcher { contract_address: escrow };

    mock_strk_for_deposit(escrow, 1000_u256);
    start_mock_call::<bool>(strk(), selector!("transfer"), true);

    start_cheat_caller_address(escrow, employer());
    dispatcher.deposit('job1', worker(), 0);
    stop_cheat_caller_address(escrow);

    start_cheat_caller_address(escrow, worker());
    dispatcher.submit_work_cid('job1', 'QmCID');
    stop_cheat_caller_address(escrow);

    start_cheat_caller_address(escrow, employer());
    dispatcher.release_payment('job1');
    dispatcher.release_payment('job1'); // second call should fail
    stop_cheat_caller_address(escrow);
}
