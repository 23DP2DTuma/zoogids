<?php

use Illuminate\Support\Facades\Route;

// Visas lapas apkalpo React SPA (react-router); /api, /sanctum un /storage netiek pārtverti
Route::view('/{any?}', 'app')->where('any', '^(?!api|sanctum|storage|up$).*$');
