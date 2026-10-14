package com.mahmood.mizan;

import android.app.KeyguardManager;
import android.content.ContentValues;
import android.content.Context;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.webkit.JavascriptInterface;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/** Methods the web app calls as window.MizanNative.* */
final class Bridge {
    private final MainActivity a;

    Bridge(MainActivity a) { this.a = a; }

    @JavascriptInterface
    public String saveBackup(String json, String name) {
        try {
            byte[] data = json.getBytes(StandardCharsets.UTF_8);
            if (Build.VERSION.SDK_INT >= 29) {
                ContentValues v = new ContentValues();
                v.put(MediaStore.MediaColumns.DISPLAY_NAME, name);
                v.put(MediaStore.MediaColumns.MIME_TYPE, "application/json");
                v.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/Mizan");
                Uri u = a.getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
                if (u == null) return "";
                try (OutputStream o = a.getContentResolver().openOutputStream(u)) {
                    if (o == null) return "";
                    o.write(data);
                }
                return "Downloads/Mizan";
            }
            File dir = new File(a.getExternalFilesDir(null), "backups");
            if (!dir.exists() && !dir.mkdirs()) return "";
            File f = new File(dir, name);
            try (FileOutputStream o = new FileOutputStream(f)) { o.write(data); }
            return f.getAbsolutePath();
        } catch (Exception e) {
            return "";
        }
    }

    @JavascriptInterface
    public void scheduleReminders(String json) {
        Prefs.get(a).edit().putString("reminders", json).apply();
        Reminders.reschedule(a);
    }

    @JavascriptInterface
    public void updateWidget(String json) {
        Prefs.get(a).edit().putString("widget", json).apply();
        MizanWidget.updateAll(a);
    }

    @JavascriptInterface
    public void setLock(boolean on) {
        Prefs.get(a).edit().putBoolean("lock", on).apply();
        if (on) a.markUnlocked();
    }

    @JavascriptInterface
    public boolean lockAvailable() {
        KeyguardManager km = (KeyguardManager) a.getSystemService(Context.KEYGUARD_SERVICE);
        return km != null && km.isDeviceSecure();
    }

    @JavascriptInterface
    public void requestNotif() {
        a.runOnUiThread(a::askNotifPermission);
    }
}
