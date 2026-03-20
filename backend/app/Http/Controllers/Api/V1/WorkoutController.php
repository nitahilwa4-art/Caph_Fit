<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Workout;
use Illuminate\Http\Request;

class WorkoutController extends Controller
{
    public function index(Request $request)
    {
        $workouts = Workout::where('user_id', $request->user()->id)
            ->orderBy('date', 'desc')
            ->get();
        return response()->json($workouts);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'routine_name' => 'required|string|max:255',
            'exercises' => 'nullable|array',
            'coach_notes' => 'nullable|string',
        ]);

        $workout = Workout::updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'date' => $validated['date'],
                'routine_name' => $validated['routine_name'] // A user might theoretically have two workouts a day, but frontend currently treats one session per save
            ],
            $validated
        );

        return response()->json($workout, 201);
    }

    public function show(Request $request, $id)
    {
        $workout = Workout::where('user_id', $request->user()->id)->findOrFail($id);
        return response()->json($workout);
    }
}
