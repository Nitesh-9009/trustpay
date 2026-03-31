use starknet::ContractAddress;

#[derive(Drop, Copy, Serde, starknet::Store)]
pub struct Job {
    pub employer: ContractAddress,
    pub worker: ContractAddress,
    pub amount: u256,
    pub work_cid: felt252,
    pub is_released: bool,
    pub is_disputed: bool,
}

#[starknet::interface]
trait IERC20<TContractState> {
    fn transfer(ref self: TContractState, recipient: ContractAddress, amount: u256) -> bool;
    fn transfer_from(
        ref self: TContractState,
        sender: ContractAddress,
        recipient: ContractAddress,
        amount: u256,
    ) -> bool;
    fn allowance(
        self: @TContractState, owner: ContractAddress, spender: ContractAddress,
    ) -> u256;
}

#[starknet::interface]
pub trait ITrustPayEscrow<TContractState> {
    /// Employer calls this after approving STRK tokens to the contract.
    /// The deposited amount equals the current allowance(caller, contract).
    fn deposit(
        ref self: TContractState,
        job_id: felt252,
        worker: ContractAddress,
        work_cid: felt252,
    );
    /// Worker submits their IPFS CID as proof of completed work.
    fn submit_work_cid(ref self: TContractState, job_id: felt252, cid: felt252);
    /// Employer approves the work and releases payment to the worker.
    fn release_payment(ref self: TContractState, job_id: felt252);
    fn get_job(self: @TContractState, job_id: felt252) -> Job;
    fn get_job_count(self: @TContractState) -> u64;
}

#[starknet::contract]
mod TrustPayEscrow {
    use super::{Job, IERC20Dispatcher, IERC20DispatcherTrait};
    use starknet::{ContractAddress, get_caller_address, get_contract_address, contract_address_const};
    use starknet::storage::{
        StoragePointerReadAccess, StoragePointerWriteAccess, StoragePathEntry, Map,
    };

    // STRK token on Starknet Sepolia (same address on mainnet)
    fn strk_address() -> ContractAddress {
        contract_address_const::<0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d>()
    }

    #[storage]
    struct Storage {
        jobs: Map<felt252, Job>,
        job_count: u64,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        JobCreated: JobCreated,
        WorkSubmitted: WorkSubmitted,
        PaymentReleased: PaymentReleased,
    }

    #[derive(Drop, starknet::Event)]
    struct JobCreated {
        #[key]
        job_id: felt252,
        employer: ContractAddress,
        worker: ContractAddress,
        amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct WorkSubmitted {
        #[key]
        job_id: felt252,
        cid: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct PaymentReleased {
        #[key]
        job_id: felt252,
        worker: ContractAddress,
        amount: u256,
    }

    #[abi(embed_v0)]
    impl TrustPayEscrowImpl of super::ITrustPayEscrow<ContractState> {
        fn deposit(
            ref self: ContractState,
            job_id: felt252,
            worker: ContractAddress,
            work_cid: felt252,
        ) {
            let caller = get_caller_address();
            let contract = get_contract_address();
            let token = IERC20Dispatcher { contract_address: strk_address() };

            let amount = token.allowance(caller, contract);
            assert(amount > 0_u256, 'No allowance set');

            token.transfer_from(caller, contract, amount);

            self
                .jobs
                .entry(job_id)
                .write(
                    Job {
                        employer: caller,
                        worker,
                        amount,
                        work_cid,
                        is_released: false,
                        is_disputed: false,
                    },
                );
            self.job_count.write(self.job_count.read() + 1);

            self.emit(JobCreated { job_id, employer: caller, worker, amount });
        }

        fn submit_work_cid(ref self: ContractState, job_id: felt252, cid: felt252) {
            let caller = get_caller_address();
            let mut job = self.jobs.entry(job_id).read();
            assert(caller == job.worker, 'Only worker can submit');
            assert(!job.is_released, 'Job already paid');

            job.work_cid = cid;
            self.jobs.entry(job_id).write(job);

            self.emit(WorkSubmitted { job_id, cid });
        }

        fn release_payment(ref self: ContractState, job_id: felt252) {
            let caller = get_caller_address();
            let mut job = self.jobs.entry(job_id).read();
            assert(caller == job.employer, 'Only employer can release');
            assert(!job.is_released, 'Already released');
            assert(job.work_cid != 0, 'No work CID submitted yet');

            job.is_released = true;
            self.jobs.entry(job_id).write(job);

            IERC20Dispatcher { contract_address: strk_address() }
                .transfer(job.worker, job.amount);

            self.emit(PaymentReleased { job_id, worker: job.worker, amount: job.amount });
        }

        fn get_job(self: @ContractState, job_id: felt252) -> Job {
            self.jobs.entry(job_id).read()
        }

        fn get_job_count(self: @ContractState) -> u64 {
            self.job_count.read()
        }
    }
}
