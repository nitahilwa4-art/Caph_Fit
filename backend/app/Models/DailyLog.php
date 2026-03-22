<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DailyLog extends Model
{
    protected $fillable = [
        'user_id',
        'date',
        'total_calories_consumed',
        'total_protein_consumed',
        'total_carbs_consumed',
        'total_fat_consumed',
        'total_calories_target',
        'is_workout_day',
        'weight',
        'sleep_hours',
        'water_intake',
        'mood',
    ];
}
