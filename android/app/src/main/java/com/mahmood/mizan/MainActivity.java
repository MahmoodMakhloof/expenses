package com.mahmood.mizan;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.KeyguardManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.hardware.biometrics.BiometricManager;
import android.hardware.biometrics.BiometricPrompt;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.CancellationSignal;
import android.view.View;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONObject;

public class MainActivity extends Activity {
    static final String ACTION_ADD = "com.mahmood.mizan.ADD";
    private static final int REQ_FILE = 11, REQ_AUTH = 12, REQ_NOTIF = 13;
    private static final long RELOCK_MS = 60_000;

    private WebView web;
    private boolean pageReady = false;
    private String pendingAdd = null;
    private ValueCallback<Uri[]> fileCb;
    private boolean unlocked = false, authing = false;
    private long lastStop = 0;

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        web = new WebView(this);
        web.setBackgroundColor(getResources().getColor(R.color.bg, getTheme()));
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        s.setTextZoom(100);
        web.addJavascriptInterface(new Bridge(this), "MizanNative");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                if ("file".equals(u.getScheme())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception ignored) {}
                return true;
            }
            @Override
            public void onPageFinished(WebView v, String url) {
                pageReady = true;
                flushAdd();
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
                if (fileCb != null) fileCb.onReceiveValue(null);
                fileCb = cb;
                Intent i = new Intent(Intent.ACTION_GET_CONTENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*");
                try {
                    startActivityForResult(Intent.createChooser(i, "اختار ملف النسخة الاحتياطية"), REQ_FILE);
                } catch (Exception e) {
                    fileCb = null;
                    return false;
                }
                return true;
            }
        });
        setContentView(web);
        if (lockOn()) web.setVisibility(View.INVISIBLE);
        web.loadUrl("file:///android_asset/index.html");
        handleIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIntent(intent);
    }

    private void handleIntent(Intent i) {
        if (i == null || !ACTION_ADD.equals(i.getAction())) return;
        Uri d = i.getData();
        String cat = d != null && d.getLastPathSegment() != null ? d.getLastPathSegment() : "";
        pendingAdd = cat;
        i.setAction(null);
        flushAdd();
    }

    private void flushAdd() {
        if (pendingAdd == null || !pageReady || (lockOn() && !unlocked)) return;
        String js = "window.mizanQuickAdd&&mizanQuickAdd(" + JSONObject.quote(pendingAdd) + ")";
        pendingAdd = null;
        web.evaluateJavascript(js, null);
    }

    private boolean lockOn() { return Prefs.get(this).getBoolean("lock", false); }

    void markUnlocked() { unlocked = true; }

    @Override
    protected void onResume() {
        super.onResume();
        if (lockOn() && !authing && (!unlocked || System.currentTimeMillis() - lastStop > RELOCK_MS)) {
            unlocked = false;
            web.setVisibility(View.INVISIBLE);
            authenticate();
        } else if (!authing) {
            web.setVisibility(View.VISIBLE);
            if (pageReady) web.evaluateJavascript("window.mizanResume&&mizanResume()", null);
            flushAdd();
        }
    }

    @Override
    protected void onStop() {
        super.onStop();
        if (!authing) lastStop = System.currentTimeMillis();
    }

    private void authenticate() {
        authing = true;
        KeyguardManager km = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
        if (km == null || !km.isDeviceSecure()) { onUnlocked(); return; }
        if (Build.VERSION.SDK_INT >= 29) {
            BiometricPrompt.Builder b = new BiometricPrompt.Builder(this)
                    .setTitle("افتح ميزان")
                    .setSubtitle("بالبصمة أو قفل الشاشة");
            if (Build.VERSION.SDK_INT >= 30) {
                b.setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_WEAK
                        | BiometricManager.Authenticators.DEVICE_CREDENTIAL);
            } else {
                b.setDeviceCredentialAllowed(true);
            }
            b.build().authenticate(new CancellationSignal(), getMainExecutor(), new BiometricPrompt.AuthenticationCallback() {
                @Override
                public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult r) { onUnlocked(); }
                @Override
                public void onAuthenticationError(int code, CharSequence msg) { authing = false; finish(); }
            });
        } else {
            Intent i = km.createConfirmDeviceCredentialIntent("افتح ميزان", "استخدم قفل الشاشة");
            if (i == null) { onUnlocked(); return; }
            startActivityForResult(i, REQ_AUTH);
        }
    }

    private void onUnlocked() {
        unlocked = true;
        authing = false;
        lastStop = System.currentTimeMillis();
        web.setVisibility(View.VISIBLE);
        if (pageReady) web.evaluateJavascript("window.mizanResume&&mizanResume()", null);
        flushAdd();
    }

    void askNotifPermission() {
        if (Build.VERSION.SDK_INT >= 33
                && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, REQ_NOTIF);
        }
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        super.onActivityResult(req, res, data);
        if (req == REQ_FILE) {
            Uri[] r = (res == RESULT_OK && data != null && data.getData() != null) ? new Uri[]{data.getData()} : null;
            if (fileCb != null) fileCb.onReceiveValue(r);
            fileCb = null;
        } else if (req == REQ_AUTH) {
            if (res == RESULT_OK) onUnlocked();
            else { authing = false; finish(); }
        }
    }

    @Override
    public void onBackPressed() {
        web.evaluateJavascript("window.mizanBack ? window.mizanBack() : false", handled -> {
            if (!"true".equals(handled)) finish();
        });
    }
}
