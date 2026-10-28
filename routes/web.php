<?php

use Illuminate\Support\Facades\Route;

// Visas lapas apkalpo React SPA (react-router)
Route::view('/{any?}', 'app')->where('any', '^(?!api).*$');
