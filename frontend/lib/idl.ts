export const HARVESTER_IDL = {
  address: "AujdsDt1vs3RZ497KhoPxzKeRFghdEbjNKVqYSypEP1W",
  metadata: {
    name: "harvester",
    version: "0.1.0",
    spec: "0.1.0",
  },
  instructions: [
    {
      name: "claim_yield",
      discriminator: [49, 74, 111, 7, 186, 22, 61, 165],
      accounts: [
        { name: "owner", writable: true, signer: true },
        { name: "config" },
        { name: "position", writable: true },
        { name: "yield_mint", writable: true },
        { name: "user_yield_ata", writable: true },
        { name: "token_program", address: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
        { name: "associated_token_program", address: "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL" },
        { name: "system_program", address: "11111111111111111111111111111111" },
        { name: "rent", address: "SysvarRent111111111111111111111111111111111" },
      ],
      args: [],
    },
    {
      name: "close_position",
      discriminator: [123, 134, 81, 0, 49, 68, 98, 98],
      accounts: [
        { name: "owner", writable: true, signer: true },
        { name: "position", writable: true },
      ],
      args: [],
    },
    {
      name: "register_position",
      discriminator: [201, 164, 200, 117, 178, 197, 198, 92],
      accounts: [
        { name: "owner", writable: true, signer: true },
        { name: "config" },
        { name: "position", writable: true },
        { name: "system_program", address: "11111111111111111111111111111111" },
      ],
      args: [
        { name: "mint", type: "pubkey" },
        { name: "amount", type: "u64" },
      ],
    },
    {
      name: "update_config",
      discriminator: [29, 158, 252, 191, 10, 83, 219, 99],
      accounts: [
        { name: "admin", signer: true },
        { name: "config", writable: true },
      ],
      args: [
        { name: "new_rate_bps", type: "u64" },
        { name: "paused", type: "bool" },
      ],
    },
  ],
  accounts: [
    { name: "GlobalConfig", discriminator: [149, 8, 156, 202, 160, 252, 176, 217] },
    { name: "UserPosition", discriminator: [251, 248, 209, 245, 83, 234, 17, 27] },
  ],
  errors: [
    { code: 6000, name: "ZeroAmount", msg: "Amount must be greater than zero" },
    { code: 6001, name: "ProtocolPaused", msg: "Protocol is paused" },
    { code: 6002, name: "NoYieldAccrued", msg: "No yield accrued yet" },
    { code: 6003, name: "MathOverflow", msg: "Arithmetic overflow" },
    { code: 6004, name: "InvalidRate", msg: "Rate cannot exceed 10000 bps" },
  ],
} as const;

export type HarvesterIDL = typeof HARVESTER_IDL;