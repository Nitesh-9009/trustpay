// src/lib.rs — TrustPay NEAR Payment Agent Contract
use near_sdk::store::IterableMap;
use near_sdk::{env, near, AccountId, BorshStorageKey, NearToken, Promise};

#[derive(near_sdk::borsh::BorshSerialize, BorshStorageKey)]
#[borsh(crate = "near_sdk::borsh")]
pub enum StorageKey {
    Jobs,
}

#[near(serializers = [borsh, json])]
#[derive(Clone)]
pub struct Job {
    pub employer: AccountId,
    pub worker: AccountId,
    pub amount: NearToken,
    pub work_cid: String, // Filecoin CID — empty until worker submits
    pub is_released: bool,
}

#[near(contract_state)]
pub struct TrustPayNear {
    pub jobs: IterableMap<String, Job>,
    pub owner: AccountId,
}

impl Default for TrustPayNear {
    fn default() -> Self {
        env::panic_str("Contract must be initialized with new()")
    }
}

#[near]
impl TrustPayNear {
    #[init]
    pub fn new() -> Self {
        Self {
            jobs: IterableMap::new(StorageKey::Jobs),
            owner: env::predecessor_account_id(),
        }
    }

    /// Employer creates and funds a job — attach NEAR as payment.
    #[payable]
    pub fn create_job(&mut self, job_id: String, worker: AccountId) {
        let deposit = env::attached_deposit();
        assert!(deposit.as_yoctonear() > 0, "Must attach NEAR as payment");
        assert!(self.jobs.get(&job_id).is_none(), "Job ID already exists");

        self.jobs.insert(
            job_id.clone(),
            Job {
                employer: env::predecessor_account_id(),
                worker: worker.clone(),
                amount: deposit,
                work_cid: String::new(),
                is_released: false,
            },
        );

        env::log_str(&format!(
            "Job {} created. Worker: {}, Amount: {} yoctoNEAR",
            job_id,
            worker,
            deposit.as_yoctonear()
        ));
    }

    /// Worker submits their Filecoin CID as work proof.
    pub fn submit_work(&mut self, job_id: String, filecoin_cid: String) {
        let caller = env::predecessor_account_id();
        let job = self.jobs.get_mut(&job_id).expect("Job not found");

        assert_eq!(caller, job.worker, "Only the assigned worker can submit work");
        assert!(!job.is_released, "Payment already released");
        assert!(!filecoin_cid.is_empty(), "CID cannot be empty");

        job.work_cid = filecoin_cid.clone();

        env::log_str(&format!(
            "Work submitted for job {}. Filecoin CID: {}",
            job_id, filecoin_cid
        ));
    }

    /// Employer approves the work and triggers NEAR payment to worker.
    pub fn release_payment(&mut self, job_id: String) -> Promise {
        let caller = env::predecessor_account_id();
        let job = self.jobs.get_mut(&job_id).expect("Job not found");

        assert_eq!(caller, job.employer, "Only employer can release");
        assert!(!job.is_released, "Already released");
        assert!(!job.work_cid.is_empty(), "Worker hasn't submitted CID yet");

        job.is_released = true;
        let worker = job.worker.clone();
        let amount = job.amount;

        env::log_str(&format!(
            "Releasing {} yoctoNEAR to {} for job {}",
            amount.as_yoctonear(),
            worker,
            job_id
        ));

        Promise::new(worker).transfer(amount)
    }

    // View functions
    pub fn get_job(&self, job_id: String) -> Option<Job> {
        self.jobs.get(&job_id).cloned()
    }

    pub fn get_all_jobs(&self) -> Vec<(String, Job)> {
        self.jobs.iter().map(|(k, v)| (k.clone(), v.clone())).collect()
    }
}
