# Cryptographic Bounty Board

A decentralized platform for posting and solving cryptographic challenges with token rewards, built on the PQC-compatible blockchain with post-quantum cryptography (PQC) compatibility.

## Overview

The Cryptographic Bounty Board enables:
- Researchers to find and solve cryptographic challenges
- Organizations to post bounties for cryptographic work
- Community-driven reputation and leaderboard system
- Secure reward distribution via smart contracts

## Features

- Browse and filter cryptographic bounties by category, difficulty, and status
- Create bounties with token rewards
- Submit solutions with code, IPFS links, or documentation
- Review and approve/reject submissions (for bounty creators)
- Reputation system with levels (Novice to Legend)
- Leaderboard showcasing top researchers
- Personal dashboard with activity tracking

## Technology Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI Components**: Custom components with Radix UI primitives
- **Blockchain**: PQC-compatible (EVM-compatible with ML-DSA-44 signatures)
- **Web3**: ethers.js v6
- **Smart Contracts**: Solidity 0.8.20, Hardhat

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- MetaMask or compatible wallet

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/bounty-board.git
cd bounty-board

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Smart Contract Development

```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to local network
npx hardhat node
npx hardhat run scripts/deploy-local.js --network localhost
```

## Project Structure

```
bounty-board/
├── contracts/           # Solidity smart contracts
│   ├── BountyBoard.sol
│   └── ReputationSystem.sol
├── test/               # Contract test files
├── scripts/            # Deployment scripts
├── src/
│   ├── app/            # Next.js pages
│   ├── components/     # React components
│   │   ├── layout/     # Layout components
│   │   └── ui/         # UI primitives
│   ├── contexts/       # React contexts
│   ├── hooks/          # Custom hooks
│   └── lib/            # Utilities and constants
├── internal-docs/      # Step-by-step development docs
└── deployments/        # Contract deployment artifacts
```

## Network Configuration

| Network | Chain ID | RPC |
|---------|----------|-----|
| PQC Mainnet | 1339 | TBD |
| PQC Testnet | 889 | TBD |
| PQC Local | 888 | http://localhost:8545 |
| Hardhat | 31337 | http://localhost:8545 |

## Smart Contracts

### BountyBoard.sol
- Create bounties with metadata and rewards
- Submit solutions to bounties
- Approve/reject submissions with comments
- Automatic reward distribution (5% platform fee)
- Bounty cancellation (before submissions)

### ReputationSystem.sol
- Track researcher profiles and activity
- Points-based reputation system
- Level progression (0-5)
- Leaderboard functionality

## PQC Compatibility

This project is designed for post-quantum cryptography features:
- No use of `ecrecover` (incompatible with ML-DSA-44)
- Standard transaction signatures only
- Future-ready for PQC signature schemes

## Development Documentation

See `internal-docs/` for step-by-step implementation details:
1. Project Initialization
2. UI Components
3. Layout and Navigation
4. Web3 Integration
5. Smart Contracts
6. Testing and Deployment
7. Bounty Listing Pages
8. Submission System
9. Dashboard and Reputation
10. Polish and Production

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npx hardhat test     # Run contract tests
```

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request
