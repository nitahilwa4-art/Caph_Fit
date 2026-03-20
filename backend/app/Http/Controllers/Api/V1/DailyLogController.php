<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\DailyLog;

class DailyLogController extends Controller
{
    public function index(Request $request)
    {
        $limit = $request->query('limit', 365);
        $logs = DailyLog::where('user_id', $request->user()->id)
            ->orderBy('date', 'asc')
            ->take($limit)
            ->get();
        return response()->json($logs);
    }

    public function show(Request $request, $date)
    {
        $log = DailyLog::where('user_id', $request->user()->id)
            ->where('date', $date)
            ->first();
        if (!$log) {
            return response()->json(null, 404);
        }
        return response()->json($log);
    }

    public function updateOrCreate(Request $request, $date)
    {
        $validated = $request->validate([
            'total_calories_consumed' => 'nullable|integer',
            'total_protein_consumed' => 'nullable|integer',
            'total_carbs_consumed' => 'nullable|integer',
            'total_fat_consumed' => 'nullable|integer',
            'total_calories_target' => 'nullable|integer',
            'is_workout_day' => 'nullable|boolean',
            'weight' => 'nullable|numeric',
            'sleep_hours' => 'nullable|numeric',
            'water_intake' => 'nullable|integer',
            'mood' => 'nullable|string',
        ]);

        $log = DailyLog::updateOrCreate(
            ['user_id' => $request->user()->id, 'date' => $date],
            $validated
        );

        return response()->json($log);
    }
}
