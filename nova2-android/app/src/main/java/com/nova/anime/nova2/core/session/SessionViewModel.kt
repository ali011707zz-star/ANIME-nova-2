package com.nova.anime.nova2.core.session

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.nova.anime.nova2.core.config.NovaBuildConfig
import com.nova.anime.nova2.core.model.AuthResponse
import com.nova.anime.nova2.core.model.LinkedDeviceDto
import com.nova.anime.nova2.core.model.ProfileUpdateRequest
import com.nova.anime.nova2.core.model.RemoteConfigResponse
import com.nova.anime.nova2.core.model.UserDto
import com.nova.anime.nova2.core.network.NovaApiClient
import com.nova.anime.nova2.core.network.NovaApiException
import com.nova.anime.nova2.core.storage.TokenStore
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

sealed interface BootstrapStatus {
    data object Loading : BootstrapStatus
    data object Ready : BootstrapStatus
    data object OfficialAppRequired : BootstrapStatus
    data object Maintenance : BootstrapStatus
    data class Error(val message: String) : BootstrapStatus
}

enum class AuthMode {
    LOGIN,
    SIGNUP_EMAIL,
    SIGNUP_VERIFY,
    TV_DEVICE_LINK,
}

data class SessionUiState(
    val status: BootstrapStatus = BootstrapStatus.Loading,
    val config: RemoteConfigResponse? = null,
    val user: UserDto? = null,
    val authMode: AuthMode = AuthMode.LOGIN,
    val authLoading: Boolean = false,
    val generatedLinkCode: String? = null,
    val generatedLinkExpiresAt: String? = null,
    val linkedDevices: List<LinkedDeviceDto> = emptyList(),
    val activeApiUrl: String = NovaBuildConfig.identity.apiUrl,
    val error: String? = null,
    val notice: String? = null,
)

