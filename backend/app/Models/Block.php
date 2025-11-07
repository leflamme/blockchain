<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Section 5: Database Design
 * Table: blocks
*/
class Block extends Model
{
    use HasFactory;

    protected $fillable = [
        'index_no',
        'previous_hash',
        'current_hash',
        'nonce',
        'timestamp',
    ];

    /**
     * The attributes that should be cast.
     *
     * FIX: This is critical. It ensures that when Laravel reads the 'timestamp'
     * from the database (which Postgres stores as a string), it casts it
     * back into an integer (Unix timestamp). This makes the validation hash
     * match the mining hash.
     */
    protected $casts = [
        'timestamp' => 'integer',
        'nonce' => 'integer',
        'index_no' => 'integer',
    ];

    /**
     * The transactions that belong to the block.
     * Section 5: block_transactions pivot table
    */
    public function transactions()
    {
        return $this->belongsToMany(Transaction::class, 'block_transactions');
    }
};
