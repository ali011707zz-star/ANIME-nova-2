package com.nova.anime.nova2.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.nova.anime.nova2.core.catalog.MangaCard

private val referenceReaderArtwork = listOf(
    "https://s4.anilist.co/file/anilistcdn/media/anime/banner/151807-37yfQA3ym8PA.jpg",
    "https://s4.anilist.co/file/anilistcdn/media/anime/banner/113415-jQBSkxWAAk83.jpg",
    "https://s4.anilist.co/file/anilistcdn/media/anime/banner/154587-ivXNJ23SM1xB.jpg",
    "https://s4.anilist.co/file/anilistcdn/media/anime/banner/21087-sHb9zUZFsHe1.jpg",
    "https://s4.anilist.co/file/anilistcdn/media/anime/banner/101922-YfZhKBUDDS6L.jpg",
)

@Composable
fun MangaChapterReader(
    manga: MangaCard,
    initialChapter: Int,
    onBack: () -> Unit,
    onSelectChapter: (Int) -> Unit,
) {
    val chapterCount = manga.referenceChapterCount()
    val chapter = initialChapter.coerceIn(1, chapterCount)
    var dropdownOpen by rememberSaveable { mutableStateOf(false) }
    var chapterQuery by rememberSaveable { mutableStateOf("") }
    val scrollState = rememberScrollState()
    val chapterTitle = chapterSubtitle(chapter)
    val chapterNumbers = buildList {
        addAll(1..minOf(60, chapterCount))
        chapterQuery.toIntOrNull()?.takeIf { it in 1..chapterCount }?.let(::add)
    }.distinct().filter { number ->
        val query = chapterQuery.trim()
        query.isEmpty() || number.toString().contains(query) ||
            "الفصل $number".contains(query) || chapterSubtitle(number).contains(query)
    }

    LaunchedEffect(chapter) {
        scrollState.scrollTo(0)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF090D16)),
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color(0xF20D1523))
                .padding(horizontal = 12.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(7.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                TextButton(
                    onClick = onBack,
                    colors = ButtonDefaults.textButtonColors(contentColor = Color.White),
                ) { Text("رجوع") }
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        manga.title,
                        color = Color.White,
                        fontWeight = FontWeight.Black,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                    Text(
                        "الفصل $chapter · $chapterTitle",
                        color = Color(0xFFF59E0B),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
            }
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                OutlinedButton(
                    enabled = chapter > 1,
                    onClick = { onSelectChapter(chapter - 1) },
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White),
                ) { Text("السابق") }
                OutlinedButton(
                    onClick = { dropdownOpen = !dropdownOpen },
                    modifier = Modifier.weight(1.3f),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White),
                ) { Text("الفصل $chapter") }
                Button(
                    enabled = chapter < chapterCount,
                    onClick = { onSelectChapter(chapter + 1) },
                    modifier = Modifier.weight(1.3f),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color(0xFFF59E0B),
                        contentColor = Color(0xFF090D16),
                    ),
                ) { Text("الفصل التالي") }
            }
            if (dropdownOpen) {
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    color = Color(0xFF0F172A),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0x66F59E0B)),
                ) {
                    Column(
                        modifier = Modifier.padding(10.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp),
                    ) {
                        Text(
                            "اختر الفصل للانتقال السريع · $chapterCount فصل",
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp,
                        )
                        OutlinedTextField(
                            value = chapterQuery,
                            onValueChange = { chapterQuery = it },
                            singleLine = true,
                            label = { Text("ابحث برقم الفصل أو عنوانه") },
                            modifier = Modifier.fillMaxWidth(),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.White,
                                focusedLabelColor = Color(0xFFF59E0B),
                                unfocusedLabelColor = Color(0xFF94A3B8),
                                cursorColor = Color(0xFFF59E0B),
                                focusedBorderColor = Color(0xFFF59E0B),
                                unfocusedBorderColor = Color(0xFF475569),
                            ),
                        )
                        LazyColumn(
                            modifier = Modifier.fillMaxWidth().heightIn(max = 250.dp),
                        ) {
                            items(chapterNumbers) { number ->
                                TextButton(
                                    onClick = {
                                        dropdownOpen = false
                                        chapterQuery = ""
                                        onSelectChapter(number)
                                    },
                                    modifier = Modifier.fillMaxWidth(),
                                ) {
                                    Text(
                                        "الفصل $number · ${chapterSubtitle(number)}",
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis,
                                    )
                                }
                            }
                            if (chapterCount > 60) {
                                item {
                                    Text(
                                        "يمكن الانتقال إلى أي فصل بكتابة رقمه في خانة البحث.",
                                        color = Color(0xFF94A3B8),
                                        fontSize = 10.sp,
                                        modifier = Modifier.padding(8.dp),
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }

        Column(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .verticalScroll(scrollState)
                .padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(11.dp),
        ) {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                color = Color(0xFF3A2810),
            ) {
                Text(
                    "معاينة واجهة القارئ: خدمة المشروع لا توفر صور صفحات الفصول؛ الصور المعروضة أغلفة وبانرات مرجعية وليست صفحات مانجا.",
                    color = Color(0xFFFFE7B0),
                    fontSize = 11.sp,
                    lineHeight = 17.sp,
                    modifier = Modifier.padding(11.dp),
                )
            }
            val artwork = listOfNotNull(manga.coverUrl) + referenceReaderArtwork
            repeat(4) { index ->
                val imageUrl = artwork[(chapter + index - 1) % artwork.size]
                val caption = when (index) {
                    0 -> "الفصل $chapter ($chapterTitle) — تبدأ المشاهد الأولى بتوتر عالٍ مع دخول البطل إلى منطقة الخطر الجديدة."
                    1 -> "الفصل $chapter · مشهد القتال — تشتد المواجهة وتظهر مهارات جديدة لم تُكشف في الفصول السابقة!"
                    2 -> "الفصل $chapter · نقطة التحول — انكشاف سر خطير يقلب موازين القوة في هذا الفصل."
                    else -> "نهاية الفصل $chapter — تشويق يمهد لأحداث الفصل ${minOf(chapterCount, chapter + 1)} القادم!"
                }
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF111827)),
                ) {
                    Column {
                        AsyncImage(
                            model = imageUrl,
                            contentDescription = "صورة معاينة $index للفصل $chapter",
                            contentScale = ContentScale.Crop,
                            modifier = Modifier.fillMaxWidth().height(260.dp),
                        )
                        Column(modifier = Modifier.padding(13.dp)) {
                            Text(
                                "صفحة ${index + 1} من 4 — الفصل $chapter",
                                color = Color(0xFFF59E0B),
                                fontWeight = FontWeight.Black,
                                fontSize = 11.sp,
                            )
                            Text(
                                caption,
                                color = Color.White,
                                fontSize = 13.sp,
                                lineHeight = 21.sp,
                                modifier = Modifier.padding(top = 5.dp),
                            )
                        }
                    }
                }
            }
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF111827)),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("أكملت قراءة الفصل $chapter", color = Color.White, fontWeight = FontWeight.Black)
                        Text(
                            if (chapter < chapterCount) "جاهز للانتقال إلى الفصل ${chapter + 1}"
                            else "وصلت إلى آخر فصل متاح",
                            color = Color(0xFF94A3B8),
                            fontSize = 11.sp,
                        )
                    }
                    if (chapter < chapterCount) {
                        Spacer(Modifier.width(8.dp))
                        Button(
                            onClick = { onSelectChapter(chapter + 1) },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Color(0xFFF59E0B),
                                contentColor = Color(0xFF090D16),
                            ),
                        ) {
                            Text("الفصل التالي")
                        }
                    }
                }
            }
        }
    }
}

