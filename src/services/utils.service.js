import { ComputeBudgetProgram, PublicKey, Transaction, Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { createTransferInstruction, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from "@solana/spl-token";
import { processSellAllTokens } from './position.service.js';
import bs58 from 'bs58';
import { getConnection, TOKEN_PROGRAM_ID } from '../config/index.js';
import { returnToMainMenu } from '../utils/mainMenuReturn.js';


export const modifyPriorityFeeIx = (tx, newPriorityFee) => {
    for (let ix of tx.instructions) {
        if (ComputeBudgetProgram.programId.equals(ix.programId)) {
            if (ix.data[0] === 3) {
                ix.data = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: newPriorityFee }).data;
                return true;
            }
        }
    }

    tx.instructions.unshift(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: newPriorityFee }));
    return true;
};



export const formatNumber = (number) => {
    if (number > 1000000 && number < 1000000000) {
        return `${(number / 1000000).toFixed(2)}M`;
    } else if (number > 1000 && number < 1000000) {
        return `${(number / 1000).toFixed(2)}K`;
    } else if (number > 1000000000) {
        return `${(number / 1000000000).toFixed(2)}B`;
    } else {
        return number;
    }
};

export const getTokenInfoByTokenAddress = async (tokenAddress) => {
    try {
        const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
        const data = await response.json();
        
        if (!data || !data.pairs || data.pairs.length === 0) {
            console.error(`\x1b[31m~~~ [!] | ERROR | No pool data available for token\x1b[0m`);
            returnToMainMenu();
        }

        // First, look for Raydium pool with SOL
        let pool = data.pairs.find(pair => 
            pair.dexId === 'raydium' && 
            pair.quoteToken.symbol === 'SOL' &&
            !pair.labels?.includes('CLMM')
        );

        // If no Raydium pool, look for any pool with SOL
        if (!pool) {
            pool = data.pairs.find(pair => 
                pair.quoteToken.symbol === 'SOL' &&
                !pair.labels?.includes('CLMM')
            );
        }

        // If no pools with SOL at all, take the first available pool
        if (!pool) {
            pool = data.pairs[0];
        }

        return {
            tokenSymbol: pool.baseToken.symbol,
            tokenAddress: pool.baseToken.address,
            priceSOL: pool.priceNative,
            priceUSD: pool.priceUsd,
            marketCap: pool.marketCap,
            decimals: undefined // If decimals are needed, they can be obtained via connection.getTokenSupply
        };
    } catch (error) {
        return {
            tokenSymbol: "Unknown",
            tokenAddress: tokenAddress,
            priceSOL: "0",
            priceUSD: "0",
            marketCap: 0,
            decimals: undefined
        };
    }
};

export async function getSolPrice() {
    try {
        const response = await fetch('https://api.dexscreener.com/latest/dex/tokens/So11111111111111111111111111111111111111112');
        const data = await response.json();
        const solPool = data.pairs[0];
        return parseFloat(solPool.priceUsd);
    } catch (error) {
        return 0;
    }
}

export const consolidateTokens = async (sourceWallet, targetWallet) => {
    try {
        const conn = await getConnection();
        const sourcePublicKey = new PublicKey(sourceWallet.description);
        const targetPublicKey = new PublicKey(targetWallet.description);
        const sourceKeypair = Keypair.fromSecretKey(new Uint8Array(bs58.decode(sourceWallet.privateKey)));
        
        // Get all tokens in the wallet
        const tokenAccounts = await conn.getParsedTokenAccountsByOwner(
            sourcePublicKey,
            { programId: TOKEN_PROGRAM_ID }
        );

        const tokenPromises = tokenAccounts.value.map(async (tokenAccount) => {
            const tokenBalance = tokenAccount.account.data.parsed.info.tokenAmount;
            const tokenMint = tokenAccount.account.data.parsed.info.mint;
            
            if (tokenBalance.uiAmount > 5) {                
                // Get or create ATA for target wallet
                const targetATA = await getAssociatedTokenAddress(
                    new PublicKey(tokenMint),
                    targetPublicKey
                );

                const transaction = new Transaction();
                
                // Check ATA existence
                try {
                    await conn.getAccountInfo(targetATA);
                } catch {
                    // If ATA doesn't exist, create it
                    transaction.add(
                        createAssociatedTokenAccountInstruction(
                            sourcePublicKey,
                            targetATA,
                            targetPublicKey,
                            new PublicKey(tokenMint)
                        )
                    );
                }

                // Add transfer instruction
                transaction.add(
                    createTransferInstruction(
                        new PublicKey(tokenAccount.pubkey),
                        targetATA,
                        sourcePublicKey,
                        tokenBalance.amount
                    )
                );

                // Send transaction
                transaction.feePayer = sourcePublicKey;
                transaction.recentBlockhash = (await conn.getLatestBlockhash()).blockhash;
                modifyPriorityFeeIx(transaction, 500000);
                
                transaction.sign(sourceKeypair);
                const txId = await conn.sendRawTransaction(transaction.serialize());
                
                console.log(`\x1b[36m[${new Date().toLocaleTimeString()}] [${sourceWallet.description.slice(0, 4)}..] SUCCESS | Tokens successfully sent. TX: ${txId}\x1b[0m`);
            }
        });
        await Promise.all(tokenPromises);
        
    } catch (error) {
        console.error(`\x1b[31m~~~ [!] | ERROR | [${sourceWallet.description.slice(0, 4)}..] Error processing wallet | utils.js | error: ${error}\x1b[0m`);
        await processSellAllTokens(sourceWallet);
    }
};

