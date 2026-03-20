<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user()->load(['profile', 'preference']);
    })->middleware('auth:sanctum');

    Route::post('/register', [\App\Http\Controllers\Api\V1\AuthController::class, 'register']);
    Route::post('/login', [\App\Http\Controllers\Api\V1\AuthController::class, 'login'])->name('login');
    Route::middleware('auth:sanctum')->post('/logout', [\App\Http\Controllers\Api\V1\AuthController::class, 'logout']);

    Route::middleware('auth:sanctum')->group(function () {
        // Profile & Preferences
        Route::get('/profile', [\App\Http\Controllers\Api\V1\ProfileController::class, 'show']);
        Route::post('/profile', [\App\Http\Controllers\Api\V1\ProfileController::class, 'store']);
        Route::get('/preference', [\App\Http\Controllers\Api\V1\PreferenceController::class, 'show']);
        Route::post('/preference', [\App\Http\Controllers\Api\V1\PreferenceController::class, 'store']);

        // Daily Logs
        Route::get('/daily-logs', [\App\Http\Controllers\Api\V1\DailyLogController::class, 'index']);
        Route::get('/daily-logs/{date}', [\App\Http\Controllers\Api\V1\DailyLogController::class, 'show']);
        Route::post('/daily-logs/{date}', [\App\Http\Controllers\Api\V1\DailyLogController::class, 'updateOrCreate']);

        // Food Entries
        Route::get('/food-entries', [\App\Http\Controllers\Api\V1\FoodController::class, 'index']);
        Route::post('/food-entries', [\App\Http\Controllers\Api\V1\FoodController::class, 'store']);

        // Workouts
        Route::apiResource('workouts', \App\Http\Controllers\Api\V1\WorkoutController::class);
    });
});
