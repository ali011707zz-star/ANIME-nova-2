package com.nova.anime.nova2

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.windowsizeclass.ExperimentalMaterial3WindowSizeClassApi
import androidx.compose.material3.windowsizeclass.calculateWindowSizeClass
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.nova.anime.nova2.core.catalog.AnilistRepository
import com.nova.anime.nova2.core.download.DownloadRepository
import com.nova.anime.nova2.core.library.LibraryStore
import com.nova.anime.nova2.core.network.NovaApiClient
import com.nova.anime.nova2.core.playback.PlaybackRepository
import com.nova.anime.nova2.core.session.AuthMode
import com.nova.anime.nova2.core.session.BootstrapStatus
import com.nova.anime.nova2.core.session.SessionUiState
import com.nova.anime.nova2.core.session.SessionViewModel
import com.nova.anime.nova2.core.storage.EncryptedTokenStore
import com.nova.anime.nova2.ui.LocalNovaThemeState
import com.nova.anime.nova2.ui.LocalNovaWidthClass
import com.nova.anime.nova2.ui.NovaEmbeddedAppScreen
import com.nova.anime.nova2.ui.NovaNavGraph
import com.nova.anime.nova2.ui.NovaTheme
import com.nova.anime.nova2.ui.rememberNovaLayout

class MainActivity : ComponentActivity() {
    private val tokenStore by lazy { EncryptedTokenStore(applicationContext) }
    private val apiClient by lazy { NovaApiClient(tokenStore) }
    private val catalogRepository by lazy { AnilistRepository(apiClient) }
    private val playbackRepository by lazy { PlaybackRepository(apiClient) }
    private val libraryStore by lazy { LibraryStore(applicationContext, apiClient) }
    private val downloadRepository by lazy {
        DownloadRepository(applicationContext, libraryStore, apiClient)
    }
    private val sessionViewModel by viewModels<SessionViewModel> {
        SessionViewModel.Factory(apiClient, tokenStore)
    }

    @OptIn(ExperimentalMaterial3WindowSizeClassApi::class)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val hasBundledWebApp = runCatching {
            assets.list("webapp")?.contains("index.html") == true
        }.getOrDefault(false)

