<?php

namespace App\Services;

use App\Repositories\Contracts\WorkoutRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class WorkoutService
{
    protected $workoutRepository;

    public function __construct(WorkoutRepositoryInterface $workoutRepository)
    {
        $this->workoutRepository = $workoutRepository;
    }

    public function getUserWorkouts(int $userId)
    {
        return $this->workoutRepository->getAllForUser($userId);
    }

    public function getWorkoutDetails(int $id, int $userId)
    {
        return $this->workoutRepository->findByIdAndUser($id, $userId);
    }

    public function recordWorkout(int $userId, array $data)
    {
        DB::beginTransaction();
        try {
            // 1. Create Workout Header
            $workout = $this->workoutRepository->create([
                'user_id' => $userId,
                'date' => $data['date'],
                'name' => $data['name'],
                'duration_minutes' => $data['duration_minutes'] ?? null,
            ]);

            // 2. Add Exercises (Logs)
            if (!empty($data['exercises'])) {
                foreach ($data['exercises'] as $exercise) {
                    $this->workoutRepository->addLog($workout->id, [
                        'exercise_name' => $exercise['name'],
                        'sets' => $exercise['sets'] ?? 0,
                        'reps' => $exercise['reps'] ?? 0,
                        'weight' => $exercise['weight'] ?? 0,
                    ]);
                }
            }

            DB::commit();
            
            // Reload with relations to return fresh data
            return $this->getWorkoutDetails($workout->id, $userId);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Failed to record workout: " . $e->getMessage());
            throw $e;
        }
    }
}
