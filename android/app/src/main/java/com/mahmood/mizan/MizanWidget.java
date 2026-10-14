package com.mahmood.mizan;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

/** Home-screen widget: today's allowance, balance, and one-tap "add expense" buttons. */
public class MizanWidget extends AppWidgetProvider {
    private static final int[] SLOT = {R.id.w_c1, R.id.w_c2, R.id.w_c3, R.id.w_c4};
    private static final int[] ICON = {R.id.w_c1i, R.id.w_c2i, R.id.w_c3i, R.id.w_c4i};
    private static final int[] NAME = {R.id.w_c1n, R.id.w_c2n, R.id.w_c3n, R.id.w_c4n};

    @Override
    public void onUpdate(Context c, AppWidgetManager m, int[] ids) {
        m.updateAppWidget(ids, build(c));
    }

    static void updateAll(Context c) {
        AppWidgetManager m = AppWidgetManager.getInstance(c);
        int[] ids = m.getAppWidgetIds(new ComponentName(c, MizanWidget.class));
        if (ids != null && ids.length > 0) m.updateAppWidget(ids, build(c));
    }

    private static RemoteViews build(Context c) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_quick);
        JSONObject o;
        try { o = new JSONObject(Prefs.get(c).getString("widget", "{}")); } catch (Exception e) { o = new JSONObject(); }
        String cur = o.optString("cur", "ج.م");
        v.setTextViewText(R.id.w_allowed, o.optString("allowed", "—") + " " + cur);
        String cash = o.optString("cash", "");
        v.setTextViewText(R.id.w_cash, cash.isEmpty() ? "ميزان" : "معاك " + cash);
        String warn = o.optString("warn", "");
        v.setViewVisibility(R.id.w_warn, warn.isEmpty() ? View.GONE : View.VISIBLE);
        v.setTextViewText(R.id.w_warn, "⚠ " + warn);
        v.setOnClickPendingIntent(R.id.w_top, open(c));
        v.setOnClickPendingIntent(R.id.w_add, add(c, "", 100));
        JSONArray cats = o.optJSONArray("cats");
        for (int i = 0; i < SLOT.length; i++) {
            JSONObject k = cats != null ? cats.optJSONObject(i) : null;
            if (k == null) { v.setViewVisibility(SLOT[i], View.GONE); continue; }
            v.setViewVisibility(SLOT[i], View.VISIBLE);
            v.setTextViewText(ICON[i], k.optString("icon"));
            v.setTextViewText(NAME[i], k.optString("name"));
            v.setOnClickPendingIntent(SLOT[i], add(c, k.optString("id"), 101 + i));
        }
        return v;
    }

    private static PendingIntent add(Context c, String cat, int code) {
        Intent i = new Intent(c, MainActivity.class)
                .setAction(MainActivity.ACTION_ADD)
                .setData(Uri.parse("mizan://add/" + cat))
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        return PendingIntent.getActivity(c, code, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private static PendingIntent open(Context c) {
        Intent i = new Intent(c, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        return PendingIntent.getActivity(c, 99, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
}
