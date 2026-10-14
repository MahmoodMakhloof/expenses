package com.mahmood.mizan;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;

import org.json.JSONArray;
import org.json.JSONObject;

/** Schedules the reminder list the web app sends (bills, installments, shortfall warnings...). */
final class Reminders {
    private static Intent intentFor(Context c, int code) {
        return new Intent(c, ReminderReceiver.class).setData(Uri.parse("mizan://r/" + code));
    }

    static void reschedule(Context c) {
        SharedPreferences p = Prefs.get(c);
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        for (String s : p.getString("reminderCodes", "").split(",")) {
            if (s.isEmpty()) continue;
            try {
                int code = Integer.parseInt(s);
                PendingIntent pi = PendingIntent.getBroadcast(c, code, intentFor(c, code),
                        PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE);
                if (pi != null) { am.cancel(pi); pi.cancel(); }
            } catch (NumberFormatException ignored) {}
        }
        StringBuilder codes = new StringBuilder();
        try {
            JSONArray arr = new JSONArray(p.getString("reminders", "[]"));
            long now = System.currentTimeMillis();
            for (int i = 0; i < arr.length(); i++) {
                JSONObject o = arr.getJSONObject(i);
                long at = o.getLong("at");
                if (at <= now) continue;
                int code = o.getString("id").hashCode() & 0x7fffffff;
                Intent in = intentFor(c, code)
                        .putExtra("nid", code)
                        .putExtra("title", o.getString("title"))
                        .putExtra("body", o.getString("body"));
                PendingIntent pi = PendingIntent.getBroadcast(c, code, in,
                        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
                codes.append(code).append(',');
            }
        } catch (Exception ignored) {}
        p.edit().putString("reminderCodes", codes.toString()).apply();
    }
}
