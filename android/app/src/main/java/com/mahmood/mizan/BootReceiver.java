package com.mahmood.mizan;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Alarms are cleared on reboot and app update; put them back. */
public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context c, Intent intent) {
        Reminders.reschedule(c);
        MizanWidget.updateAll(c);
    }
}
