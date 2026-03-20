<?php

namespace App\Repositories\Eloquent;

use App\Models\Workout;
use App\Repositories\Contracts\WorkoutRepositoryInterface;

class WorkoutRepository implements WorkoutRepositoryInterface
{
    public function getAllForUser(int $userId)
    {
        return Workout::with('logs')->where('user_id', $userId)->orderBy('date', 'desc')->get();
    }

    public function findByIdAndUser(int $id, int $userId)
    {
        return Workout::with('logs')->where('id', $id)->where('user_id', $userId)->firstOrFail();
    }

    public function create(array $data)
    {
        return Workout::create($data);
    }

    public function addLog(int $workoutId, array $logData)
    {
        $workout = Workout::findOrFail($workoutId);
        return $workout->logs()->create($logData); // Assuming 'logs' relationship is defined
    }
}
