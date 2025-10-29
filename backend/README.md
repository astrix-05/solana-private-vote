# Private Vote Relayer Backend

A secure Node.js/Express backend server that acts as a relayer for the Private Vote DApp, managing government-funded Solana wallet operations and poll data.

## Features

- 🔐 **Secure Government Wallet Management**: Securely stores and manages a government-funded Solana wallet
- 🌐 **Solana Integration**: Connects to Solana devnet/mainnet for blockchain operations
- 🗳️ **Poll Management**: Create, manage, and process voting polls
- 🔒 **Security**: API key authentication, rate limiting, input validation
- 📊 **Monitoring**: Comprehensive logging and health checks
- 🚀 **Production Ready**: Error handling, graceful shutdown, security headers

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure:

```bash
cp env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Solana Configuration
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com

# Government Wallet (Generate new keypair if needed)
GOVERNMENT_WALLET_PRIVATE_KEY=your_base58_private_key_here
GOVERNMENT_WALLET_PUBLIC_KEY=your_public_key_here

# Security
JWT_SECRET=your_jwt_secret_here
API_KEY=your_api_key_here
```

### 3. Generate Government Wallet

If you don't have a government wallet, the server will generate one on first run:

```bash
npm start
```

The server will output:
```
🔑 New Government Wallet Generated:
Public Key: [WALLET_ADDRESS]
Private Key (Base58): [PRIVATE_KEY]
⚠️  IMPORTANT: Save this private key securely and fund the wallet!
```

### 4. Fund the Wallet

For **devnet** testing, use the Solana faucet:
- Visit: https://faucet.solana.com/
- Enter your wallet address
- Request SOL airdrop

For **mainnet**, transfer SOL from your main wallet.

### 5. Start the Server

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication
All API endpoints require an `X-API-Key` header with a valid API key.

### Health Check
```http
GET /health
```

### Poll Management

#### Create Poll
```http
POST /api/polls
Content-Type: application/json
X-API-Key: your_api_key

{
  "question": "What is your favorite color?",
  "options": ["Red", "Blue", "Green"],
  "creator": "WALLET_ADDRESS",
  "isAnonymous": false,
  "expiryDate": "2024-12-31T23:59:59Z"
}
```

#### Submit Vote
```http
POST /api/polls/{pollId}/vote
Content-Type: application/json
X-API-Key: your_api_key

{
  "optionIndex": 0,
  "voterAddress": "VOTER_WALLET_ADDRESS"
}
```

#### Get Poll Details
```http
GET /api/polls/{pollId}
X-API-Key: your_api_key
```

#### Get All Polls
```http
GET /api/polls
X-API-Key: your_api_key
```

#### Get Polls by Creator
```http
GET /api/polls/creator/{creatorAddress}
X-API-Key: your_api_key
```

#### Close Poll
```http
POST /api/polls/{pollId}/close
Content-Type: application/json
X-API-Key: your_api_key

{
  "creatorAddress": "CREATOR_WALLET_ADDRESS"
}
```

#### Get Poll Results
```http
GET /api/polls/{pollId}/results
X-API-Key: your_api_key
```

#### Get Government Wallet Info
```http
GET /api/wallet
X-API-Key: your_api_key
```

## Security Features

### Rate Limiting
- **Global**: 1000 requests per 15 minutes per IP
- **Create Poll**: 10 requests per 15 minutes per IP
- **Voting**: 50 requests per 5 minutes per IP

### Input Validation
- Wallet address format validation
- Poll data validation (question length, options count)
- Vote data validation
- Input sanitization

### Security Headers
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Content Security Policy
- CORS protection

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment | development |
| `SOLANA_NETWORK` | Solana network | devnet |
| `SOLANA_RPC_URL` | Solana RPC endpoint | https://api.devnet.solana.com |
| `GOVERNMENT_WALLET_PRIVATE_KEY` | Government wallet private key | Generated if not provided |
| `API_KEY` | API authentication key | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `LOG_LEVEL` | Logging level | info |

### Solana Networks

#### Devnet (Testing)
```env
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
```

#### Mainnet (Production)
```env
SOLANA_NETWORK=mainnet-beta
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

## Development

### Project Structure
```
backend/
├── src/
│   ├── config/
│   │   └── solana.js          # Solana configuration
│   ├── controllers/
│   │   └── pollController.js  # API controllers
│   ├── middleware/
│   │   └── security.js        # Security middleware
│   ├── routes/
│   │   └── pollRoutes.js      # API routes
│   ├── services/
│   │   └── pollService.js     # Business logic
│   ├── utils/
│   │   ├── logger.js          # Logging utility
│   │   └── security.js        # Security utilities
│   └── server.js              # Main server file
├── logs/                      # Log files
├── package.json
├── env.example
└── README.md
```

### Running Tests
```bash
npm test
```

### Logging
Logs are written to:
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- Console output (development mode)

## Production Deployment

### Security Checklist
- [ ] Set strong API key
- [ ] Set strong JWT secret
- [ ] Configure CORS for production domains
- [ ] Set up HTTPS
- [ ] Configure firewall rules
- [ ] Set up monitoring and alerting
- [ ] Regular security updates

### Environment Setup
```env
NODE_ENV=production
PORT=3001
SOLANA_NETWORK=mainnet-beta
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
GOVERNMENT_WALLET_PRIVATE_KEY=your_secure_private_key
API_KEY=your_secure_api_key
JWT_SECRET=your_secure_jwt_secret
LOG_LEVEL=warn
```

## Troubleshooting

### Common Issues

#### Wallet Not Funded
```
Error: Wallet balance is low (0 SOL)
```
**Solution**: Fund the government wallet using the Solana faucet (devnet) or transfer SOL (mainnet).

#### Invalid API Key
```
Error: Invalid API key
```
**Solution**: Check that the `X-API-Key` header is set correctly and matches the `API_KEY` environment variable.

#### Rate Limit Exceeded
```
Error: Too many requests
```
**Solution**: Wait for the rate limit window to reset or implement request queuing.

### Logs
Check the log files for detailed error information:
```bash
tail -f logs/combined.log
tail -f logs/error.log
```

## License

MIT License - See LICENSE file for details.
