# @landmap/token — $LAND ERC-20 on Base

## Overview
Native token for LandMap marketplace. Bridges off-chain LandCoins (gamification) to on-chain $LAND (Base L2).

## Architecture

```
LandCoins (off-chain)           $LAND (on-chain)
├─ UserProgress.landcoins       ├─ LandToken.sol (ERC-20)
├─ CoinLedger (DB)              ├─ Bridge (mint/burn)
└─ Redeemable as cashback       └─ Uniswap v3 pool (DEX)
    ↓
    └─→ Bridge: redeemLandcoins(landcoins) → mint $LAND
```

## Deployment

### Testnet (Base Sepolia)
```bash
# 1. Setup
export PRIVATE_KEY=0x...          # deployer account (needs ETH)
export MULTISIG_ADDRESS=0x...     # Gnosis Safe for minting control
export RPC_URL=https://sepolia.base.org

# 2. Build & test
pnpm install
pnpm run forge:build
pnpm run forge:test

# 3. Deploy
forge script scripts/Deploy.s.sol --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast

# 4. Verify deployment
# → Save contract address to .env.local: LAND_TOKEN_ADDRESS=0x...
# → Check balance: cast call $LAND_TOKEN_ADDRESS "balanceOf(address)(uint256)" $MULTISIG_ADDRESS
```

### Mainnet (Base)
Same as testnet, but:
```bash
export RPC_URL=https://mainnet.base.org
```

**⚠️ Gate:** Mainnet blocked until Phase 1 (legal) compliance resolved. See `../../../DEPLOY.md`.

## Smart Contract

**LandToken.sol** (ERC-20 standard)
- Supply cap: 1,000,000,000 $LAND
- Mint: restricted to multisig address
- Burn: open (any holder can burn their tokens)
- No pause/blacklist functions (prevents centralization red flags)

## Bridge API

### Link Wallet
```bash
curl -X POST http://localhost:4000/token/wallet/link \
  -H "x-user-id: user123" \
  -d '{"wallet_address":"0x...","signature":"0x...","message":"...","chain":"sepolia"}'
```

### Redeem LandCoins → $LAND
```bash
curl -X POST http://localhost:4000/token/redeem \
  -H "x-user-id: user123" \
  -d '{"landcoins_amount":100,"chain":"sepolia"}'
```

### Get Balance
```bash
curl http://localhost:4000/token/balance \
  -H "x-user-id: user123"
```

## Testing

### Unit Tests (Foundry)
```bash
pnpm run forge:test
```

Tests:
- Supply cap enforcement
- Minter-only access control
- Burn functionality

### E2E Flow (Testnet)
1. Deploy contract to Base Sepolia
2. Link wallet via `/token/wallet/link`
3. Redeem 100 LandCoins via `/token/redeem`
4. Check $LAND balance on Sepolia (Basescan)
5. Test swap on Uniswap v3 (testnet pool)

## Frontend Integration

See `apps/web/src/lib/token-api.ts` for client functions:
- `linkWallet(input)` — Connect wallet
- `redeemLandcoins(input)` — Mint $LAND
- `getTokenBalance()` — Get balance
- `getMintRequestStatus(requestId)` — Poll mint status

## Governance

Minting controlled by **Gnosis Safe multisig** (3-of-7 or configured). This ensures:
- No centralized power over token supply
- Clear governance process for new mints
- Emergency pause via multisig vote

## Timeline

| Phase | Status | Date |
|-------|--------|------|
| Phase 2A: Testnet deploy | ⏳ Ready | 2026-08-05 |
| Phase 2B: Bridge integration | ⏳ Ready | 2026-08-05 |
| Phase 2C: E2E testing | ⏳ Ready | 2026-08-05 |
| Phase 3: Mainnet (blocked) | 🚫 Legal gate | TBD |
| Phase 4: DEX liquidity | 🚫 Legal gate | TBD |
| Phase 5: Fundraising | 🚫 Legal gate | TBD |

## References

- Deployment: `../../DEPLOY.md`
- Plan: `../../.claude/plans/sam-altman-veja-o-que-greedy-meadow.md`
- Types: `src/bridge.ts`
- API routes: `packages/api/src/routes/token.ts`
