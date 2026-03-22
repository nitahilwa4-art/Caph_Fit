<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('food_entries', function (Blueprint $table) {
            $table->integer('portion_grams')->nullable()->after('food_name');
            $table->string('portion_description')->nullable()->after('portion_grams');
            $table->enum('confidence', ['HIGH', 'MEDIUM', 'LOW'])->nullable()->after('fat');
            $table->string('hidden_calories_warning')->nullable()->after('confidence');
            $table->string('input_type')->nullable()->after('hidden_calories_warning');
            $table->text('raw_prompt')->nullable()->after('input_type');
        });
    }

    public function down(): void
    {
        Schema::table('food_entries', function (Blueprint $table) {
            $table->dropColumn([
                'portion_grams',
                'portion_description',
                'confidence',
                'hidden_calories_warning',
                'input_type',
                'raw_prompt',
            ]);
        });
    }
};
