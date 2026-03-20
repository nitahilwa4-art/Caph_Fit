<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserPreference extends Model
{
    protected $fillable = [
        'user_id',
        'activity_level',
        'digestion_speed',
        'equipment_available',
        'work_hours',
        'dietary_restrictions'
    ];

    protected $casts = [
        'equipment_available' => 'array',
        'dietary_restrictions' => 'array',
    ];
}
