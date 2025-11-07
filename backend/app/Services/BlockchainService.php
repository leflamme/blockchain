<?php

namespace App\Services;

use App\Models\Block;
use App\Models\Transaction;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Section 6.2: Core Classes
 * Section 6.3: Functions
 */
class BlockchainService
{
    // Section 3.4: Simplified Proof of Work difficulty
    protected $difficulty = "00";

    /**
     * Generates a SHA256 hash for a block.
     * Section 6.3: generateHash(block)
     *
     * @param int $index
     * @param int $timestamp
     * @param string $previousHash
     * @param int $nonce
     * @param Collection $transactions
     * @return string
     */
    public function generateHash(int $index, int $timestamp, string $previousHash, int $nonce, Collection $transactions): string
    {
        // Normalize transactions to only the core fields
        $txData = $transactions->sortBy('id')->map(function ($tx) {
            return [
                'sender' => $tx->sender,
                'receiver' => $tx->receiver,
                'amount' => (string) $tx->amount, // Cast amount to string for consistency
                'timestamp' => (int) $tx->timestamp,
            ];
        })->values()->toArray(); // .values() resets keys after sorting

        $data = $index . $timestamp . $previousHash . $nonce . json_encode($txData);
        
        // --- THIS IS THE CRITICAL FIX ---
        // Ensure this line says 'sha256', NOT 'sha266'
        return hash('sha256', $data);
        // --- END OF FIX ---
    }

    /**
     * Finds a nonce that satisfies the difficulty rule.
     * Section 6.3: mineBlock() (Proof of Work logic)
     *
     * @param int $index
     * @param int $timestamp
     * @param string $previousHash
     * @param Collection $transactions
     * @return array [nonce, hash]
     */
    protected function proofOfWork(int $index, int $timestamp, string $previousHash, Collection $transactions): array
    {
        $nonce = 0;
        $hash = "";

        while (substr($hash, 0, strlen($this->difficulty)) !== $this->difficulty) {
            $nonce++;
            $hash = $this->generateHash($index, $timestamp, $previousHash, $nonce, $transactions);
        }

        return [$nonce, $hash];
    }

    /**
     * Gets the last block in the chain.
     */
    protected function getLastBlock(): ?Block
    {
        return Block::orderBy('index_no', 'desc')->first();
    }

    /**
     * Mines a new block with the given transactions.
     *
     * @param Collection $transactions
     * @return Block
     */
    public function mineBlock(Collection $transactions): Block
    {
        $lastBlock = $this->getLastBlock();
        $index = $lastBlock ? $lastBlock->index_no + 1 : 0;
        $previousHash = $lastBlock ? $lastBlock->current_hash : '0';
        $timestamp = time();

        // Find the valid nonce and hash
        [$nonce, $hash] = $this->proofOfWork($index, $timestamp, $previousHash, $transactions);

        // Use a database transaction to ensure atomicity
        return DB::transaction(function () use ($index, $timestamp, $previousHash, $nonce, $hash, $transactions) {
            // 1. Create the new block
            $block = Block::create([
                'index_no' => $index,
                'timestamp' => $timestamp,
                'previous_hash' => $previousHash,
                'nonce' => $nonce,
                'current_hash' => $hash,
            ]);

            if ($transactions->isNotEmpty()) {
                // 2. Attach transactions to the block
                $block->transactions()->attach($transactions->pluck('id'));

                // 3. Update transaction statuses
                Transaction::whereIn('id', $transactions->pluck('id'))->update(['status' => 'mined']);
            }

            return $block->load('transactions');
        });
    }

    /**
     * Validates the entire blockchain.
     * Section 6.3: validateChain()
     *
     * @return bool
     */
    public function validateChain(): bool
    {
        $blocks = Block::with('transactions')->orderBy('index_no', 'asc')->get();

        if ($blocks->isEmpty()) {
            // An empty chain is valid, but we should create a Genesis block
            if (Block::count() === 0) {
                $this->mineBlock(collect()); // Mine Genesis
                return true;
            }
        }

        $previousBlock = null;

        foreach ($blocks as $block) {
            // 1. Validate Genesis Block
            if ($block->index_no === 0) {
                $previousBlock = $block;
                continue;
            }

            // 2. Check chain link (previous hash)
            if ($block->previous_hash !== $previousBlock->current_hash) {
                return false; // Chain link is broken
            }

            // 3. Check block integrity (re-calculate hash)
            $transactions = $block->transactions->sortBy('id')->values();

            $recalculatedHash = $this->generateHash(
                $block->index_no,
                $block->timestamp, // This is cast to int by the Model
                $block->previous_hash,
                $block->nonce,
                $transactions
            );

            if ($block->current_hash !== $recalculatedHash) {
                return false; // Block data is tampered
            }

            // 4. Check Proof of Work
            if (substr($block->current_hash, 0, strlen($this->difficulty)) !== $this->difficulty) {
                return false; // PoW is invalid
            }

            $previousBlock = $block;
        }

        return true; // Chain is valid
    }
}