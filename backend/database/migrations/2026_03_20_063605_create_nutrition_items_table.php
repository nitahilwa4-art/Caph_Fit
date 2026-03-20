<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('nutrition_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('nutrition_log_id')->constrained('nutrition_logs')->onDelete('cascade');
            $table->string('food_name');
            $table->integer('calories')->default(0);
            $table->json('macronutrients_json')->nullable();
            $table->string('meal_type')->nullable(); // Breakfast, Lunch, Dinner, Snack
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('nutrition_items');
    }
};
