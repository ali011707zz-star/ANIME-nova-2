package com.nova.anime.nova2

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
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
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
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
import com.nova.anime.nova2.ui.LocalNovaWidthClass
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
        setContent {
            NovaTheme {
                Surface(color = MaterialTheme.colorScheme.background) {
                    val windowSizeClass = calculateWindowSizeClass(this@MainActivity)
                    CompositionLocalProvider(
                        LocalLayoutDirection provides LayoutDirection.Rtl,
                        LocalNovaWidthClass provides windowSizeClass.widthSizeClass,
                    ) {
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
                            BootstrapScreen(state, sessionViewModel, onOpenHome)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun BootstrapScreen(
    state: SessionUiState,
    viewModel: SessionViewModel,
    onOpenHome: () -> Unit,
) {
    val layout = rememberNovaLayout()
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(Color(0xFF05030D), Color(0xFF11051F), Color(0xFF09090B)),
                ),
            ),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = if (layout.isTv) 96.dp else 24.dp, vertical = 36.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            Text(
                text = "Anime NOVA",
                style = MaterialTheme.typography.displayLarge,
                color = MaterialTheme.colorScheme.primary,
            )
            Text(
                text = "منصة الأنمي العربية",
                modifier = Modifier.padding(top = 4.dp),
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
            )

            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 28.dp),
                shape = RoundedCornerShape(22.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xCC111116)),
            ) {
                Column(
                    modifier = Modifier.padding(if (layout.isTv) 36.dp else 20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
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
                                modifier = Modifier.padding(top = 16.dp),
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
            ?: "وضع الزائر (يمكنك التصفح أو تسجيل الدخول)",
        modifier = Modifier.padding(top = 16.dp),
        textAlign = TextAlign.Center,
    )
    state.notice?.let {
        Text(
            text = it,
            modifier = Modifier.padding(top = 12.dp),
            color = MaterialTheme.colorScheme.secondary,
            textAlign = TextAlign.Center,
        )
    }
    state.error?.let {
        Text(
            text = it,
            modifier = Modifier.padding(top = 12.dp),
            color = MaterialTheme.colorScheme.error,
            textAlign = TextAlign.Center,
        )
    }
    if (state.user == null) {
        AuthPanel(state, viewModel)
    } else {
        Button(
            onClick = viewModel::signOut,
            modifier = Modifier.padding(top = 18.dp),
        ) {
            Text("تسجيل الخروج")
        }
    }
    Button(
        onClick = onOpenHome,
        modifier = Modifier.padding(top = 12.dp),
    ) {
        Text("الدخول إلى الصفحة الرئيسية")
    }
    OutlinedButton(
        onClick = viewModel::refresh,
        modifier = Modifier.padding(top = 8.dp),
    ) {
        Text("تحديث إعدادات الخادم")
    }
}

@Composable
private fun AuthPanel(state: SessionUiState, viewModel: SessionViewModel) {
    var email by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }
    var displayName by rememberSaveable { mutableStateOf("") }
    var verifyCode by rememberSaveable { mutableStateOf("") }
    var tvLinkCode by rememberSaveable { mutableStateOf("") }

    Column(
        modifier = Modifier.padding(top = 18.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        when (state.authMode) {
            AuthMode.LOGIN -> {
                Text("تسجيل الدخول", style = MaterialTheme.typography.titleLarge)
                NovaField(email, "البريد الإلكتروني") { email = it }
                NovaField(password, "كلمة المرور", true) { password = it }
                AuthButton(state.authLoading, "دخول") {
                    viewModel.signIn(email, password)
                }
                Row(
                    modifier = Modifier.padding(top = 8.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    OutlinedButton(onClick = { viewModel.chooseAuthMode(AuthMode.SIGNUP_EMAIL) }) {
                        Text("إنشاء حساب")
                    }
                    OutlinedButton(onClick = { viewModel.chooseAuthMode(AuthMode.TV_DEVICE_LINK) }) {
                        Text("ربط التلفاز (6 أرقام)")
                    }
                }
            }
            AuthMode.SIGNUP_EMAIL -> {
                Text("إنشاء حساب", style = MaterialTheme.typography.titleLarge)
                NovaField(displayName, "الاسم الظاهر") { displayName = it }
                NovaField(email, "البريد الإلكتروني") { email = it }
                NovaField(password, "كلمة المرور", true) { password = it }
                AuthButton(state.authLoading, "إرسال رمز التحقق") {
                    viewModel.sendSignupCode(email)
                }
                OutlinedButton(
                    onClick = { viewModel.chooseAuthMode(AuthMode.LOGIN) },
                    modifier = Modifier.padding(top = 8.dp),
                ) {
                    Text("لدي حساب بالفعل")
                }
            }
            AuthMode.SIGNUP_VERIFY -> {
                Text("تأكيد البريد الإلكتروني", style = MaterialTheme.typography.titleLarge)
                NovaField(verifyCode, "رمز التحقق (6 أرقام)") { verifyCode = it }
                AuthButton(state.authLoading, "إنشاء الحساب") {
                    viewModel.signUp(email, password, displayName, verifyCode)
                }
                OutlinedButton(
                    onClick = { viewModel.chooseAuthMode(AuthMode.SIGNUP_EMAIL) },
                    modifier = Modifier.padding(top = 8.dp),
                ) {
                    Text("تعديل البيانات")
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
                NovaField(tvLinkCode, "رمز الربط المكوّن من 6 أرقام") { tvLinkCode = it }
                AuthButton(state.authLoading, "ربط التلفاز الآن") {
                    viewModel.claimTvLinkCode(tvLinkCode)
                }
                OutlinedButton(
                    onClick = { viewModel.chooseAuthMode(AuthMode.LOGIN) },
                    modifier = Modifier.padding(top = 8.dp),
                ) {
                    Text("العودة لتسجيل الدخول بالبريد")
                }
            }
        }
    }
}

@Composable
private fun NovaField(
    value: String,
    label: String,
    password: Boolean = false,
    onValueChange: (String) -> Unit,
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        singleLine = true,
        visualTransformation = if (password) {
            PasswordVisualTransformation()
        } else {
            VisualTransformation.None
        },
        modifier = Modifier.padding(top = 8.dp),
    )
}

@Composable
private fun AuthButton(loading: Boolean, label: String, onClick: () -> Unit) {
    if (loading) {
        CircularProgressIndicator(Modifier.padding(16.dp))
    } else {
        Button(onClick = onClick, modifier = Modifier.padding(top = 14.dp)) {
            Text(label)
        }
    }
}

@Composable
private fun StatusText(message: String) {
    Text(
        text = message,
        modifier = Modifier.padding(top = 24.dp),
        textAlign = TextAlign.Center,
        color = MaterialTheme.colorScheme.error,
    )
}
