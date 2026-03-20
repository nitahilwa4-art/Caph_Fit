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
        Schema::create('daily_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->date('date');
            
            // Macro tracking
            $table->integer('total_calories_consumed')->default(0);
            $table->integer('total_protein_consumed')->default(0);
            $table->integer('total_carbs_consumed')->default(0);
            $table->integer('total_fat_consumed')->default(0);
            $table->integer('total_calories_target')->default(2000);
            $table->boolean('is_workout_day')->default(false);

            // Optional wellness metrics
            $table->decimal('weight', 5, 2)->nullable();
            $table->decimal('sleep_hours', 4, 2)->nullable();
            $table->integer('water_intake')->nullable()->comment('in ml');
            $table->string('mood')->nullable();
            $table->timestamps();
            
            $table->unique(['user_id', 'date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_logs');
    }
};
