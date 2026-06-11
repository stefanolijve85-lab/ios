# Glass Bridge — Data Model (ER Diagram)

```mermaid
erDiagram
    USERS ||--o{ ROUNDS : plays
    USERS ||--o{ CHAT_MESSAGES : posts
    USERS ||--o{ AUDIT_LOG : "acts in"

    USERS {
        text    id PK
        text    username UK
        text    email
        text    password_hash
        numeric balance
        bool    is_admin
        bool    is_muted
        bigint  muted_until
        text    client_seed
        bigint  nonce
        bigint  created_at
    }

    ROUNDS {
        text    id PK
        text    user_id FK
        text    username
        numeric bet
        numeric multiplier
        numeric payout
        text    status "cashed_out | busted"
        int     rows_cleared
        text    server_seed
        text    server_seed_hash
        text    client_seed
        bigint  nonce
        bigint  created_at
    }

    CHAT_MESSAGES {
        text   id PK
        text   user_id FK
        text   username
        text   body
        bigint created_at
    }

    AUDIT_LOG {
        text   id PK
        text   actor_id "FK (nullable)"
        text   action
        text   detail
        bigint created_at
    }

    GAME_CONFIG {
        int   id PK "always 1"
        jsonb config
    }
```

## Notes

- **users.nonce** increments after every finalized round, guaranteeing each
  round under a `(server_seed, client_seed)` pair uses fresh entropy.
- **rounds** stores the *revealed* `server_seed` plus its pre-published
  `server_seed_hash`, so any historical round is independently verifiable.
- Monetary columns use `NUMERIC` to avoid floating-point drift on balances.
- **game_config** is a single-row table holding the live multiplier ladder,
  house edge and bet limits set from the admin panel.
- Timestamps are epoch milliseconds (`BIGINT`) for portability between the
  in-memory and PostgreSQL stores.
