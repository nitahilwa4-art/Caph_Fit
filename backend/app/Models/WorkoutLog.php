<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkoutLog extends Model
{
    use HasFactory;

    protected $fillable = ['workout_id', 'exercise_name', 'sets', 'reps', 'weight'];

    public function workout()
    {
        return $this->belongsTo(Workout::class);
    }
}
