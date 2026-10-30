package com.nova.anime.nova2.ui

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.ActivityInfo
import android.graphics.Color
import android.view.KeyEvent
import android.view.View
import android.view.ViewGroup
import android.view.inputmethod.InputMethodManager
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import androidx.webkit.WebViewAssetLoader

private class NovaAndroidJsBridge(
    private val activity: Activity?,
    private val webViewProvider: () -> WebView?,
) {
    @JavascriptInterface
    fun showKeyboard() {
        val wv = webViewProvider() ?: return
        wv.post {
            wv.requestFocus()
            val imm = wv.context.getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager
            imm?.showSoftInput(wv, InputMethodManager.SHOW_IMPLICIT)
        }
    }

    @JavascriptInterface
    fun exitApp() {
        activity?.runOnUiThread {
            activity.finish()
        }
    }
}

private fun resolveWebAppAsset(context: Context, rawPath: String): WebResourceResponse? {
    val clean = rawPath.trimStart('/').ifEmpty { "webapp/index.html" }
    val candidates = listOf(
        if (clean.startsWith("assets/webapp/")) clean.removePrefix("assets/") else "webapp/$clean",
        if (clean.startsWith("webapp/")) clean else "webapp/${clean.removePrefix("assets/")}",
        clean.removePrefix("assets/"),
    ).distinct()

    for (candidate in candidates) {
        val stream = runCatching { context.assets.open(candidate) }.getOrNull() ?: continue
        val ext = candidate.substringAfterLast('.', "").lowercase()
        val mimeType = when (ext) {
            "html", "htm" -> "text/html"
            "js", "mjs" -> "text/javascript"
            "css" -> "text/css"
            "json", "map" -> "application/json"
            "svg" -> "image/svg+xml"
            "png" -> "image/png"
            "jpg", "jpeg" -> "image/jpeg"
            "webp" -> "image/webp"
            "gif" -> "image/gif"
            "ico" -> "image/x-icon"
            "woff" -> "font/woff"
            "woff2" -> "font/woff2"
            "ttf" -> "font/ttf"
            "mp4" -> "video/mp4"
            "webm" -> "video/webm"
            else -> "application/octet-stream"
        }
        return WebResourceResponse(
            mimeType,
            "UTF-8",
            200,
            "OK",
            mapOf(
                "Access-Control-Allow-Origin" to "*",
                "Access-Control-Allow-Methods" to "GET, HEAD, OPTIONS",
                "Cache-Control" to "no-cache",
            ),
            stream,
        )
    }
    return null
}

/**
 * Hosts the complete bundled Anime NOVA v3.5 UI from `assets/webapp/index.html` using
 * [WebViewAssetLoader] (`https://appassets.androidplatform.net/assets/webapp/index.html`)
 * so 100% of all screens, RiftPlayer, Manga Reader, Downloads, Themes, Profile, and Telegram
 * Support run natively inside the Android APK offline & online with hardware Back, D-Pad TV remote,
 * and Fullscreen support.
 */
