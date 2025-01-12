process.env.NODE_NO_WARNINGS = '1';
process.removeAllListeners('warning');

import { WALLETS } from './src/config/index.js';
import { question } from './src/utils/question.js';
import { 
    ACTIONS, 
    WALLET_ACTIONS, 
    CONSOLIDATION_ACTIONS,
    handleOpenPosition,
    handleRemovePosition,
    handleReopenPosition,
    handlePoolCheck,
    handleAutoCheck,
    handleSwapTokens,
    handleCheckPositions,
    handleWalletOperations,
    handleTokenConsolidation,
    handleSolConsolidation,
    handleSolDistribution
} from './src/actions/index.js';
import { displayLogo, selectWallets } from './src/utils/logger.js';
import { returnToMainMenu } from './src/utils/mainMenuReturn.js';

// Add global error handlers
process.on('unhandledRejection', (err) => {
    console.error('\n\x1b[31m[ERROR] Unhandled Promise Rejection:\x1b[0m');
    console.error(err);
    process.exit(1);
});

process.on('SIGINT', () => {
    console.log('\n\x1b[33m[!] Program stopped by user (CTRL-C)\x1b[0m');
    process.exit(0);
});

const ACTION_DESCRIPTIONS = {
    [ACTIONS.ADD_LIQUIDITY]: "Add Liquidity",
    [ACTIONS.REMOVE_LIQUIDITY]: "Remove Liquidity", 
    [ACTIONS.REOPEN_POSITION]: "Reopen Position",
    [ACTIONS.WALLET_MENU]: "Wallets",
    [ACTIONS.POOL_CHECK]: "Pool Checker",
    [ACTIONS.AUTO_CHECK]: "Position Auto-Checker",
    [ACTIONS.SWAP_TOKENS]: "Swap",
    [ACTIONS.EXIT]: "Exit",
};

const WALLET_MENU_DESCRIPTIONS = {
    [WALLET_ACTIONS.CHECK_POSITIONS]: "Check Positions",
    [WALLET_ACTIONS.WALLET_OPERATIONS]: "Check Balance",
    [WALLET_ACTIONS.CONSOLIDATION_MENU]: "Consolidation",
    [WALLET_ACTIONS.SOL_DISTRIBUTION]: "Distribute SOL",
};

const CONSOLIDATION_MENU_DESCRIPTIONS = {
    [CONSOLIDATION_ACTIONS.TOKEN_CONSOLIDATION]: "Consolidate Tokens",
    [CONSOLIDATION_ACTIONS.SOL_CONSOLIDATION]: "Consolidate SOL",
};

export async function main() {
    try {
        await displayLogo();
        
        // Check if wallet configuration exists
        if (Object.keys(WALLETS).length === 0) {
            console.error('\n\x1b[31m[ERROR] No wallets configured in config/index.js\x1b[0m');
            process.exit(1);
        }

        const selectedWallets = await selectWallets();
        
        // Check if any wallets were selected
        if (!selectedWallets || selectedWallets.length === 0) {
            console.error('\n\x1b[31m[ERROR] No wallets selected\x1b[0m');
            process.exit(1);
        }

        console.log("\n[...] Select action:");
        Object.entries(ACTION_DESCRIPTIONS).forEach(([key, value]) => {
            console.log(`${key}: ${value}`);
        });

        const choice = await question("\n[...] Select action (1-8): ");
        const handler = getActionHandler(choice);

        if (!handler) {
            if (choice === ACTIONS.EXIT) {
                console.log("\n[!] Exiting program...");
                process.exit(0);
            }
            console.error("\n\x1b[31m[ERROR] Invalid choice\x1b[0m");
            await main();
            return;
        }

        if (choice === ACTIONS.WALLET_MENU) {
            await handleWalletMenu();
        } else {
            await handler(selectedWallets);
        }
        
        await returnToMainMenu();
    } catch (error) {
        console.error(`\n\x1b[31m[ERROR] Error in main menu: ${error.message}\x1b[0m`);
        await main();
    }
}

async function handleWalletMenu() {
    console.log("\nWALLET MENU:\n=========================");
    Object.entries(WALLET_MENU_DESCRIPTIONS).forEach(([key, value]) => {
        console.log(`\x1b[36m-+-\x1b[0m ${key}: ${value}`);
    });

    const walletAction = await question("\n[...] Select action (1-4): ");
    
    if (walletAction === WALLET_ACTIONS.CONSOLIDATION_MENU) {
        return handleConsolidationMenu();
    }

    const FastWalletsWay = await question("\n[...] Use all wallets\n1: Yes\n2: No\nSelect: ");
    const selectedWallets = FastWalletsWay === '1' ? Object.values(WALLETS) : await selectWallets();
    const handler = getWalletActionHandler(walletAction);
    
    if (!handler) {
        console.log("\n\x1b[31m[ERROR] Invalid choice or function under development\x1b[0m");
        return;
    }

    if (walletAction === WALLET_ACTIONS.SOL_DISTRIBUTION) {
        const MainWallet = WALLETS[1];
        await handler(MainWallet, selectedWallets);
    } else {
        await handler(selectedWallets);
    }
}

async function handleConsolidationMenu() {
    console.log("\nCONSOLIDATION MENU:\n=========================");
    Object.entries(CONSOLIDATION_MENU_DESCRIPTIONS).forEach(([key, value]) => {
        console.log(`\x1b[36m-+-\x1b[0m ${key}: ${value}`);
    });

    const consolidationAction = await question("\n[...] Select action (1-2): ");
    const FastWalletsWay = await question("\n[...] Use all wallets\n1: Yes\n2: No\nSelect: ");
    const selectedWallets = FastWalletsWay === '1' ? Object.values(WALLETS) : await selectWallets();
    const handler = getConsolidationActionHandler(consolidationAction);
    
    if (!handler) {
        console.log("\n\x1b[31m[ERROR] Invalid choice or function under development\x1b[0m");
        return;
    }

    const MainWallet = WALLETS[1];
    await handler(MainWallet, selectedWallets);
}

function getActionHandler(action) {
    const handlers = {
        [ACTIONS.ADD_LIQUIDITY]: handleOpenPosition,
        [ACTIONS.REMOVE_LIQUIDITY]: handleRemovePosition,
        [ACTIONS.REOPEN_POSITION]: handleReopenPosition,
        [ACTIONS.POOL_CHECK]: handlePoolCheck,
        [ACTIONS.AUTO_CHECK]: handleAutoCheck,
        [ACTIONS.SWAP_TOKENS]: handleSwapTokens,
    };
    return handlers[action];
}

function getWalletActionHandler(action) {
    const handlers = {
        [WALLET_ACTIONS.CHECK_POSITIONS]: handleCheckPositions,
        [WALLET_ACTIONS.WALLET_OPERATIONS]: handleWalletOperations,
        [WALLET_ACTIONS.SOL_DISTRIBUTION]: handleSolDistribution,
    };
    return handlers[action];
}

function getConsolidationActionHandler(action) {
    const handlers = {
        [CONSOLIDATION_ACTIONS.TOKEN_CONSOLIDATION]: handleTokenConsolidation,
        [CONSOLIDATION_ACTIONS.SOL_CONSOLIDATION]: handleSolConsolidation,
    };
    return handlers[action];
}

main();

