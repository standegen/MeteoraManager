import pkg from '@solana/web3.js';
const { PublicKey, Connection } = pkg;
import { HttpsProxyAgent } from 'https-proxy-agent';

// RPC and proxy settings
const RPC_CONFIG = {
    USE_MULTI_RPC: 1, // 0 - use single RPC, 1 - use multiple RPCs
    USE_MULTI_PROXY: 0, // 0 - not use proxy, 1 - use proxy
    POOL_SIZE: 5,
};

const RPC_ENDPOINTS = [
    "https://api.mainnet-beta.solana.com",
    "https://api.testnet.solana.com",
];

const PROXY_LIST = [
    "0.0.0.0:0000:username:password",
    "0.0.0.0:0000:username:password"
];

class ConnectionPool {
    constructor(rpcEndpoints, proxyList, options = {}) {
        this.rpcEndpoints = rpcEndpoints;
        this.proxies = proxyList.map(this.formatProxy);
        this.options = {
            poolSize: options.poolSize || 5,
            useMultiRPC: options.useMultiRPC || false,
            useMultiProxy: options.useMultiProxy || false
        };
        
        this.pool = [];
        this.currentIndex = 0;
        
        this.initializePool();
    }

    formatProxy(proxy) {
        const [ip, port, user, pass] = proxy.split(':');
        return `http://${user}:${pass}@${ip}:${port}`;
    }

    createConnection(index) {
        const rpcUrl = this.options.useMultiRPC 
            ? this.rpcEndpoints[index % this.rpcEndpoints.length]
            : this.rpcEndpoints[0];

        const fetchOptions = {
            fetch: (url, options) => {
                if (this.options.useMultiProxy) {
                    const proxyUrl = this.proxies[index % this.proxies.length];
                    options.agent = new HttpsProxyAgent(proxyUrl);
                }
                return fetch(url, options);
            }
        };

        return new Connection(rpcUrl, {
            commitment: 'confirmed',
            confirmTransactionInitialTimeout: 120000,
            ...fetchOptions
        });
    }

    initializePool() {
        for (let i = 0; i < this.options.poolSize; i++) {
            this.pool.push(this.createConnection(i));
        }
    }

    getConnection() {
        const connection = this.pool[this.currentIndex];
        this.currentIndex = (this.currentIndex + 1) % this.pool.length;
        return connection;
    }
}

// Error handling 429
const originalConsoleError = console.error;
console.error = (...args) => {
    if (args.some(arg => 
        typeof arg === 'string' && 
        (arg.includes('429') || arg.includes('Too Many Requests'))
    )) {
        return;
    }
    originalConsoleError.apply(console, args);
};

// Create connection pool
const connectionPool = new ConnectionPool(
    RPC_ENDPOINTS,
    PROXY_LIST,
    {
        poolSize: RPC_CONFIG.POOL_SIZE,
        useMultiRPC: RPC_CONFIG.USE_MULTI_RPC === 1,
        useMultiProxy: RPC_CONFIG.USE_MULTI_PROXY === 1
    }
);

// Exports
export const connection = connectionPool.getConnection();
export const getConnection = () => connectionPool.getConnection();
export const TOTAL_RANGE_INTERVAL = 68;

export const MAX_PRIORITY_FEE = 1000000;
export const MAX_PRIORITY_FEE_REMOVE_LIQUIDITY = 1500000; // Approximately 0.0001 SOL
export const MAX_PRIORITY_FEE_CREATE_POSITION = 1500000; // Approximately 0.0001 SOL
export const TRANSACTION_MODE = 1 // 1 - DEGEN {DOES NOT WAIT FOR TRANSACTION CONFIRMATION, SO THERE MAY BE ERRORS} 0 - SAFE {WAITS FOR TRANSACTION CONFIRMATION}
export const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

// Add RPC_CONFIG and PROXY_LIST export
export { RPC_CONFIG, PROXY_LIST };

// Jupiter swap configuration
export const SLIPPAGE_BPS = 5 * 100; // 5%
export const SELL_PRIORITY_FEE = 0.0003 * 1000000000; // 0.0003 SOL
export const BUY_PRIORITY_FEE = 0.0005 * 1000000000; // 0.0005 SOL


// Wallets [!] Not recommended to use many wallets as it may lead to RPC errors
export const WALLETS = {
    "1": {
        privateKey: "d6e4x3RpvS5xL9fas74eGS4PDJdf6bSqfVdAQzwfodgFiNw1Soh7mDbbDpx1AUPZpAj7iHxq2XfdxbszffAgzpX",
        description: "4oQxUtnXm3n8jokBiWMccwubfzATKZE9AmiiLEnyf2jy"
    }
    // Add additional wallets as needed
};
