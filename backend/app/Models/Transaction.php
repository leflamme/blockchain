<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Section 5: Database Design
 * Table: transactions
 */
class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'sender',
        'receiver',
        'amount',
        'timestamp',
        'status', // 'pending' or 'mined'
    ];

    /**
     * The attributes that should be cast.
     *
     * FIX: This is the second part of the timestamp bug.
     * We must cast the transaction's timestamp to an integer
     * so that the hash calculated during validation matches the
     * hash calculated during mining.
     *
     * We also cast 'amount' to a string to ensure the
     * decimal precision is treated identically during
     * hashing, as Postgres decimals are read as strings.
     */
    protected $casts = [
        'timestamp' => 'integer',
        'amount' => 'string',
    ];


    /**
     * The blocks that this transaction belongs to.
     * A transaction should only belong to one block.
     */
    public function blocks()
    {
        return $this->belongsToMany(Block::class, 'block_transactions');
    }
}