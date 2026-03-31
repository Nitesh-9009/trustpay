import { Abi } from "starknet";

export const ESCROW_CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS as string;

export const ESCROW_ABI: Abi = [
  {
    type: "impl",
    name: "TrustPayEscrowImpl",
    interface_name: "trustpay_escrow::ITrustPayEscrow",
  },
  {
    type: "struct",
    name: "core::integer::u256",
    members: [
      { name: "low", type: "core::integer::u128" },
      { name: "high", type: "core::integer::u128" },
    ],
  },
  {
    type: "enum",
    name: "core::bool",
    variants: [
      { name: "False", type: "()" },
      { name: "True", type: "()" },
    ],
  },
  {
    type: "struct",
    name: "trustpay_escrow::Job",
    members: [
      { name: "employer", type: "core::starknet::contract_address::ContractAddress" },
      { name: "worker",   type: "core::starknet::contract_address::ContractAddress" },
      { name: "amount",   type: "core::integer::u256" },
      { name: "work_cid", type: "core::felt252" },
      { name: "is_released", type: "core::bool" },
      { name: "is_disputed", type: "core::bool" },
    ],
  },
  {
    type: "interface",
    name: "trustpay_escrow::ITrustPayEscrow",
    items: [
      {
        type: "function",
        name: "deposit",
        inputs: [
          { name: "job_id", type: "core::felt252" },
          { name: "worker", type: "core::starknet::contract_address::ContractAddress" },
          { name: "work_cid", type: "core::felt252" },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "submit_work_cid",
        inputs: [
          { name: "job_id", type: "core::felt252" },
          { name: "cid",    type: "core::felt252" },
        ],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "release_payment",
        inputs: [{ name: "job_id", type: "core::felt252" }],
        outputs: [],
        state_mutability: "external",
      },
      {
        type: "function",
        name: "get_job",
        inputs: [{ name: "job_id", type: "core::felt252" }],
        outputs: [{ type: "trustpay_escrow::Job" }],
        state_mutability: "view",
      },
      {
        type: "function",
        name: "get_job_count",
        inputs: [],
        outputs: [{ type: "core::integer::u64" }],
        state_mutability: "view",
      },
    ],
  },
  {
    type: "event",
    name: "trustpay_escrow::TrustPayEscrow::JobCreated",
    kind: "struct",
    members: [
      { name: "job_id",   type: "core::felt252", kind: "key" },
      { name: "employer", type: "core::starknet::contract_address::ContractAddress", kind: "data" },
      { name: "worker",   type: "core::starknet::contract_address::ContractAddress", kind: "data" },
      { name: "amount",   type: "core::integer::u256", kind: "data" },
    ],
  },
  {
    type: "event",
    name: "trustpay_escrow::TrustPayEscrow::WorkSubmitted",
    kind: "struct",
    members: [
      { name: "job_id", type: "core::felt252", kind: "key" },
      { name: "cid",    type: "core::felt252", kind: "data" },
    ],
  },
  {
    type: "event",
    name: "trustpay_escrow::TrustPayEscrow::PaymentReleased",
    kind: "struct",
    members: [
      { name: "job_id", type: "core::felt252", kind: "key" },
      { name: "worker", type: "core::starknet::contract_address::ContractAddress", kind: "data" },
      { name: "amount", type: "core::integer::u256", kind: "data" },
    ],
  },
  {
    type: "event",
    name: "trustpay_escrow::TrustPayEscrow::Event",
    kind: "enum",
    variants: [
      { name: "JobCreated",      type: "trustpay_escrow::TrustPayEscrow::JobCreated",      kind: "nested" },
      { name: "WorkSubmitted",   type: "trustpay_escrow::TrustPayEscrow::WorkSubmitted",   kind: "nested" },
      { name: "PaymentReleased", type: "trustpay_escrow::TrustPayEscrow::PaymentReleased", kind: "nested" },
    ],
  },
] as const;

// STRK ERC-20 on Starknet Sepolia (same address on mainnet)
export const STRK_TOKEN_ADDRESS =
  "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";

export const ERC20_APPROVE_ABI: Abi = [
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "core::starknet::contract_address::ContractAddress" },
      { name: "amount",  type: "core::integer::u256" },
    ],
    outputs: [{ type: "core::bool" }],
    state_mutability: "external",
  },
] as const;
