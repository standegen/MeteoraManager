# Meteora Position Manager

Automated position manager for Meteora DeFi on Solana.

## 🛠 Prerequisites

- install Node.js

## 📝 Configuration

### Config setup (src/config/index.js)

```javascript
// RPC and proxy settings

// Add additional wallets as needed

// RPC and proxy settings
const RPC_CONFIG = {
    USE_MULTI_RPC: 1,    // 0 - single RPC, 1 - multiple RPCs
    USE_MULTI_PROXY: 1,  // 0 - without proxy, 1 - with proxy
    POOL_SIZE: 5         // Number of simultaneous connections (recommended 5-10)
};

// Jupiter swap settings
export const SLIPPAGE_BPS = 5 * 100; // slippage 5%
export const PRIORITY_FEE = 0.002 * 1000000000; // priority fee 0.002 SOL

// Insert your RPC URLs
const RPC_ENDPOINTS = [
    "https://your-rpc-1.com",
    "https://your-rpc-2.com"
    // You can add more RPCs
];

// Insert your proxies in format: "ip:port:username:password"
const PROXY_LIST = [
    "11.99.99.99:9999:user:pass",
    "55.99.99.99:9999:user:pass"
    // You can add more proxies
];

export const WALLETS = {
    "1": {
        privateKey: "Your Private Key",
        description: "Your Wallet Address"
    },
    "2": {
        privateKey: "Your Private Key2",
        description: "Your Wallet Address2"
    },
    // Add additional wallets as needed
};

export const TOTAL_RANGE_INTERVAL = 68; // Range for positions (maximum value 69)
```

### Detailed RPC and proxy setup

1. **Operation mode setup:**
   - `USE_MULTI_RPC: 0` - Use only one RPC (first from the list)
   - `USE_MULTI_RPC: 1` - Use all RPCs in sequence
   - `USE_MULTI_PROXY: 0` - Do not use proxy
   - `USE_MULTI_PROXY: 1` - Use proxy
   - `POOL_SIZE: 5` - Number of simultaneous connections (recommended 5-10)

2. **Adding RPC:**
   - Add your RPC URLs to the `RPC_ENDPOINTS` array
   - You can add multiple RPCs for better performance

3. **Adding proxies:**
   - Add your proxies to the `PROXY_LIST` array in format: "ip:port:username:password"
   - You can add multiple proxies for better performance

4. **Configuration examples:**
   ```javascript
   // Basic configuration
   const RPC_CONFIG = {
       USE_MULTI_RPC: 1,
       USE_MULTI_PROXY: 0,
       POOL_SIZE: 5
   };

   // Configuration with proxy
   const RPC_CONFIG = {
       USE_MULTI_RPC: 1,
       USE_MULTI_PROXY: 1,
       POOL_SIZE: 10
   };
   ```

## 🚀 Usage

Run the program from the project directory:
```bash
node main
```

### Main Functions:

1. **Add Liquidity**
   - In tokens (Opens BidAsk position in tokens)
   - In SOL (Opens BidAsk position in SOL)

2. **Remove Liquidity**
   - Close selected positions

3. **Reopen Position**
   - Close and open position in new range

4. **Wallets**
   - Check positions (Checks all positions in wallet)
   - Check balance (Checks wallet balances)
   - Consolidation
     - Consolidate tokens (to main wallet)
     - Consolidate SOL (to main wallet)
   - Distribute SOL (Distributes SOL to all wallets)

5. **Pool Checker**
   - Finds pools by token contract

6. **Position Auto-checker**
   - Close positions and sell tokens
   - Reopen positions in tokens

7. **Swap**
   - Token exchange through Jupiter

8. **Exit**
   - Exit program

## 📊 Position Monitoring

### Auto-checker has two operation modes:

1. **Close and Sell**
   - Closes positions when out of range
   - Consolidates tokens to main wallet
   - Sells all tokens

2. **Position Reopening**
   - Closes positions when out of range
   - Automatically opens new positions in tokens
   - Continues monitoring new positions

## ⚠️ Important Note

It's better to double-check before re-closing/reopening positions, as Meteora's API can be slow sometimes
#   M e t e o r a - B O T  
 