package com.nova.anime.nova2.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.focusable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.nova.anime.nova2.core.catalog.AnilistRepository
import com.nova.anime.nova2.core.catalog.AnimeCard
import com.nova.anime.nova2.core.catalog.BrowseFilters
import kotlinx.coroutines.CancellationException

private data class GlobalStatsCategory(
    val id: String,
    val label: String,
    val format: String? = null,
    val status: String? = null,
)

private val globalStatsCategories = listOf(
    GlobalStatsCategory("top_all", "أفضل الأنميات"),
    GlobalStatsCategory("top_airing", "أفضل الأنميات المستمرة", status = "RELEASING"),
    GlobalStatsCategory("top_movies", "أفضل الأفلام", format = "MOVIE"),
    GlobalStatsCategory("top_series", "أفضل المسلسلات", format = "TV"),
    GlobalStatsCategory("top_ova", "أفضل الاوفا", format = "OVA"),
    GlobalStatsCategory("top_ona", "أفضل الاونا", format = "ONA"),
)

@Composable
fun GlobalStatsScreen(
    repository: AnilistRepository,
    onOpenDetails: (Int) -> Unit,
    onBack: () -> Unit,
) {
    var activeCategoryId by rememberSaveable { mutableStateOf(globalStatsCategories.first().id) }
    var searchOpen by rememberSaveable { mutableStateOf(false) }
    var searchQuery by rememberSaveable { mutableStateOf("") }
    var results by remember { mutableStateOf<List<AnimeCard>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    val category = globalStatsCategories.firstOrNull { it.id == activeCategoryId }
        ?: globalStatsCategories.first()

    LaunchedEffect(category) {
        loading = true
        error = null
        try {
            results = repository.browse(
                BrowseFilters(
                    sort = "SCORE_DESC",
                    format = category.format,
                    status = category.status,
                ),
            )
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (failure: Exception) {
            results = emptyList()
            error = failure.message ?: "تعذر تحميل الإحصائيات العالمية"
        } finally {
            loading = false
        }
    }

    val filteredResults = remember(results, searchQuery) {
        val query = searchQuery.trim()
        if (query.isEmpty()) results else results.filter { anime ->
            anime.title.contains(query, ignoreCase = true) ||
                anime.englishTitle.orEmpty().contains(query, ignoreCase = true) ||
                anime.arabicTitle.orEmpty().contains(query, ignoreCase = true) ||
                anime.year?.toString()?.contains(query) == true
        }
    }
    val layout = rememberNovaLayout()

    CatalogScaffold(title = "الإحصائيات العالمية", onBack = onBack) {
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 2.dp),
                horizontalArrangement = Arrangement.End,
            ) {
                TextButton(
                    onClick = {
                        if (searchOpen) searchQuery = ""
                        searchOpen = !searchOpen
                    },
                ) {
                    Text(if (searchOpen) "إغلاق البحث" else "بحث في الإحصائيات")
                }
            }
        }
        if (searchOpen) {
            item {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    singleLine = true,
                    label = { Text("ابحث بالاسم أو السنة") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 14.dp, vertical = 4.dp),
                )
            }
        }
        item {
            LazyRow(
                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                items(globalStatsCategories, key = { it.id }) { option ->
                    FilterChip(
                        selected = category.id == option.id,
                        onClick = { activeCategoryId = option.id },
                        label = { Text(option.label, maxLines = 1) },
                    )
                }
            }
        }
        when {
            loading -> item { LoadingBlock() }
            error != null -> item { ErrorBlock(error!!) }
            filteredResults.isEmpty() -> item {
                Text(
                    text = if (searchQuery.isBlank()) "لا توجد نتائج متاحة" else "لا توجد نتائج مطابقة",
                    modifier = Modifier.fillMaxWidth().padding(28.dp),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                )
            }
            else -> {
                items(filteredResults.chunked(layout.columns)) { rowItems ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = layout.horizontalPadding, vertical = 6.dp),
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        rowItems.forEachIndexed { index, anime ->
                            GlobalStatsPosterCard(
                                anime = anime,
                                rank = filteredResults.indexOf(anime) + 1,
                                width = layout.cardWidth,
                                isTv = layout.isTv,
                                onClick = { onOpenDetails(anime.id) },
                            )
                        }
                        repeat((layout.columns - rowItems.size).coerceAtLeast(0)) {
                            Spacer(Modifier.width(layout.cardWidth))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun GlobalStatsPosterCard(
    anime: AnimeCard,
    rank: Int,
    width: Dp,
    isTv: Boolean,
    onClick: () -> Unit,
) {
    var focused by remember { mutableStateOf(false) }
    Column(
        modifier = Modifier
            .width(width)
            .onFocusChanged { focused = it.isFocused }
            .focusable()
            .clickable(onClick = onClick),
        verticalArrangement = Arrangement.spacedBy(3.dp),
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(width * 1.475f)
                .clip(RoundedCornerShape(10.dp))
                .background(MaterialTheme.colorScheme.surfaceVariant)
                .then(
                    if (focused && isTv) {
                        Modifier.border(
                            BorderStroke(2.dp, Color(0xFFFACC15)),
                            RoundedCornerShape(10.dp),
                        )
                    } else {
                        Modifier
                    },
                ),
        ) {
            anime.coverUrl?.let { url ->
                AsyncImage(
                    model = url,
                    contentDescription = anime.title,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize(),
                )
            }
            Box(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .height(width * .62f)
                    .background(
                        Brush.verticalGradient(listOf(Color.Transparent, Color.Black.copy(alpha = .82f))),
                    ),
            )
            Surface(
                modifier = Modifier.align(Alignment.TopStart).padding(5.dp),
                color = Color(0xD9161B28),
                shape = RoundedCornerShape(7.dp),
                border = BorderStroke(1.dp, Color.White.copy(alpha = .16f)),
            ) {
                Text(
                    text = "#$rank",
                    color = Color.White,
                    fontSize = if (isTv) 12.sp else 10.sp,
                    fontWeight = FontWeight.ExtraBold,
                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 3.dp),
                )
            }
            anime.year?.let { year ->
                Text(
                    text = year.toString(),
                    color = Color.White,
                    fontSize = if (isTv) 13.sp else 11.sp,
                    fontWeight = FontWeight.Black,
                    modifier = Modifier.align(Alignment.BottomEnd).padding(7.dp),
                )
            }
        }
        CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr) {
            Text(
                text = anime.englishTitle ?: anime.title,
                fontSize = if (isTv) 14.sp else 12.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onBackground,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }
        Text(
            text = listOfNotNull(
                anime.format?.toDisplayFormat(),
                anime.score?.let { "★ %.1f".format(it / 10f) },
            ).joinToString(" · ").ifBlank { "أنمي" },
            fontSize = if (isTv) 12.sp else 10.sp,
            fontWeight = FontWeight.SemiBold,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
        )
    }
}

private fun String.toDisplayFormat(): String = when (this) {
    "TV" -> "مسلسل"
    "MOVIE" -> "فيلم"
    "OVA" -> "أوفا"
    "ONA" -> "أونا"
    else -> this
}
