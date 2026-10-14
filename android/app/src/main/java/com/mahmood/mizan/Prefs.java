package com.mahmood.mizan;

import android.content.Context;
import android.content.SharedPreferences;

final class Prefs {
    static SharedPreferences get(Context c) {
        return c.getApplicationContext().getSharedPreferences("mizan", Context.MODE_PRIVATE);
    }
}
