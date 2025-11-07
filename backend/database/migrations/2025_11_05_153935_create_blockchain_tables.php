<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration file based on Section 5: Database Design
 * Using suggested timeline date: October 7th
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Table: transactions
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->string('sender');
            $table->string('receiver');
            $table->decimal('amount', 16, 8); // Using decimal for currency
            $table->bigInteger('timestamp');
            $table->string('status')->default('pending')->index(); // 'pending' or 'mined'
            $table->timestamps();
        });

        // Table: blocks
        Schema::create('blocks', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('index_no')->unique();
            $table->text('previous_hash');
            $table->text('current_hash');
            $table->bigInteger('nonce');
            $table->bigInteger('timestamp');
            $table->timestamps();
        });

        // Table: block_transactions (pivot)
        Schema::create('block_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('block_id')->constrained()->onDelete('cascade');
            $table->foreignId('transaction_id')->constrained()->onDelete('cascade');
            
            $table->unique(['block_id', 'transaction_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('block_transactions');
        Schema::dropIfExists('blocks');
        Schema::dropIfExists('transactions');
    }
};