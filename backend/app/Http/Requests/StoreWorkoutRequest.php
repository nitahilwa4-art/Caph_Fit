<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreWorkoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; 
    }

    public function rules(): array
    {
        return [
            'date' => 'required|date',
            'name' => 'required|string|max:255',
            'duration_minutes' => 'nullable|integer|min:1',
            'exercises' => 'nullable|array',
            'exercises.*.name' => 'required|string|max:255',
            'exercises.*.sets' => 'nullable|integer|min:1',
            'exercises.*.reps' => 'nullable|integer|min:1',
            'exercises.*.weight' => 'nullable|numeric|min:0',
        ];
    }
}
