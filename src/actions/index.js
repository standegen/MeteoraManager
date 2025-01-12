// Action types
export const ACTIONS = {
    ADD_LIQUIDITY: '1',
    REMOVE_LIQUIDITY: '2', 
    REOPEN_POSITION: '3',
    WALLET_MENU: '4',
    POOL_CHECK: '5',
    AUTO_CHECK: '6',
    SWAP_TOKENS: '7',
    EXIT: '8'
};

export const WALLET_ACTIONS = {
    CHECK_POSITIONS: '1',
    WALLET_OPERATIONS: '2',
    CONSOLIDATION_MENU: '3',
    SOL_DISTRIBUTION: '4'
};

export const CONSOLIDATION_ACTIONS = {
    TOKEN_CONSOLIDATION: '1',
    SOL_CONSOLIDATION: '2'
};

export const ADD_LIQUIDITY_ACTIONS = {
    SPOT: '1',
    CURVE: '2',
    BID_ASK: '3'
};

// Export all action handlers
export { handleOpenPosition } from './OpenPosition.js';
export { handleRemovePosition } from './RemovePosition.js';
export { handleReopenPosition } from './ReopenPosition.js';
export { handlePoolCheck } from './PoolOperations.js';
export { handleAutoCheck } from './AutoChecker.js';
export { handleSwapTokens } from './SwapTokens.js';
export { handleCheckPositions } from './CheckPositions.js';
export { handleTokenConsolidation } from './TokenOperations.js';
export { handleSolConsolidation, handleSolDistribution } from './SolOperations.js';
export { handleWalletOperations } from '../services/wallet.service.js';
