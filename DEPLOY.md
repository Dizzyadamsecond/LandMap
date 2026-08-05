# LandMap Deployment Guide

## Phase 1: Payments (✅ Live)
- **Status:** Production ready
- **API:** `/api/billing/*` (Mercado Pago + Stripe)
- **Web:** `/checkout`, `/api-keys`
- **Deploy:** Already live on `landmapprod.vercel.app`

## Phase 2: $LAND Token (Testnet)

### Prerequisites
```bash
npm install -g foundry  # or use cargo install foundry-rs
export RPC_URL=https://sepolia.base.org
export PRIVATE_KEY=0x...  # deployer account with ETH
export MULTISIG_ADDRESS=0x...  # Gnosis Safe (3-of-5 or your config)
```

### Deploy LandToken.sol to Base Sepolia
```bash
cd packages/token/src/contracts
forge build
forge create --rpc-url $RPC_URL --private-key $PRIVATE_KEY LandToken.sol:LandToken
```

**Output:** Note the deployed contract address → set in `.env.local`
```
LAND_TOKEN_ADDRESS=0x...
```

### Initialize Bridge
```bash
# 1. Set minter to multisig
cast send $LAND_TOKEN_ADDRESS "setMinter(address)" $MULTISIG_ADDRESS \
  --rpc-url $RPC_URL --private-key $PRIVATE_KEY

# 2. Test mint (from multisig, via Safe UI or script)
# Will fail until Gnosis Safe transaction is approved
```

### Frontend Integration
```bash
# Update apps/web/.env.local
NEXT_PUBLIC_LAND_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_LAND_CHAIN=sepolia
```

### Launch Testnet Bridge
```bash
pnpm --filter @landmap/web dev
# Navigate to /portfolio → "Connect Wallet" button
# Test: LandCoins → $LAND mint on Sepolia
```

## Phase 3: Mainnet ($LAND → Base)
**Blocked until:**
- [ ] Phase 1 (Legal) compliance resolved
- [ ] 100+ testnet transactions successful
- [ ] Security audit of LandToken.sol

**Mainnet checklist:**
- [ ] Deploy LandToken to Base mainnet
- [ ] Deploy Uniswap v3 pool ($LAND/USDC)
- [ ] 4-of-7 multisig for minting control
- [ ] KYC/AML stubs enabled

## Vercel Deployment
```bash
vercel --prod  # from repo root
# or push to main branch (auto-deploy via GitHub)
```

## Monitoring
- **API health:** `landmapprod.vercel.app/api/_probe`
- **Costs:** `https://landmapprod.vercel.app/admin/costs` (auth required)
- **Token bridge:** `/api/token/balance` (Sepolia testnet)