        setContent {
            var isLightTheme by rememberSaveable { mutableStateOf(false) }
            var useBundledFullUi by rememberSaveable { mutableStateOf(hasBundledWebApp) }
            var showTelegramAnnouncement by rememberSaveable { mutableStateOf(true) }

            NovaTheme(
                isLight = isLightTheme,
                onToggleTheme = { isLightTheme = it },
            ) {
                Surface(color = MaterialTheme.colorScheme.background) {
                    val windowSizeClass = calculateWindowSizeClass(this@MainActivity)
                    CompositionLocalProvider(
                        LocalLayoutDirection provides LayoutDirection.Rtl,
                        LocalNovaWidthClass provides windowSizeClass.widthSizeClass,
                    ) {
                        if (useBundledFullUi && hasBundledWebApp) {
                            NovaEmbeddedAppScreen(
                                onSwitchToNativeCompose = { useBundledFullUi = false },
                            )
                        } else {
                            val state by sessionViewModel.state.collectAsStateWithLifecycle()
                            LaunchedEffect(state.user?.id) {
                                libraryStore.bindUserSession(state.user?.id)
                            }
                            NovaNavGraph(
                                repository = catalogRepository,
                                playbackRepository = playbackRepository,
                                libraryStore = libraryStore,
                                downloadRepository = downloadRepository,
                                sessionViewModel = sessionViewModel,
                                onSignOut = sessionViewModel::signOut,
                            ) { onOpenHome ->
                                BootstrapScreen(
                                    state = state,
                                    viewModel = sessionViewModel,
                                    hasBundledWebApp = hasBundledWebApp,
                                    onOpenFullBundledUi = { useBundledFullUi = true },
                                    onOpenHome = onOpenHome,
                                )
                            }

                            if (showTelegramAnnouncement) {
                                TelegramAnnouncementDialog(
                                    onDismiss = { showTelegramAnnouncement = false },
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun TelegramAnnouncementDialog(
    onDismiss: () -> Unit,
) {
    val context = LocalContext.current
    val isLight = LocalNovaThemeState.current.isLight
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = if (isLight) Color(0xFFFFFFFF) else Color(0xFF0B0F19),
        title = {
            Column {
                Text(
                    text = "ANIME NOVA OFFICIAL • V3.5",
                    color = Color(0xFF0EA5E9),
                    fontSize = 11.sp,
                    fontWeight = FontWeight.ExtraBold,
                )
                Text(
                    text = "انضم إلى مجتمعنا الرسمي على تيليجرام",
                    color = if (isLight) Color(0xFF0F172A) else Color.White,
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 18.sp,
                    modifier = Modifier.padding(top = 4.dp),
                )
            }
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    text = "احصل على إشعارات فورية بصدور الحلقات الجديدة، تحديثات التطبيق، وأخبار الأنمي الحصرية أولاً بأول.",
                    color = if (isLight) Color(0xFF475569) else Color(0xFFCBD5E1),
                    style = MaterialTheme.typography.bodyMedium,
                )
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    listOf("تحديثات فورية", "حلقات 1080p", "بدون إعلانات").forEach { tag ->
                        Surface(
                            color = if (isLight) Color(0xFFF1F5F9) else Color(0xFF151C2C),
                            shape = RoundedCornerShape(8.dp),
                            border = BorderStroke(1.dp, if (isLight) Color(0xFFCBD5E1) else Color(0x26FFFFFF)),
                        ) {
                            Text(
                                text = tag,
                                color = if (isLight) Color(0xFF334155) else Color(0xFFE2E8F0),
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            )
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    runCatching {
                        context.startActivity(
                            Intent(Intent.ACTION_VIEW, Uri.parse("https://t.me/ANIME_N0VA")),
                        )
                    }
                    onDismiss()
                },
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0EA5E9)),
            ) {
                Text("الانضمام لقناة تيليجرام", color = Color.White, fontWeight = FontWeight.ExtraBold)
            }
        },
        dismissButton = {
            OutlinedButton(onClick = onDismiss) {
                Text("متابعة للتطبيق", color = if (isLight) Color(0xFF0F172A) else Color.White)
            }
        },
    )
}

@Composable
private fun BootstrapScreen(
    state: SessionUiState,
    viewModel: SessionViewModel,
    hasBundledWebApp: Boolean,
    onOpenFullBundledUi: () -> Unit,
    onOpenHome: () -> Unit,
) {
    val layout = rememberNovaLayout()
    val isLight = LocalNovaThemeState.current.isLight
    val comprehensivePillars = remember {
        listOf(
            "🎬 أنمي مترجم وأفلام" to "بث فوري 1080p FHD",
            "🎙️ مدبلج وسبيستون" to "أرشيف الكرتون والمدبلجات",
            "📖 مانجا ومانهوا" to "قارئ فصول ذكي وملون",
            "⬇️ تنزيل بلا إنترنت" to "إيقاف واستئناف مباشر",
            "☁️ مكتبتك السحابية" to "مزامنة Google فورية",
            "📺 للهاتف والتلفاز" to "دعم كامل لـ Android TV",
        )
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                if (isLight) {
                    Brush.verticalGradient(listOf(Color(0xFFF8FAFC), Color(0xFFEFF6FF), Color(0xFFF8FAFC)))
                } else {
                    Brush.verticalGradient(listOf(Color(0xFF04070F), Color(0xFF0A1120), Color(0xFF090A0C)))
                },
            ),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = if (layout.isTv) 84.dp else 20.dp, vertical = 28.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            // Comprehensive Startup Showcase Card (واجهة البداية الشاملة والأنيقة)
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(28.dp),
                colors = CardDefaults.cardColors(
                    containerColor = if (isLight) Color(0xFFFFFFFF) else Color(0xEE0B101D),
                ),
                border = BorderStroke(1.dp, if (isLight) Color(0xFFCBD5E1) else Color(0x3338BDF8)),
            ) {
                Column(
                    modifier = Modifier.padding(if (layout.isTv) 32.dp else 20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    // Status Header Strip
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(
                            text = "✨ الإصدار السينمائي الشامل · V3.5",
                            color = Color(0xFF0EA5E9),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.ExtraBold,
                        )
                        Text(
                            text = "● خوادم البث متصلة",
                            color = Color(0xFF10B981),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.ExtraBold,
                        )
                    }

                    Spacer(Modifier.height(14.dp))

                    Text(
                        text = "ANIME NOVA",
                        style = MaterialTheme.typography.displayLarge,
                        color = MaterialTheme.colorScheme.primary,
                    )
                    Text(
                        text = "المنصة العربية المتكاملة للأنمي والأفلام والمانجا والمدبلجات",
                        modifier = Modifier.padding(top = 4.dp),
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        textAlign = TextAlign.Center,
                        fontWeight = FontWeight.Bold,
                    )

                    Spacer(Modifier.height(16.dp))

                    // 6 Feature Pillars Grid (2 columns x 3 rows)
                    comprehensivePillars.chunked(2).forEach { pair ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                        ) {
                            pair.forEach { (title, sub) ->
                                Surface(
                                    color = if (isLight) Color(0xFFF8FAFC) else Color(0xFF131B2E),
                                    shape = RoundedCornerShape(14.dp),
                                    border = BorderStroke(1.dp, if (isLight) Color(0xFFE2E8F0) else Color(0x22FFFFFF)),
                                    modifier = Modifier.weight(1f),
                                ) {
                                    Column(modifier = Modifier.padding(10.dp)) {
                                        Text(title, fontWeight = FontWeight.ExtraBold, fontSize = 12.sp)
                                        Text(
                                            text = sub,
                                            fontSize = 10.sp,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        )
                                    }
                                }
                            }
                        }
                    }

                    Spacer(Modifier.height(14.dp))
                    LinearProgressIndicator(
                        progress = { 1f },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(6.dp),
                    )

                    Spacer(Modifier.height(14.dp))

                    if (hasBundledWebApp) {
                        Button(
                            onClick = onOpenFullBundledUi,
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(14.dp),
                        ) {
                            Text("🚀 الدخول إلى واجهة Anime NOVA الشاملة", fontWeight = FontWeight.ExtraBold)
                        }
                        Spacer(Modifier.height(8.dp))
                    }

                    when (val status = state.status) {
                        BootstrapStatus.Loading -> CircularProgressIndicator()
                        BootstrapStatus.OfficialAppRequired -> StatusText("النسخة الرسمية مطلوبة — حمّل التطبيق الرسمي من موقع Anime NOVA")
                        BootstrapStatus.Maintenance -> StatusText(
                            state.config?.maintenanceMessage ?: "التطبيق تحت الصيانة. يرجى المحاولة لاحقًا.",
                        )
                        is BootstrapStatus.Error -> {
                            StatusText(status.message)
                            Button(
                                onClick = viewModel::refresh,
                                modifier = Modifier.padding(top = 12.dp),
                            ) {
                                Text("إعادة المحاولة")
                            }
                        }
                        BootstrapStatus.Ready -> ReadyContent(state, viewModel, onOpenHome)
                    }
                }
            }
        }
    }
}

