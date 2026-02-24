<?php

namespace App\Helpers;

class ZipToState
{
    /**
     * Derive US state code from a ZIP code using 3-digit prefix ranges.
     * Returns null if the ZIP is invalid or unmapped.
     */
    public static function resolve(string $zip): ?string
    {
        $zip = preg_replace('/[^0-9]/', '', $zip);

        if (strlen($zip) < 3) {
            return null;
        }

        $prefix = (int) substr($zip, 0, 3);

        // USPS ZIP prefix → state mapping (3-digit prefix ranges)
        $ranges = [
            // Territories
            [6, 9, 'PR'],       // Puerto Rico & VI

            // New England
            [10, 27, 'MA'],
            [28, 29, 'RI'],
            [30, 38, 'NH'],
            [39, 49, 'ME'],
            [50, 59, 'VT'],
            [60, 69, 'CT'],

            // Mid-Atlantic
            [70, 89, 'NJ'],
            [100, 149, 'NY'],
            [150, 196, 'PA'],
            [197, 199, 'DE'],

            // DC / MD / VA / WV
            [200, 205, 'DC'],
            [206, 219, 'MD'],
            [220, 246, 'VA'],
            [247, 268, 'WV'],

            // Southeast
            [270, 289, 'NC'],
            [290, 299, 'SC'],
            [300, 319, 'GA'],
            [320, 349, 'FL'],
            [350, 369, 'AL'],
            [370, 385, 'TN'],
            [386, 397, 'MS'],
            [398, 399, 'GA'],

            // East North Central
            [400, 427, 'KY'],
            [430, 458, 'OH'],
            [460, 479, 'IN'],
            [480, 499, 'MI'],

            // West North Central
            [500, 528, 'IA'],
            [530, 549, 'WI'],
            [550, 567, 'MN'],
            [570, 577, 'SD'],
            [580, 588, 'ND'],
            [590, 599, 'MT'],

            // Central
            [600, 629, 'IL'],
            [630, 658, 'MO'],
            [660, 679, 'KS'],
            [680, 693, 'NE'],

            // South Central
            [700, 714, 'LA'],
            [716, 729, 'AR'],
            [730, 749, 'OK'],
            [750, 799, 'TX'],

            // Mountain
            [800, 816, 'CO'],
            [820, 831, 'WY'],
            [832, 838, 'ID'],
            [840, 847, 'UT'],
            [850, 865, 'AZ'],
            [870, 884, 'NM'],
            [885, 885, 'TX'],  // El Paso area
            [889, 898, 'NV'],

            // Pacific
            [900, 961, 'CA'],
            [967, 968, 'HI'],
            [970, 979, 'OR'],
            [980, 994, 'WA'],
            [995, 999, 'AK'],
        ];

        foreach ($ranges as [$min, $max, $state]) {
            if ($prefix >= $min && $prefix <= $max) {
                return $state;
            }
        }

        return null;
    }
}
