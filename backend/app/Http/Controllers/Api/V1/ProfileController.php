<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        $profile = $request->user()->profile;
        if (!$profile) {
            return response()->json(null, 404);
        }
        return response()->json($profile);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'gender' => 'nullable|string',
            'dob' => 'nullable|date',
            'height' => 'nullable|numeric',
            'starting_weight' => 'nullable|numeric',
            'target_weight' => 'nullable|numeric',
            'goal_type' => 'nullable|string',
            'target_calories' => 'nullable|integer',
        ]);

        $profile = $request->user()->profile()->updateOrCreate(
            ['user_id' => $request->user()->id],
            $validated
        );

        return response()->json($profile);
    }
}
