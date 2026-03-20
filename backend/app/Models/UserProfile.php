<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserProfile extends Model
{
    protected $fillable = [
        'user_id', 
        'gender', 
        'dob', 
        'height', 
        'starting_weight', 
        'target_weight', 
        'goal_type', 
        'target_calories'
    ];
}