@Composable
private fun ReadyContent(
    state: SessionUiState,
    viewModel: SessionViewModel,
    onOpenHome: () -> Unit,
) {
    Text(
        text = state.user?.let { "مرحبًا ${it.displayName ?: it.email ?: "بك"}" }
            ?: "متصل بحساب Google السحابي أو وضع الزائر",
        modifier = Modifier.padding(top = 10.dp),
        textAlign = TextAlign.Center,
        fontWeight = FontWeight.Bold,
    )
    state.notice?.let {
        Text(
            text = it,
            modifier = Modifier.padding(top = 8.dp),
            color = MaterialTheme.colorScheme.secondary,
            textAlign = TextAlign.Center,
        )
    }
    state.error?.let {
        Text(
            text = it,
            modifier = Modifier.padding(top = 8.dp),
            color = MaterialTheme.colorScheme.error,
            textAlign = TextAlign.Center,
        )
    }
    if (state.user == null) {
        AuthPanel(state, viewModel)
    } else {
        Button(
            onClick = viewModel::signOut,
            modifier = Modifier.padding(top = 12.dp),
        ) {
            Text("تسجيل الخروج")
        }
    }
    Button(
        onClick = onOpenHome,
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 12.dp),
        shape = RoundedCornerShape(14.dp),
    ) {
        Text("الدخول إلى Anime NOVA الآن", fontWeight = FontWeight.ExtraBold)
    }
}

@Composable
private fun AuthPanel(state: SessionUiState, viewModel: SessionViewModel) {
    var tvLinkCode by rememberSaveable { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(top = 12.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        when (state.authMode) {
            AuthMode.LOGIN, AuthMode.SIGNUP_EMAIL, AuthMode.SIGNUP_VERIFY -> {
                // Google Account One-Tap Selection (بدون خانة إدخال البريد اليدوي)
                Surface(
                    color = MaterialTheme.colorScheme.surfaceVariant,
                    shape = RoundedCornerShape(16.dp),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Column(
                        modifier = Modifier.padding(14.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        Text(
                            text = "تسجيل الدخول السريع باستخدام Google",
                            fontWeight = FontWeight.ExtraBold,
                            style = MaterialTheme.typography.titleMedium,
                        )
                        Text(
                            text = "• Ali Anime NOVA (ali0117078153@gmail.com) — متصل ومُزامَن",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.primary,
                            fontWeight = FontWeight.Bold,
                        )
                        OutlinedButton(
                            onClick = { viewModel.chooseAuthMode(AuthMode.TV_DEVICE_LINK) },
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Text("📺 ربط التلفاز الذكي (رمز 6 أرقام)")
                        }
                    }
                }
            }
            AuthMode.TV_DEVICE_LINK -> {
                Text("ربط شاشة Android TV بالهاتف", style = MaterialTheme.typography.titleLarge)
                Text(
                    "افتح الإعدادات من هاتفك المسجل واختر (ربط التلفاز) للحصول على رمز من 6 أرقام",
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(top = 6.dp),
                )
                OutlinedTextField(
                    value = tvLinkCode,
                    onValueChange = { tvLinkCode = it },
                    label = { Text("رمز الربط المكوّن من 6 أرقام") },
                    singleLine = true,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 8.dp),
                )
                Button(
                    onClick = { viewModel.claimTvLinkCode(tvLinkCode) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 10.dp),
                ) {
                    Text("ربط التلفاز الآن")
                }
                OutlinedButton(
                    onClick = { viewModel.chooseAuthMode(AuthMode.LOGIN) },
                    modifier = Modifier.padding(top = 6.dp),
                ) {
                    Text("العودة لحساب Google")
                }
            }
        }
    }
}

@Composable
private fun StatusText(message: String) {
    Text(
        text = message,
        modifier = Modifier.padding(top = 18.dp),
        textAlign = TextAlign.Center,
        color = MaterialTheme.colorScheme.error,
    )
}
