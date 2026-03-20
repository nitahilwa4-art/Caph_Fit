<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\FoodEntry;
use App\Models\DailyLog;
use App\Models\UserProfile;
use Illuminate\Support\Facades\DB;

class FoodController extends Controller
{
    public function index(Request $request)
    {
        $date = $request->query('date');
        $query = FoodEntry::where('user_id', $request->user()->id);
        
        if ($date) {
            $query->where('date', $date);
        }

        $entries = $query->orderBy('created_at', 'desc')->get();
        return response()->json($entries);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'food_name' => 'required|string',
            'calories' => 'required|integer',
            'protein' => 'nullable|integer',
            'carbs' => 'nullable|integer',
            'fat' => 'nullable|integer',
            'reasoning' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $entry = FoodEntry::create([
                'user_id' => $request->user()->id,
                ...$validated
            ]);

            // Auto-update daily log
            $log = DailyLog::firstOrCreate(
                ['user_id' => $request->user()->id, 'date' => $validated['date']],
                ['total_calories_target' => $request->user()->profile?->target_calories ?? 2000]
            );

            $log->total_calories_consumed += $validated['calories'];
            $log->total_protein_consumed += $validated['protein'] ?? 0;
            $log->total_carbs_consumed += $validated['carbs'] ?? 0;
            $log->total_fat_consumed += $validated['fat'] ?? 0;
            $log->save();

            DB::commit();
            return response()->json($entry, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Failed to save food entry'], 500);
        }
    }
}
