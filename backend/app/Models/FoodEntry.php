<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FoodEntry extends Model
{
    protected $fillable = [
        'user_id',
        'date',
        'food_name',
        'calories',
        'protein',
        'carbs',
        'fat',
        'reasoning'
    ];
}
