<?php

use App\Http\Controllers\Api\Admin;
use App\Http\Controllers\Api\ArticleController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PetController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ReminderController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\SmartFilterController;
use App\Http\Controllers\Api\SubscriptionController;
use Illuminate\Support\Facades\Route;

// --- Publiskie maršruti (viesis) ---
Route::get('/meta', [CatalogController::class, 'meta']);
Route::get('/products', [CatalogController::class, 'index']);
Route::get('/products/{product}', [CatalogController::class, 'show']);
Route::post('/smart-filter', SmartFilterController::class);
Route::get('/articles', [ArticleController::class, 'index']);
Route::get('/articles/{article}', [ArticleController::class, 'show']);
Route::get('/lockers', [OrderController::class, 'lockers']);

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

    // Grozs
    Route::get('/cart', [CartController::class, 'show']);
    Route::post('/cart/items', [CartController::class, 'add']);
    Route::put('/cart/items/{product}', [CartController::class, 'update']);
    Route::delete('/cart/items/{product}', [CartController::class, 'remove']);
    Route::post('/cart/merge', [CartController::class, 'merge']);

    // Pasūtījumi un abonementi
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{order}', [OrderController::class, 'show']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/subscriptions', [SubscriptionController::class, 'index']);
    Route::put('/subscriptions/{subscription}', [SubscriptionController::class, 'update']);

    // Atsauksmes
    Route::get('/reviews/mine', [ReviewController::class, 'mine']);
    Route::post('/products/{product}/reviews', [ReviewController::class, 'store']);
    Route::put('/reviews/{review}', [ReviewController::class, 'update']);
    Route::delete('/reviews/{review}', [ReviewController::class, 'destroy']);
});

// --- Administrators ---
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    Route::get('/dashboard', Admin\DashboardController::class);

    Route::apiResource('products', Admin\ProductController::class)->except('show');
    // multipart/form-data ar attēlu: PUT tiek sūtīts kā POST + _method=PUT
    Route::post('/products/{product}', [Admin\ProductController::class, 'update']);
    Route::apiResource('categories', Admin\CategoryController::class)->except('show');
    Route::apiResource('brands', Admin\BrandController::class)->except('show');
    Route::apiResource('problems', Admin\ProblemController::class)->except('show');
    Route::apiResource('articles', Admin\ArticleController::class)->except('show');
    Route::apiResource('users', Admin\UserController::class)->except('show');

    Route::get('/orders', [Admin\OrderController::class, 'index']);
    Route::put('/orders/{order}', [Admin\OrderController::class, 'update']);
    Route::get('/subscriptions', [Admin\SubscriptionController::class, 'index']);
    Route::put('/subscriptions/{subscription}', [Admin\SubscriptionController::class, 'update']);
    Route::get('/reviews', [Admin\ReviewController::class, 'index']);
    Route::put('/reviews/{review}', [Admin\ReviewController::class, 'update']);
    Route::delete('/reviews/{review}', [Admin\ReviewController::class, 'destroy']);
});