internal fun MangaCard.referenceChapterCount(): Int {
    if (chapters != null && chapters > 0) return chapters
    val titleText = listOfNotNull(englishTitle, title).joinToString(" ").lowercase()
    return when {
        "solo leveling" in titleText -> 200
        "one piece" in titleText -> 1142
        "jujutsu kaisen" in titleText -> 271
        "frieren" in titleText -> 138
        "attack on titan" in titleText -> 139
        "kimetsu" in titleText || "demon slayer" in titleText -> 205
        "blue lock" in titleText -> 295
        "hunter x hunter" in titleText -> 410
        "one-punch man" in titleText || "one punch man" in titleText -> 252
        else -> 1
    }
}

private fun chapterSubtitle(number: Int): String = when (number) {
    1 -> "بداية الرحلة واليقظة الأولى"
    2 -> "المواجهة الثانية: اختبار القوة الحقيقية"
    3 -> "أسرار الطابق المظلم والعدو الخفي"
    4 -> "تحالف غير متوقع في قلب المعركة"
    5 -> "ظهور القائد الأعلى وبداية الاختبار"
    6 -> "انكسار الختم وتحرر الطاقة الكامنة"
    7 -> "معركة القلعة الحاسمة"
    else -> "أحداث الفصل $number: تصاعد المواجهة الحاسمة"
}