export const distributeSol = async (sourceWallet, targetWallets, totalAmount) => {
    const randomDelay = Math.floor(Math.random() * 2000); // Random number from 0 to 2000 ms
    const conn = await getConnection();
    await new Promise(resolve => setTimeout(resolve, randomDelay));
    const amountPerWallet = Math.floor((totalAmount * LAMPORTS_PER_SOL) / targetWallets.length);
    
    console.log(`\n\x1b[36m[⌛] WAITING | Distributing ${totalAmount} SOL to ${targetWallets.length} wallets (${amountPerWallet / LAMPORTS_PER_SOL} SOL per wallet)\x1b[0m`);
    
    const sourceKeypair = Keypair.fromSecretKey(new Uint8Array(bs58.decode(sourceWallet.privateKey)));
    
    const promises = targetWallets.map(async (targetWallet) => {
        try {
            const transaction = new Transaction();
            
            // Create transfer instruction with whole lamports
            transaction.add(
                SystemProgram.transfer({
                    fromPubkey: sourceKeypair.publicKey,
                    toPubkey: new PublicKey(targetWallet.description),
                    lamports: amountPerWallet
                })
            );
            
            // Send transaction
            transaction.feePayer = sourceKeypair.publicKey;
            transaction.recentBlockhash = (await conn.getLatestBlockhash()).blockhash;
            modifyPriorityFeeIx(transaction, 100000);
            
            transaction.sign(sourceKeypair);
            const txId = await conn.sendRawTransaction(transaction.serialize());
            
            await conn.confirmTransaction(txId);
            
            console.log(`\x1b[36m[${new Date().toLocaleTimeString()}] [${targetWallet.description.slice(0, 4)}..] SUCCESS | Successfully sent ${amountPerWallet / LAMPORTS_PER_SOL} SOL. TX: https://solscan.io/tx/${txId}\x1b[0m`);
            
            // Small delay between transactions
            await new Promise(resolve => setTimeout(resolve, 2000));
            
        } catch (error) {
            console.error(`\x1b[31m~~~ [!] | ERROR | [${sourceWallet.description.slice(0, 4)}..] Error sending SOL:`, error);
        }
    });

    await Promise.all(promises);
};

export const consolidateSol = async (sourceWallet, targetWallet) => {
    try {
        const sourceKeypair = Keypair.fromSecretKey(new Uint8Array(bs58.decode(sourceWallet.privateKey)));
        const targetPublicKey = new PublicKey(targetWallet.description);
        const conn = await getConnection();
        // Get balance of source wallet
        const balance = await conn.getBalance(sourceKeypair.publicKey);
        
        // Reserve 0.002 SOL for fees
        const reserveAmount = 0.002 * LAMPORTS_PER_SOL;
        const transferAmount = balance - reserveAmount;
        
        if (transferAmount > 0) {
            const transaction = new Transaction();
            
            transaction.add(
                SystemProgram.transfer({
                    fromPubkey: sourceKeypair.publicKey,
                    toPubkey: targetPublicKey,
                    lamports: transferAmount
                })
            );
            
            transaction.feePayer = sourceKeypair.publicKey;
            transaction.recentBlockhash = (await conn.getLatestBlockhash()).blockhash;
            modifyPriorityFeeIx(transaction, 100000);
            
            transaction.sign(sourceKeypair);
            const txId = await conn.sendRawTransaction(transaction.serialize());
            
            console.log(`\x1b[36m[${new Date().toLocaleTimeString()}] [${sourceWallet.description.slice(0, 4)}..] SUCCESS | Successfully sent ${transferAmount / LAMPORTS_PER_SOL} SOL. TX: https://solscan.io/tx/${txId}\x1b[0m`);
        }
        
    } catch (error) {
        console.error(`\x1b[31m~~~ [!] | ERROR | [${sourceWallet.description.slice(0, 4)}..] Error consolidating SOL:`, error);
    }
};