class SessionViewModel(
    private val apiClient: NovaApiClient,
    private val tokenStore: TokenStore,
) : ViewModel() {
    private val _state = MutableStateFlow(SessionUiState())
    val state: StateFlow<SessionUiState> = _state.asStateFlow()

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            _state.update {
                it.copy(
                    status = BootstrapStatus.Loading,
                    error = null,
                    notice = null,
                )
            }
            try {
                val activeUrl = apiClient.initializeRuntimeApiUrl()
                val config = apiClient.fetchRemoteConfig()
                val user = restoreUserOrClearExpiredToken()
                val devices = if (user != null) {
                    runCatching { apiClient.fetchLinkedDevices().devices }.getOrDefault(emptyList())
                } else {
                    emptyList()
                }
                val nextStatus = when {
                    config.officialDownloadRequired -> BootstrapStatus.OfficialAppRequired
                    config.maintenanceMode -> BootstrapStatus.Maintenance
                    else -> BootstrapStatus.Ready
                }
                _state.update {
                    it.copy(
                        status = nextStatus,
                        config = config,
                        user = user,
                        linkedDevices = devices,
                        activeApiUrl = activeUrl,
                        error = null,
                    )
                }
            } catch (error: NovaApiException) {
                if (error is NovaApiException.OfficialAppRequired) {
                    _state.update { it.copy(status = BootstrapStatus.OfficialAppRequired, error = null) }
                } else {
                    _state.update {
                        it.copy(
                            status = BootstrapStatus.Error(error.toArabicMessage()),
                            error = error.toArabicMessage(),
                        )
                    }
                }
            } catch (error: Exception) {
                val message = error.message ?: "تعذر إكمال التهيئة"
                _state.update {
                    it.copy(status = BootstrapStatus.Error(message), error = message)
                }
            }
        }
    }

    fun chooseAuthMode(mode: AuthMode) {
        _state.update { it.copy(authMode = mode, error = null, notice = null) }
    }

    fun signIn(email: String, password: String) {
        val cleanEmail = email.trim().lowercase()
        if (cleanEmail.isBlank() || password.isBlank()) {
            showError("البريد الإلكتروني وكلمة المرور مطلوبان")
            return
        }
        runAuth {
            val response = apiClient.signIn(cleanEmail, password)
            completeAuthentication(response, "تم تسجيل الدخول بنجاح")
        }
    }

    fun sendSignupCode(email: String) {
        val cleanEmail = email.trim().lowercase()
        if (!EMAIL_PATTERN.matches(cleanEmail)) {
            showError("بريد إلكتروني غير صالح")
            return
        }
        runAuth {
            apiClient.sendSignupVerificationCode(cleanEmail)
            _state.update {
                it.copy(
                    authMode = AuthMode.SIGNUP_VERIFY,
                    notice = "تم إرسال رمز التحقق إلى بريدك الإلكتروني",
                    error = null,
                )
            }
        }
    }

    fun signUp(email: String, password: String, displayName: String, verifyCode: String) {
        val cleanEmail = email.trim().lowercase()
        when {
            !EMAIL_PATTERN.matches(cleanEmail) -> showError("بريد إلكتروني غير صالح")
            password.length < 6 -> showError("كلمة المرور يجب أن تكون 6 أحرف على الأقل")
            verifyCode.trim().length < 6 -> showError("أدخل كود التحقق المكوّن من 6 أرقام")
            else -> runAuth {
                val response = apiClient.signUp(cleanEmail, password, displayName, verifyCode)
                completeAuthentication(response, "تم إنشاء الحساب بنجاح")
            }
        }
    }

    /** Claim a 6-digit TV pairing code on Android TV (POST /api/device-link/claim). */
    fun claimTvLinkCode(code: String, deviceName: String = "Android TV") {
        val normalized = normalizeDigits(code)
        if (normalized.length != 6) {
            showError("أدخل الرمز المكوّن من 6 أرقام")
            return
        }
        runAuth {
            val response = apiClient.claimDeviceLinkCode(normalized, deviceName)
            val token = response.authToken?.takeIf { it.isNotBlank() }
                ?: throw NovaApiException.EmptyResponse()
            tokenStore.writeUserToken(token)
            val user = UserDto(
                id = response.id,
                email = response.email,
                displayName = response.displayName,
                username = response.username,
                avatarColor = response.avatarColor,
                profileImageUrl = response.profileImageUrl,
            )
            _state.update {
                it.copy(
                    status = BootstrapStatus.Ready,
                    user = user,
                    authMode = AuthMode.LOGIN,
                    error = null,
                    notice = "تم ربط جهاز التلفاز بالحساب بنجاح",
                )
            }
        }
    }

    /** Generate a 6-digit TV link code from a signed-in phone (POST /api/device-link/request). */
    fun generateTvLinkCode() {
        runAuth {
            val res = apiClient.requestDeviceLinkCode()
            val devices = runCatching { apiClient.fetchLinkedDevices().devices }.getOrDefault(_state.value.linkedDevices)
            _state.update {
                it.copy(
                    generatedLinkCode = res.code,
                    generatedLinkExpiresAt = res.expiresAt,
                    linkedDevices = devices,
                    notice = "أدخل الرمز المكوّن من 6 أرقام في شاشة ربط التلفاز",
                    error = null,
                )
            }
        }
    }

    fun revokeDevice(deviceId: String) {
        runAuth {
            apiClient.revokeLinkedDevice(deviceId)
            val devices = runCatching { apiClient.fetchLinkedDevices().devices }.getOrDefault(emptyList())
            _state.update {
                it.copy(
                    linkedDevices = devices,
                    notice = "تم إلغاء ربط الجهاز بنجاح",
                    error = null,
                )
            }
        }
    }

    fun updateProfile(displayName: String, username: String, avatarColor: Int?) {
        runAuth {
            apiClient.updateProfile(
                ProfileUpdateRequest(
                    displayName = displayName.trim().takeIf { it.isNotEmpty() },
                    username = username.trim().takeIf { it.isNotEmpty() },
                    avatarColor = avatarColor,
                ),
            )
            val refreshed = runCatching { apiClient.fetchCurrentUser() }.getOrNull() ?: _state.value.user
            _state.update {
                it.copy(
                    user = refreshed,
                    notice = "تم حفظ الملف الشخصي بنجاح",
                    error = null,
                )
            }
        }
    }

    fun updateCustomApiUrl(url: String?) {
        viewModelScope.launch {
            val ok = apiClient.probeAndSetCustomApiUrl(url)
            if (ok) {
                _state.update {
                    it.copy(
                        activeApiUrl = NovaBuildConfig.identity.apiUrl,
                        notice = "تم تحديث عنوان الخادم والتحقق من اتصاله",
                        error = null,
                    )
                }
                refresh()
            } else {
                showError("تعذر الاتصال بالعنوان المخصص خلال 4 ثوانٍ؛ تم الإبقاء على الخادم الافتراضي")
            }
        }
    }

    fun signOut() {
        viewModelScope.launch {
            runCatching { apiClient.signOut() }
            tokenStore.writeUserToken(null)
            _state.update {
                it.copy(
                    user = null,
                    authMode = AuthMode.LOGIN,
                    authLoading = false,
                    generatedLinkCode = null,
                    linkedDevices = emptyList(),
                    error = null,
                    notice = "تم تسجيل الخروج",
                )
            }
        }
    }

    private fun runAuth(block: suspend () -> Unit) {
        viewModelScope.launch {
            _state.update { it.copy(authLoading = true, error = null, notice = null) }
            try {
                block()
            } catch (error: NovaApiException) {
                showError(error.toArabicMessage())
            } catch (error: Exception) {
                showError(error.message ?: "تعذر الوصول للخادم")
            } finally {
                _state.update { it.copy(authLoading = false) }
            }
        }
    }

    private suspend fun completeAuthentication(response: AuthResponse, message: String) {
        val token = response.authToken?.takeIf { it.isNotBlank() }
            ?: throw NovaApiException.EmptyResponse()
        tokenStore.writeUserToken(token)
        val user = runCatching { apiClient.fetchCurrentUser() }.getOrElse { response.toUserDto() }
        val devices = runCatching { apiClient.fetchLinkedDevices().devices }.getOrDefault(emptyList())
        _state.update {
            it.copy(
                status = BootstrapStatus.Ready,
                user = user,
                linkedDevices = devices,
                authMode = AuthMode.LOGIN,
                error = null,
                notice = message,
            )
        }
    }

    private suspend fun restoreUserOrClearExpiredToken(): UserDto? {
        if (tokenStore.readUserToken().isNullOrBlank()) return null
        return try {
            apiClient.fetchCurrentUser()
        } catch (error: NovaApiException.Http) {
            if (error.status == 401 || error.status == 403) {
                tokenStore.writeUserToken(null)
                null
            } else {
                throw error
            }
        }
    }

    private fun normalizeDigits(input: String): String =
        input.map { ch ->
            when (ch) {
                in '٠'..'٩' -> ('0'.code + (ch.code - '٠'.code)).toChar()
                in '۰'..'۹' -> ('0'.code + (ch.code - '۰'.code)).toChar()
                else -> ch
            }
        }.filter { it.isDigit() }.take(6).joinToString(separator = "")

    private fun showError(message: String) {
        _state.update { it.copy(error = message, notice = null) }
    }

    private fun NovaApiException.toArabicMessage(): String = when (this) {
        is NovaApiException.Network -> "تعذر الوصول إلى الخادم"
        is NovaApiException.Timeout -> "انتهت مهلة الاتصال بالخادم"
        is NovaApiException.Http -> message ?: "خطأ من الخادم"
        is NovaApiException.Parse -> "تعذر فهم استجابة الخادم"
        is NovaApiException.EmptyResponse -> "استجابة الخادم فارغة"
        is NovaApiException.ServerUnavailable -> "الخادم غير متاح حاليًا"
        is NovaApiException.OfficialAppRequired -> "النسخة الرسمية مطلوبة"
    }

    private fun AuthResponse.toUserDto() = UserDto(
        id = id,
        email = email,
        displayName = displayName,
        username = username,
        avatarColor = avatarColor,
        profileImageUrl = profileImageUrl,
    )

    class Factory(
        private val apiClient: NovaApiClient,
        private val tokenStore: TokenStore,
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            require(modelClass.isAssignableFrom(SessionViewModel::class.java))
            return SessionViewModel(apiClient, tokenStore) as T
        }
    }

    private companion object {
        val EMAIL_PATTERN = Regex("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")
    }
}
