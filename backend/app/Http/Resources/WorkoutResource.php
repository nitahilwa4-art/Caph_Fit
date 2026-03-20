<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WorkoutResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'name' => $this->name,
            'date' => $this->date,
            'duration_minutes' => $this->duration_minutes,
            'exercises' => $this->whenLoaded('logs', function () {
                return $this->logs->map(function ($log) {
                    return [
                        'id' => $log->id,
                        'name' => $log->exercise_name,
                        'sets' => $log->sets,
                        'reps' => $log->reps,
                        'weight' => $log->weight,
                    ];
                });
            }),
            'created_at' => $this->created_at,
        ];
    }
}
