<?php

namespace App\Http\Controllers;

use App\Models\Block;
use App\Models\Transaction;
use Illuminate\Http\Request;
use App\Services\BlockchainService;
use Illuminate\Support\Facades\Validator;

/**
 * Section 6.1: API Endpoints
 * Section 6.2: Core Classes
 */
class BlockchainController extends Controller
{
    protected $blockchainService;

    public function __construct(BlockchainService $blockchainService)
    {
        $this->blockchainService = $blockchainService;
    }

    /**
     * Endpoint: POST /api/transaction
     * Creates a new transaction and adds it to the pending pool.
     */
    public function createTransaction(Request $request)
    {
        // Section 8: Validation rules
        $validator = Validator::make($request->all(), [
            'sender' => 'required|string|max:255',
            'receiver' => 'required|string|max:255|different:sender',
            'amount' => 'required|numeric|gt:0',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Invalid input.', 'errors' => $validator->errors()], 422);
        }

        $transaction = Transaction::create([
            'sender' => $request->sender,
            'receiver' => $request->receiver,
            'amount' => $request->amount,
            'timestamp' => time(), // Use current Unix timestamp
            'status' => 'pending',
        ]);

        return response()->json($transaction, 201);
    }

    /**
     * Endpoint: GET /api/transactions/pending
     * Lists all transactions with 'pending' status.
     */
    public function getPendingTransactions()
    {
        $transactions = Transaction::where('status', 'pending')->orderBy('id', 'desc')->get();
        return response()->json($transactions);
    }

    /**
     * Endpoint: POST /api/block/mine
     * Creates a new block using all pending transactions.
     */
    public function mineBlock()
    {
        // 1. Get all pending transactions
        // FIX: Added orderBy('id', 'asc') to ensure a consistent order for hashing.
        $pendingTransactions = Transaction::where('status', 'pending')
                                            ->orderBy('id', 'asc')
                                            ->get();

        if ($pendingTransactions->isEmpty()) {
            // Check for Genesis Block
            $blockCount = Block::count();
            if ($blockCount == 0) {
                // No transactions, but we need a Genesis Block. Mine it.
                $newBlock = $this->blockchainService->mineBlock(collect());
                return response()->json($newBlock, 201);
            }

            // Not Genesis, and no transactions
            return response()->json(['message' => 'No pending transactions to mine.'], 400);
        }

        // 2. Mine the new block
        $newBlock = $this->blockchainService->mineBlock($pendingTransactions);

        return response()->json($newBlock, 201);
    }

    /**
     * Endpoint: GET /api/blocks
     * Lists all blocks in the chain, with their transactions.
     */
    public function getBlocks()
    {
        // Eager load transactions to prevent N+1 queries
        $blocks = Block::with('transactions')->orderBy('index_no', 'asc')->get();
        return response()->json($blocks);
    }

    /**
     * Endpoint: GET /api/blockchain/validate
     * Checks the integrity of the entire blockchain.
     */
    public function validateChain()
    {
        $isValid = $this->blockchainService->validateChain();

        if ($isValid) {
            return response()->json([
                'is_valid' => true,
                'message' => 'Blockchain is Secure.'
            ]);
        } else {
            return response()->json([
                'is_valid' => false,
                'message' => 'Blockchain is Broken! (Invalid hash or chain link)'
            ]);
        }
    }
}