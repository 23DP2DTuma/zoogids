<?php

// Pārējie angļu teksti nāk no Laravel ietvara; šeit tikai precizējumi
return [
    'before_or_equal' => 'The :attribute field must not be in the future.',
    'custom' => [
        'email' => ['unique' => 'A user with this email is already registered.'],
        'weight' => ['gt' => 'Weight must be a positive number.', 'decimal' => 'The weight field must have at most 2 decimal places.'],
        'price' => ['gt' => 'Price must be a positive number.', 'decimal' => 'The price field must have at most 2 decimal places.'],
        'interval_days' => [
            'min' => 'Subscription interval must be between 7 and 90 days.',
            'max' => 'Subscription interval must be between 7 and 90 days.',
        ],
        'subscription_interval' => [
            'min' => 'Subscription interval must be between 7 and 90 days.',
            'max' => 'Subscription interval must be between 7 and 90 days.',
        ],
        'rating' => [
            'min' => 'Rating must be between 1 and 5 stars.',
            'max' => 'Rating must be between 1 and 5 stars.',
        ],
        'text' => ['required' => 'Please describe the problem.'],
    ],
    'attributes' => [
        'name' => 'first name',
        'last_name' => 'last name',
        'birth_date' => 'birth date',
        'category_id' => 'category',
        'brand_id' => 'brand',
        'locker_id' => 'parcel locker',
        'interval_days' => 'interval',
        'product_id' => 'product',
        'image_file' => 'image file',
        'text' => 'problem description',
    ],
];
