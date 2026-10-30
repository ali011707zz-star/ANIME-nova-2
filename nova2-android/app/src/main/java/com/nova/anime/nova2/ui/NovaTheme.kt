package com.nova.anime.nova2.ui

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

data class NovaThemeState(
    val isLight: Boolean = false,
    val onToggleTheme: (Boolean) -> Unit = {},
)

val LocalNovaThemeState = staticCompositionLocalOf { NovaThemeState() }

private val NovaDarkColors = darkColorScheme(
    primary = Color(0xFF0EA5E9),
    onPrimary = Color.White,
    secondary = Color(0xFF10B981),
    onSecondary = Color.White,
    background = Color(0xFF090A0C),
    onBackground = Color(0xFFF3F4F6),
    surface = Color(0xFF111318),
    onSurface = Color(0xFFF3F4F6),
    surfaceVariant = Color(0xFF1B1F27),
    onSurfaceVariant = Color(0xFF9CA3AF),
    outline = Color(0x26FFFFFF),
    error = Color(0xFFEF4444),
)

private val NovaLightColors = lightColorScheme(
    primary = Color(0xFF0284C7),
    onPrimary = Color.White,
    secondary = Color(0xFF059669),
    onSecondary = Color.White,
    background = Color(0xFFF8FAFC),
    onBackground = Color(0xFF0F172A),
    surface = Color(0xFFFFFFFF),
    onSurface = Color(0xFF0F172A),
    surfaceVariant = Color(0xFFF1F5F9),
    onSurfaceVariant = Color(0xFF475569),
    outline = Color(0xFFCBD5E1),
    error = Color(0xFFDC2626),
)

@Composable
fun NovaTheme(
    isLight: Boolean = false,
    onToggleTheme: (Boolean) -> Unit = {},
    content: @Composable () -> Unit,
) {
    val scheme = if (isLight) NovaLightColors else NovaDarkColors
    CompositionLocalProvider(
        LocalNovaThemeState provides NovaThemeState(isLight = isLight, onToggleTheme = onToggleTheme),
    ) {
        MaterialTheme(
            colorScheme = scheme,
            typography = androidx.compose.material3.Typography(
                displayLarge = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.ExtraBold, fontSize = 34.sp, lineHeight = 42.sp),
                headlineLarge = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.ExtraBold, fontSize = 28.sp, lineHeight = 36.sp),
                headlineMedium = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Bold, fontSize = 24.sp, lineHeight = 32.sp),
                titleLarge = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.Bold, fontSize = 20.sp, lineHeight = 28.sp),
                titleMedium = TextStyle(fontFamily = FontFamily.SansSerif, fontWeight = FontWeight.SemiBold, fontSize = 16.sp, lineHeight = 23.sp),
                bodyLarge = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 16.sp, lineHeight = 25.sp),
                bodyMedium = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 14.sp, lineHeight = 21.sp),
                bodySmall = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 12.sp, lineHeight = 18.sp),
                labelSmall = TextStyle(fontFamily = FontFamily.SansSerif, fontSize = 10.sp, lineHeight = 14.sp),
            ),
            content = content,
        )
    }
}