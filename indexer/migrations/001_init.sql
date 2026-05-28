CREATE TABLE IF NOT EXISTS positions (
    id                   SERIAL      PRIMARY KEY,
    owner                TEXT        NOT NULL,
    mint                 TEXT        NOT NULL,
    amount               NUMERIC(38) NOT NULL DEFAULT 0,
    tier                 TEXT        NOT NULL DEFAULT 'Retail'
                            CHECK (tier IN ('Retail','Institutional','Wholesale')),
    last_claim_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    total_claimed        NUMERIC(38) NOT NULL DEFAULT 0,
    accrued_yield        NUMERIC(38) NOT NULL DEFAULT 0,
    registered_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_owner_mint UNIQUE (owner, mint)
);

CREATE INDEX IF NOT EXISTS idx_positions_owner ON positions (owner);
CREATE INDEX IF NOT EXISTS idx_positions_tier  ON positions (tier);
CREATE INDEX IF NOT EXISTS idx_positions_total_claimed
    ON positions (total_claimed DESC);

CREATE TABLE IF NOT EXISTS claim_history (
    id                  SERIAL      PRIMARY KEY,
    owner               TEXT        NOT NULL,
    mint                TEXT        NOT NULL,
    yield_amount        NUMERIC(38) NOT NULL,
    total_claimed_after NUMERIC(38) NOT NULL,
    tx_signature        TEXT        NOT NULL UNIQUE,
    slot                BIGINT      NOT NULL,
    claimed_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_history_owner ON claim_history (owner);
CREATE INDEX IF NOT EXISTS idx_history_slot  ON claim_history (slot DESC);
CREATE INDEX IF NOT EXISTS idx_history_owner_claimed
    ON claim_history (owner, claimed_at DESC);