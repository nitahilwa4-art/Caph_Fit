<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FoodEntry extends Model
{
    protected $fillable = [
        'user_id',
        'date',
        'food_name',
        'portion_grams',
        'portion_description',
        'calories',
        'protein',
        'carbs',
        'fat',
        'confidence',
        'hidden_calories_warning',
        'input_type',
        'raw_prompt',
        'reasoning',
    ];
}
