package com.nova.anime.nova2.core.storage

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import java.util.UUID

interface TokenStore {
    fun readAnonymousToken(): StoredToken?
    fun writeAnonymousToken(token: StoredToken)
    fun clearAnonymousToken()
    fun readDownloadToken(): StoredToken?
    fun writeDownloadToken(token: StoredToken)
    fun clearDownloadToken()
    fun readUserToken(): String?
    fun writeUserToken(token: String?)
    fun readOrCreateDeviceId(): String
    fun readCustomApiUrl(): String?
    fun writeCustomApiUrl(url: String?)
}

data class StoredToken(
    val value: String,
    val expiresAtEpochSeconds: Long,
)

class EncryptedTokenStore(context: Context) : TokenStore {
    private val preferences = EncryptedSharedPreferences.create(
        context,
        "nova2_secure_tokens",
        MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build(),
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
    )

    override fun readAnonymousToken(): StoredToken? {
        val value = preferences.getString(ANON_TOKEN, null) ?: return null
        val expiry = preferences.getLong(ANON_EXPIRY, 0L)
        if (expiry <= 0L) return null
        return StoredToken(value, expiry)
    }

    override fun writeAnonymousToken(token: StoredToken) {
        preferences.edit()
            .putString(ANON_TOKEN, token.value)
            .putLong(ANON_EXPIRY, token.expiresAtEpochSeconds)
            .apply()
    }

    override fun clearAnonymousToken() {
        preferences.edit().remove(ANON_TOKEN).remove(ANON_EXPIRY).apply()
    }

    override fun readDownloadToken(): StoredToken? {
        val value = preferences.getString(DOWNLOAD_TOKEN, null) ?: return null
        val expiry = preferences.getLong(DOWNLOAD_EXPIRY, 0L)
        if (expiry <= 0L) return null
        return StoredToken(value, expiry)
    }

    override fun writeDownloadToken(token: StoredToken) {
        preferences.edit()
            .putString(DOWNLOAD_TOKEN, token.value)
            .putLong(DOWNLOAD_EXPIRY, token.expiresAtEpochSeconds)
            .apply()
    }

    override fun clearDownloadToken() {
        preferences.edit().remove(DOWNLOAD_TOKEN).remove(DOWNLOAD_EXPIRY).apply()
    }

    override fun readUserToken(): String? = preferences.getString(USER_TOKEN, null)

    override fun writeUserToken(token: String?) {
        preferences.edit().apply {
            if (token.isNullOrBlank()) remove(USER_TOKEN) else putString(USER_TOKEN, token)
        }.apply()
    }

    override fun readOrCreateDeviceId(): String {
        val existing = preferences.getString(DEVICE_ID, null)
        if (!existing.isNullOrBlank() && DEVICE_ID_REGEX.matches(existing)) {
            return existing
        }
        val generated = "nova-android-${UUID.randomUUID()}"
        preferences.edit().putString(DEVICE_ID, generated).apply()
        return generated
    }

    override fun readCustomApiUrl(): String? =
        preferences.getString(CUSTOM_API_URL, null)?.takeIf { it.startsWith("http") }

    override fun writeCustomApiUrl(url: String?) {
        preferences.edit().apply {
            val cleaned = url?.trim()?.trimEnd('/')
            if (cleaned.isNullOrBlank()) remove(CUSTOM_API_URL) else putString(CUSTOM_API_URL, cleaned)
        }.apply()
    }

    private companion object {
        const val ANON_TOKEN = "anonymous_token"
        const val ANON_EXPIRY = "anonymous_token_expiry"
        const val DOWNLOAD_TOKEN = "download_token"
        const val DOWNLOAD_EXPIRY = "download_token_expiry"
        const val USER_TOKEN = "user_token"
        const val DEVICE_ID = "nova_device_id"
        const val CUSTOM_API_URL = "nova_custom_api_url"
        val DEVICE_ID_REGEX = Regex("^[A-Za-z0-9._:-]{6,160}$")
    }
}
