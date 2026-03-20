<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Workout extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 
        'date', 
        'routine_name', 
        'exercises',
        'coach_notes'
    ];

    protected $casts = [
        'exercises' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function logs()
    {
        return $this->hasMany(WorkoutLog::class);
    }
}
