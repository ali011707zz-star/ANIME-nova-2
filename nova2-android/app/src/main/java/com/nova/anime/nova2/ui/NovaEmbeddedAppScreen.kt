package com.nova.anime.nova2.ui

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.content.pm.ActivityInfo
import android.net.Uri
import android.view.View
import android.view.ViewGroup
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

/**
 * Hosts the complete bundled Anime NOVA v3.5 UI from `assets/webapp/index.html` using
 * [WebViewAssetLoader] (`https://appassets.androidplatform.net/assets/webapp/index.html`)
 * so 100% of all screens, RiftPlayer, Manga Reader, Downloads, Themes, Profile, and Telegram
 * Support run natively inside the Android APK offline & online with hardware Back and Fullscreen support.
 */
@SuppressLint("SetJavaScriptEnabled")
@Composable
fun NovaEmbeddedAppScreen(
    onSwitchToNativeCompose: () -> Unit = {},
) {
    val context = LocalContext.current
    val activity = context as? Activity
    var webViewRef by remember { mutableStateOf<WebView?>(null) }
    var canGoBack by remember { mutableStateOf(false) }

    val assetLoader = remember(context) {
        WebViewAssetLoader.Builder()
            .setDomain("appassets.androidplatform.net")
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(context))
            .build()
    }

    BackHandler(enabled = canGoBack) {
        val wv = webViewRef
        if (wv != null && wv.canGoBack()) {
            wv.goBack()
        }
    }

    AndroidView(
        modifier = Modifier.fillMaxSize(),
        factory = { ctx ->
            val rootFrame = FrameLayout(ctx).apply {
                layoutParams = ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT,
                )
            }

            val webView = WebView(ctx).apply {
                layoutParams = FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT,
                )
                settings.apply {
                    javaScriptEnabled = true
                    domStorageEnabled = true
                    databaseEnabled = true
                    mediaPlaybackRequiresUserGesture = false
                    allowFileAccess = true
                    allowContentAccess = true
                    loadWithOverviewMode = true
                    useWideViewPort = true
                    cacheMode = WebSettings.LOAD_DEFAULT
                    mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
                }

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
                        return assetLoader.shouldInterceptRequest(url) ?: super.shouldInterceptRequest(view, request)
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

                    override fun doUpdateVisitedHistory(view: WebView?, url: String?, isReload: Boolean) {
                        super.doUpdateVisitedHistory(view, url, isReload)
                        canGoBack = view?.canGoBack() == true
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
