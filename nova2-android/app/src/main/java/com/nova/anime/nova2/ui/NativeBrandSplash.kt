package com.nova.anime.nova2.ui

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
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
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private data class SplashFeature(
    val title: String,
    val subtitle: String,
    val color: Color,
)

private val splashFeatures = listOf(
    SplashFeature("أنمي مترجم وأفلام", "بث فوري حتى 1080p", Color(0xFF38BDF8)),
    SplashFeature("مدبلج وسبيستون", "أرشيف الكرتون والمدبلجات", Color(0xFF10B981)),
    SplashFeature("مانجا ومانهوا", "قراءة الفصول", Color(0xFFF59E0B)),
    SplashFeature("تنزيل بلا إنترنت", "إدارة ملفات التنزيل", Color(0xFFA78BFA)),
    SplashFeature("مكتبتك", "المفضلة وسجل المشاهدة", Color(0xFFF43F5E)),
    SplashFeature("للهاتف والتلفاز", "دعم Android TV", Color(0xFF06B6D4)),
)

@Composable
fun NativeBrandSplash() {
    val progress by animateFloatAsState(
        targetValue = 1f,
        animationSpec = tween(durationMillis = 1_600),
        label = "native-splash-progress",
    )
    val status = when {
        progress < .35f -> "جاري الاتصال بخدمات Anime NOVA..."
        progress < .88f -> "جاري تجهيز الأنمي والأفلام والمانجا..."
        else -> "اكتملت التهيئة · جاهز للمشاهدة"
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.radialGradient(
                    colors = listOf(Color(0xFF10233A), Color(0xFF080D17), Color(0xFF04060B)),
                    radius = 1_500f,
                ),
            )
            .padding(horizontal = 14.dp, vertical = 18.dp),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .widthIn(max = 620.dp)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Surface(
                shape = CircleShape,
                color = Color(0xFF0EA5E9).copy(alpha = .14f),
                border = androidx.compose.foundation.BorderStroke(
                    1.dp,
                    Color(0xFF38BDF8).copy(alpha = .42f),
                ),
            ) {
                Text(
                    "N",
                    color = Color(0xFF7DD3FC),
                    fontSize = 25.sp,
                    fontWeight = FontWeight.Black,
                    modifier = Modifier.padding(horizontal = 18.dp, vertical = 10.dp),
                )
            }
            Text(
                text = "ANIME NOVA",
                modifier = Modifier.padding(top = 10.dp),
                color = Color.White,
                fontSize = 27.sp,
                fontWeight = FontWeight.Black,
                letterSpacing = 1.4.sp,
            )
            Text(
                text = "منصة الأنمي العربية",
                color = Color(0xFFB8C6D9),
                fontSize = 13.sp,
                modifier = Modifier.padding(top = 2.dp, bottom = 16.dp),
            )

            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(24.dp),
                color = Color(0xF20D1523),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0x6638BDF8)),
                shadowElevation = 16.dp,
            ) {
                Column(
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 18.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Text(
                        text = "كل ما تحب، في مكان واحد",
                        modifier = Modifier.fillMaxWidth(),
                        textAlign = TextAlign.Center,
                        color = Color.White,
                        fontSize = 17.sp,
                        fontWeight = FontWeight.ExtraBold,
                    )
                    splashFeatures.chunked(2).forEach { rowFeatures ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(9.dp),
                        ) {
                            rowFeatures.forEach { feature ->
                                Surface(
                                    modifier = Modifier.weight(1f),
                                    shape = RoundedCornerShape(14.dp),
                                    color = Color.White.copy(alpha = .045f),
                                    border = androidx.compose.foundation.BorderStroke(
                                        1.dp,
                                        feature.color.copy(alpha = .32f),
                                    ),
                                ) {
                                    Column(
                                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 9.dp),
                                        verticalArrangement = Arrangement.spacedBy(3.dp),
                                    ) {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Surface(
                                                modifier = Modifier.width(7.dp).height(7.dp),
                                                shape = CircleShape,
                                                color = feature.color,
                                            ) {}
                                            Spacer(Modifier.width(6.dp))
                                            Text(
                                                feature.title,
                                                color = Color.White,
                                                fontSize = 11.sp,
                                                fontWeight = FontWeight.Bold,
                                                maxLines = 1,
                                            )
                                        }
                                        Text(
                                            feature.subtitle,
                                            color = Color(0xFF9FB0C5),
                                            fontSize = 9.sp,
                                            lineHeight = 13.sp,
                                            maxLines = 1,
                                        )
                                    }
                                }
                            }
                            if (rowFeatures.size == 1) {
                                Spacer(Modifier.weight(1f))
                            }
                        }
                    }
                    Spacer(Modifier.height(2.dp))
                    LinearProgressIndicator(
                        progress = { progress },
                        modifier = Modifier.fillMaxWidth().height(5.dp),
                        color = Color(0xFF38BDF8),
                        trackColor = Color.White.copy(alpha = .12f),
                    )
                    Text(
                        text = status,
                        modifier = Modifier.fillMaxWidth(),
                        color = Color(0xFFBFDBFE),
                        fontSize = 11.sp,
                        textAlign = TextAlign.Center,
                    )
                }
            }
            Text(
                text = "Anime NOVA · للهواتف وأجهزة Android TV",
                color = Color(0xFF718096),
                fontSize = 10.sp,
                modifier = Modifier.padding(top = 14.dp),
            )
        }
    }
}
