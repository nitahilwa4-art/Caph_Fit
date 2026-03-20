<?php

namespace App\Repositories\Contracts;

interface WorkoutRepositoryInterface
{
    public function getAllForUser(int $userId);
    public function findByIdAndUser(int $id, int $userId);
    public function create(array $data);
    public function addLog(int $workoutId, array $logData);
}
