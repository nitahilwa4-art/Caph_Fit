<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Workout;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WorkoutApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_workout_with_logs()
    {
        // 1. Arrange
        $user = User::factory()->create(['id' => 1]);

        $payload = [
            'date' => '2026-03-20',
            'name' => 'Full Body Test',
            'duration_minutes' => 45,
            'exercises' => [
                [
                    'name' => 'Squat',
                    'sets' => 3,
                    'reps' => 10,
                    'weight' => 100
                ]
            ]
        ];

        // 2. Act
        $response = $this->postJson('/api/v1/workouts', $payload);

        // 3. Assert
        $response->dump();
        $response->assertStatus(201)
                 ->assertJsonPath('data.name', 'Full Body Test')
                 ->assertJsonPath('data.exercises.0.name', 'Squat');

        $this->assertDatabaseHas('workouts', [
            'user_id' => 1,
            'name' => 'Full Body Test'
        ]);

        $this->assertDatabaseHas('workout_logs', [
            'exercise_name' => 'Squat'
        ]);
    }
}
