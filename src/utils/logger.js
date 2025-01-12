import { WALLETS } from '../config/index.js';
import { getSolBalance } from './getBalance.js';
import { question } from './question.js';

// Add CTRL-C handler
process.on('SIGINT', () => {
    console.log('\n\x1b[33m[!] Program stopped by user (CTRL-C)\x1b[0m');
    process.exit(0);
});

// Add error handler to keep errors visible
process.on('uncaughtException', (err) => {
    console.error('\n\x1b[31m[ERROR] Uncaught Exception:\x1b[0m');
    console.error(err);
    process.exit(1);
});

export async function logWallets() {
    console.log("\nAVAILABLE WALLETS: \n=========================");
    for (const [key, value] of Object.entries(WALLETS)) {
        const balance = await getSolBalance(value.description);
        console.log(`${key}: ${value.description.slice(0, 4)}...${value.description.slice(-4)} [\x1b[32m${balance.toFixed(2)} SOL\x1b[0m]`);
    }
}

export async function selectWallets() {
    await logWallets();

    const walletInput = await question("\n[...] Enter wallet numbers separated by commas (1,2,3) or '0' for all: ");
    
    if (walletInput === '0') {
        return Object.values(WALLETS);
    }
    
    return walletInput.split(',')
        .map(num => num.trim())
        .map(num => {
            const wallet = WALLETS[num];
            if (!wallet) {
                console.error(`\x1b[31m[ERROR] Wallet ${num} not found\x1b[0m`);
                throw new Error(`Wallet ${num} not found`);
            }
            return wallet;
        });
}

export async function displayLogo() {
    console.log(`
\x1b[36m
    ██████╗ ██╗     ██╗     ███╗   ███╗    ██████╗  ██████╗ ████████╗
    ██╔══██╗██║     ██║     ████╗ ████║    ██╔══██╗██╔═══██╗╚══██╔══╝
    ██║  ██║██║     ██║     ██╔████╔██║    ██████╔╝██║   ██║   ██║   
    ██║  ██║██║     ██║     ██║╚██╔╝██║    ██╔══██╗██║   ██║   ██║   
    ██████╔╝███████╗███████╗██║ ╚═╝ ██║    ██████╔╝╚██████╔╝   ██║   
    ╚═════╝ ╚══════╝╚══════╝╚═╝     ╚═╝    ╚═════╝  ╚═════╝    ╚═╝   \x1b[0m

\x1b[33m=================================================================
                Created by StanDegen | @standegen
                TG: 
=================================================================\x1b[0m

`);
}

export async function strategyType() {
    console.log('\n[...] Select strategy: ');
    console.log('1. SPOT');
    console.log('2. BIDASK');
    const strategyType = await question("\n[...] Enter strategy number: ");
    if (strategyType === '1' || strategyType === '2') {
        return strategyType;
    } else {
        throw new Error('[!] [strategyType] Strategy not found');
    }
}