# Private Vote Frontend

React frontend for the Private Vote on-chain governance system, built with Create React App and Solana wallet integration.

## Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- Phantom or Solflare wallet browser extension
- Backend relayer running (see main README)

### Installation

```bash
npm install
# or
yarn install
```

### Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your configuration:
   ```env
   REACT_APP_SOLANA_RPC_URL=https://api.devnet.solana.com
   REACT_APP_API_URL=http://localhost:3001/api
   REACT_APP_API_KEY=your_api_key_here
   ```

### Development

```bash
npm start
# or
yarn start
```

Opens http://localhost:3000 in your browser.

### Build for Production

```bash
npm run build
# or
yarn build
```

Creates optimized production build in `build/` directory.

## Demo Instructions

### Prerequisites

1. **Install Phantom Wallet**
   - Visit https://phantom.app/
   - Install the browser extension
   - Create or import a wallet

2. **Connect to Devnet**
   - Open Phantom wallet
   - Click the network selector (top right)
   - Select **"Devnet"** (not Mainnet)
   - Get devnet SOL: Use Phantom's airdrop feature or visit https://faucet.solana.com/

3. **Start Backend Relayer**
   ```bash
   cd ../backend
   npm start
   # Should be running on http://localhost:3001
   ```

### Step-by-Step Demo

#### 1. Connect Your Wallet

1. Open the app at http://localhost:3000
2. Click **"Connect"** button (top right)
3. Approve the connection in Phantom wallet
4. You should see your wallet address displayed

**Note**: The app runs on **Solana Devnet**. Make sure your Phantom wallet is set to Devnet mode.

#### 2. Create a Test Poll

1. Navigate to **"Create Poll"** tab
2. Enter a question: e.g., "What is your favorite programming language?"
3. Add options (2-10 options):
   - Click "Add Option" to add more
   - Example: "Rust", "TypeScript", "Python", "Go"
4. Click **"Create Poll"**
5. Wait for confirmation - poll is created via backend relayer
6. You'll see a success message with poll details

**What happens**: The frontend sends a request to the backend relayer, which creates the poll on-chain using the Anchor program. Transaction fees are sponsored by the government wallet.

#### 3. Vote on a Poll

1. Navigate to **"Vote"** tab
2. You'll see all active polls listed
3. Select an option by clicking on it (turns blue)
4. Click **"Cast Your Vote"** button
5. Wait for confirmation - vote is submitted via backend relayer
6. You'll see a success message

**What happens**: 
- Frontend sends vote to backend relayer with `voterPublicKey`, `pollId`, and `voteChoice`
- Backend relayer constructs and signs the transaction
- Transaction is submitted to Solana (fees sponsored)
- Vote account is created on-chain (PDA prevents double-voting)
- Vote counts are updated in the poll account

**Important**: 
- You can only vote once per poll (enforced by PDA)
- Voting is free (fees sponsored by government wallet)
- Banner shows: "Voter fees sponsored by government—cast your vote for free!"

#### 4. View Results

1. Navigate to **"Results"** tab
2. Select a poll from the dropdown
3. View vote counts and percentages
4. See winner highlighted

**Note**: Results are read from on-chain data. For closed polls, results are final.

#### 5. Manage Your Polls

1. Navigate to **"Manage"** tab
2. See all polls you created
3. View vote counts and status
4. Click **"Close Poll"** to end voting

**Note**: Only the poll creator can close polls.

### Troubleshooting

**Wallet won't connect:**
- Ensure Phantom is installed and unlocked
- Check that Phantom is set to Devnet (not Mainnet)
- Try refreshing the page

**"Please connect your wallet" error:**
- Click the Connect button
- Approve the connection in Phantom
- Check browser console for errors

**Vote submission fails:**
- Ensure backend relayer is running on port 3001
- Check backend logs for errors
- Verify API key in `.env` matches backend config
- Check that you haven't already voted (PDA prevents double-voting)

**Backend connection errors:**
- Verify `REACT_APP_API_URL` in `.env` points to running backend
- Check CORS settings in backend
- Ensure backend is accessible from frontend origin

**Transaction errors:**
- Check that backend relayer has SOL in government wallet
- Verify program is deployed to devnet
- Check Solana network status

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_SOLANA_RPC_URL` | Solana RPC endpoint | `https://api.devnet.solana.com` |
| `REACT_APP_API_URL` | Backend relayer API base URL | `http://localhost:3001/api` |
| `REACT_APP_API_KEY` | API key for backend authentication | `your_api_key_change_in_production_67890` |
| `REACT_APP_PROGRAM_ID` | Anchor program ID (optional) | `7ZXBjyqFJPNHj3nRdeJmu2JKSnph5BpJ9nwxTTMx7RwJ` |

## Project Structure

```
app/
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   │   ├── CreatePollFixed.tsx
│   │   ├── VotePollFixed.tsx
│   │   ├── ManagePollsFixed.tsx
│   │   └── ResultsFixed.tsx
│   ├── contexts/        # React contexts
│   │   └── WalletProvider.tsx
│   ├── services/         # API services
│   │   └── apiService.ts
│   ├── utils/           # Utilities
│   │   └── program.ts
│   ├── PrivateVoteApp.tsx  # Main app component
│   └── index.tsx        # Entry point
├── .env.example         # Environment template
└── package.json
```

## Deployment

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` directory.

### Deploy to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the `app/` directory
3. Set environment variables in Vercel dashboard:
   - `REACT_APP_SOLANA_RPC_URL`
   - `REACT_APP_API_URL`
   - `REACT_APP_API_KEY`
4. Deploy: `vercel --prod`

### Deploy to Netlify

1. Install Netlify CLI: `npm i -g netlify-cli`
2. Build: `npm run build`
3. Deploy: `netlify deploy --prod --dir=build`
4. Set environment variables in Netlify dashboard

### Environment Variables for Production

Update these in your hosting platform:

```env
REACT_APP_SOLANA_RPC_URL=https://api.devnet.solana.com
REACT_APP_API_URL=https://your-backend-domain.com/api
REACT_APP_API_KEY=your_production_api_key
```

**Important**: Never commit `.env` files with real API keys to version control.

## Development Notes

- **Create React App**: Uses `react-scripts` for build tooling
- **TypeScript**: Full TypeScript support
- **Wallet Integration**: Supports Phantom and Solflare wallets
- **Backend Integration**: All blockchain interactions go through backend relayer
- **No Direct Wallet Transactions**: Voters don't need SOL (fees sponsored)

## Testing

```bash
npm test
```

## Learn More

- [Create React App Documentation](https://facebook.github.io/create-react-app/docs/getting-started)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)
- [Phantom Wallet](https://phantom.app/)

