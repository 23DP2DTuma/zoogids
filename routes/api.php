<?php

use App\Http\Controllers\Api\ArticleController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\SmartFilterController;
use Illuminate\Support\Facades\Route;

Route::get('/meta', [CatalogController::class, 'meta']);
Route::get('/products', [CatalogController::class, 'index']);
Route::get('/products/{product}', [CatalogController::class, 'show']);
Route::post('/smart-filter', SmartFilterController::class);
Route::get('/articles', [ArticleController::class, 'index']);
Route::get('/articles/{article}', [ArticleController::class, 'show']);
Route::post('/orders', [OrderController::class, 'store']);
