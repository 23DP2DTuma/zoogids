<?php

use App\Http\Controllers\Api\ArticleController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PetController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ReminderController;
use App\Http\Controllers\Api\SmartFilterController;
use Illuminate\Support\Facades\Route;

// --- Publiskie maršruti (viesis) ---
Route::get('/meta', [CatalogController::class, 'meta']);
Route::get('/products', [CatalogController::class, 'index']);
Route::get('/products/{product}', [CatalogController::class, 'show']);
Route::post('/smart-filter', SmartFilterController::class);
Route::get('/articles', [ArticleController::class, 'index']);
Route::get('/articles/{article}', [ArticleController::class, 'show']);
Route::post('/orders', [OrderController::class, 'store']);

Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:login');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');

// --- Reģistrēts lietotājs ---
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/user', [ProfileController::class, 'show']);
    Route::put('/user', [ProfileController::class, 'update']);
    Route::put('/user/password', [ProfileController::class, 'password']);
    Route::delete('/user', [ProfileController::class, 'destroy']);

    // Mīluļi un atgādinājumi
    Route::apiResource('pets', PetController::class);
    Route::get('/reminders/upcoming', [ReminderController::class, 'upcoming']);
    Route::post('/pets/{pet}/reminders', [ReminderController::class, 'store']);
    Route::put('/reminders/{reminder}', [ReminderController::class, 'update']);
    Route::delete('/reminders/{reminder}', [ReminderController::class, 'destroy']);

});