@SuppressLint("SetJavaScriptEnabled")
@Composable
fun NovaEmbeddedAppScreen(
    onSwitchToNativeCompose: () -> Unit = {},
) {
    val context = LocalContext.current
    val activity = context as? Activity
    var webViewRef by remember { mutableStateOf<WebView?>(null) }

    val assetLoader = remember(context) {
        WebViewAssetLoader.Builder()
            .setDomain("appassets.androidplatform.net")
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(context))
            .build()
    }

    BackHandler(enabled = true) {
        val wv = webViewRef
        if (wv == null) {
            activity?.finish()
            return@BackHandler
        }
        wv.evaluateJavascript(
            "(typeof window.__novaHandleBackPress === 'function' ? Boolean(window.__novaHandleBackPress()) : false)",
        ) { result ->
            if (result != "true") {
                if (wv.canGoBack()) {
                    wv.goBack()
                } else {
                    activity?.finish()
                }
            }
        }
    }

    AndroidView(
        modifier = Modifier.fillMaxSize(),
        factory = { ctx ->
            val darkBg = Color.parseColor("#090A0C")
            val rootFrame = FrameLayout(ctx).apply {
                layoutParams = ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT,
                )
                setBackgroundColor(darkBg)
            }

            val webView = object : WebView(ctx) {
                override fun dispatchKeyEvent(event: KeyEvent): Boolean {
                    val mappedKey = when (event.keyCode) {
                        KeyEvent.KEYCODE_DPAD_UP -> "ArrowUp"
                        KeyEvent.KEYCODE_DPAD_DOWN -> "ArrowDown"
                        KeyEvent.KEYCODE_DPAD_LEFT -> "ArrowLeft"
                        KeyEvent.KEYCODE_DPAD_RIGHT -> "ArrowRight"
                        KeyEvent.KEYCODE_DPAD_CENTER,
                        KeyEvent.KEYCODE_ENTER,
                        KeyEvent.KEYCODE_NUMPAD_ENTER,
                        -> "Enter"
                        KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE,
                        KeyEvent.KEYCODE_MEDIA_PLAY,
                        KeyEvent.KEYCODE_MEDIA_PAUSE,
                        -> " "
                        KeyEvent.KEYCODE_MEDIA_FAST_FORWARD -> "ArrowRight"
                        KeyEvent.KEYCODE_MEDIA_REWIND -> "ArrowLeft"
                        else -> null
                    }
                    if (mappedKey != null) {
                        if (event.action == KeyEvent.ACTION_DOWN) {
                            evaluateJavascript(
                                "window.__novaDispatchTvKey && window.__novaDispatchTvKey('$mappedKey');",
                                null,
                            )
                        }
                        return true
                    }
                    return super.dispatchKeyEvent(event)
                }
            }.apply {
                layoutParams = FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT,
                )
                setBackgroundColor(darkBg)
                isFocusable = true
                isFocusableInTouchMode = true
                requestFocus()
                @Suppress("DEPRECATION")
                settings.apply {
                    javaScriptEnabled = true
                    domStorageEnabled = true
                    databaseEnabled = true
                    mediaPlaybackRequiresUserGesture = false
                    allowFileAccess = true
                    allowContentAccess = true
                    allowFileAccessFromFileURLs = true
                    allowUniversalAccessFromFileURLs = true
                    loadWithOverviewMode = true
                    useWideViewPort = true
                    cacheMode = WebSettings.LOAD_DEFAULT
                    mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                }

                addJavascriptInterface(
                    NovaAndroidJsBridge(activity) { webViewRef },
                    "NovaAndroid",
                )

                var customView: View? = null
                var customViewCallback: WebChromeClient.CustomViewCallback? = null

                webChromeClient = object : WebChromeClient() {
                    override fun onShowCustomView(view: View?, callback: CustomViewCallback?) {
                        if (customView != null) {
                            callback?.onCustomViewHidden()
                            return
                        }
                        customView = view
                        customViewCallback = callback
                        if (view != null) {
                            rootFrame.addView(
                                view,
                                FrameLayout.LayoutParams(
                                    ViewGroup.LayoutParams.MATCH_PARENT,
                                    ViewGroup.LayoutParams.MATCH_PARENT,
                                ),
                            )
                            this@apply.visibility = View.GONE
                            activity?.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE
                        }
                    }

                    override fun onHideCustomView() {
                        val view = customView ?: return
                        rootFrame.removeView(view)
                        customView = null
                        customViewCallback?.onCustomViewHidden()
                        customViewCallback = null
                        this@apply.visibility = View.VISIBLE
                        activity?.requestedOrientation = ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED
                    }
                }

                webViewClient = object : WebViewClient() {
                    override fun shouldInterceptRequest(
                        view: WebView?,
                        request: WebResourceRequest?,
                    ): WebResourceResponse? {
                        val url = request?.url ?: return null
                        if (url.host == "appassets.androidplatform.net") {
                            resolveWebAppAsset(ctx, url.path.orEmpty())?.let { return it }
                            assetLoader.shouldInterceptRequest(url)?.let { return it }
                        }
                        return super.shouldInterceptRequest(view, request)
                    }

                    override fun shouldOverrideUrlLoading(
                        view: WebView?,
                        request: WebResourceRequest?,
                    ): Boolean {
                        val uri = request?.url ?: return false
                        val host = uri.host.orEmpty()
                        if (host.contains("t.me") || host.contains("telegram.me")) {
                            runCatching {
                                ctx.startActivity(Intent(Intent.ACTION_VIEW, uri))
                            }
                            return true
                        }
                        return false
                    }
                }

                loadUrl("https://appassets.androidplatform.net/assets/webapp/index.html")
            }

            webViewRef = webView
            rootFrame.addView(webView)
            rootFrame
        },
    )
}
