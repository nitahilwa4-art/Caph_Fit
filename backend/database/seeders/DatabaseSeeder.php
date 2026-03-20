<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        $user = User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@caph.fit',
            'password' => bcrypt('password123'),
        ]);

        $workoutId = \DB::table('workouts')->insertGetId([
            'user_id' => $user->id,
            'date' => now()->toDateString(),
            'routine_name' => 'Morning Push Day',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        \DB::table('workout_logs')->insert([
            'workout_id' => $workoutId,
            'exercise_name' => 'Bench Press',
            'sets' => 4,
            'reps' => 10,
            'weight' => 60.5,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $nutritionId = \DB::table('nutrition_logs')->insertGetId([
            'user_id' => $user->id,
            'date' => now()->toDateString(),
            'total_calories' => 2000,
            'total_protein' => 150,
            'total_carbs' => 200,
            'total_fat' => 60,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        \DB::table('nutrition_items')->insert([
            'nutrition_log_id' => $nutritionId,
            'food_name' => 'Chicken Breast',
            'calories' => 165,
            'macronutrients_json' => json_encode(['protein' => 31, 'carbs' => 0, 'fat' => 3.6]),
            'meal_type' => 'Lunch',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
