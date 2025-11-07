<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\BlockchainController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// As per Section 6.1 of the project specification

// POST /api/transaction - create a new transaction (pending)
Route::post('/transaction', [BlockchainController::class, 'createTransaction']);

// GET /api/transactions/pending - list all pending transactions
Route::get('/transactions/pending', [BlockchainController::class, 'getPendingTransactions']);

// POST /api/block/mine - create a new block using pending transactions
Route::post('/block/mine', [BlockchainController::class, 'mineBlock']);

// GET /api/blocks - list all blocks
Route::get('/blocks', [BlockchainController::class, 'getBlocks']);

// GET /api/blockchain/validate - check blockchain integrity
Route::get('/blockchain/validate', [BlockchainController::class, 'validateChain']);


/*

*this is the default content of api.php file that came with laravel installation

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
*/