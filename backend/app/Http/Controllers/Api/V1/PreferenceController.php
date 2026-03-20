<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class PreferenceController extends Controller
{
    public function show(Request $request)
    {
        $preference = $request->user()->preference;
        if (!$preference) {
            return response()->json(null, 404);
        }
        return response()->json($preference);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'activity_level' => 'nullable|string',
            'digestion_speed' => 'nullable|string',
            'equipment_available' => 'nullable|array',
            'work_hours' => 'nullable|string',
            'dietary_restrictions' => 'nullable|array',
        ]);

        $preference = $request->user()->preference()->updateOrCreate(
            ['user_id' => $request->user()->id],
            $validated
        );

        return response()->json($preference);
    }
}
