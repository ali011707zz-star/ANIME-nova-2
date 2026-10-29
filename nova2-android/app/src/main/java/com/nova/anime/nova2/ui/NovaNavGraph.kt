package com.nova.anime.nova2.ui

import androidx.compose.runtime.Composable
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.nova.anime.nova2.core.catalog.AnilistRepository
import com.nova.anime.nova2.core.download.DownloadRepository
import com.nova.anime.nova2.core.library.LibraryStore
import com.nova.anime.nova2.core.playback.PlaybackRepository
import com.nova.anime.nova2.core.session.SessionViewModel

private const val START = "bootstrap"

@Composable
fun NovaNavGraph(
    repository: AnilistRepository,
    playbackRepository: PlaybackRepository,
    libraryStore: LibraryStore,
    downloadRepository: DownloadRepository,
    sessionViewModel: SessionViewModel,
    onSignOut: () -> Unit,
    bootstrapContent: @Composable (onOpenHome: () -> Unit) -> Unit,
) {
    val navController = rememberNavController()
    NavHost(navController = navController, startDestination = START) {
        composable(START) {
            bootstrapContent {
                navController.navigate("home") {
                    popUpTo(START) { inclusive = true }
                }
            }
        }
        composable("home") {
            HomeScreen(
                repository = repository,
                onOpenDetails = { navController.navigate("details/$it") },
                onOpenEpisodes = { navController.navigate("episodes/$it") },
                onOpenWatch = { animeId, episode -> navController.navigate("watch/$animeId/$episode") },
                onOpenBrowse = { navController.navigate("browse") },
                onOpenSearch = { navController.navigate("search") },
                onOpenDubbed = { navController.navigate("dubbed") },
                onOpenAnimations = { navController.navigate("animations") },
                onOpenStardima = { navController.navigate("stardima") },
                onOpenSchedule = { navController.navigate("schedule") },
                onOpenNews = { navController.navigate("news") },
                onOpenLibrary = { navController.navigate("library") },
                onOpenSettings = { navController.navigate("settings") },
            )
        }
        composable("browse") {
            BrowseScreen(
                repository = repository,
                onOpenDetails = { navController.navigate("details/$it") },
                onBack = { navController.popBackStack() },
            )
        }
        composable("search") {
            SearchScreen(
                repository = repository,
                onOpenDetails = { navController.navigate("details/$it") },
                onBack = { navController.popBackStack() },
            )
        }
        composable("dubbed") {
            DubbedHubScreen(
                repository = repository,
                playbackRepository = playbackRepository,
                onBack = { navController.popBackStack() },
            )
        }
        composable("animations") {
            AnimationsCatalogScreen(
                repository = repository,
                onBack = { navController.popBackStack() },
            )
        }
        composable("stardima") {
            StardimaCatalogScreen(
                repository = repository,
                onBack = { navController.popBackStack() },
            )
        }
        composable("schedule") {
            ScheduleScreen(
                repository = repository,
                onOpenDetails = { navController.navigate("details/$it") },
                onBack = { navController.popBackStack() },
            )
        }
        composable("news") {
            NewsScreen(
                repository = repository,
                onBack = { navController.popBackStack() },
            )
        }
        composable(
            route = "details/{id}",
            arguments = listOf(navArgument("id") { type = NavType.IntType }),
        ) { entry ->
            DetailsScreen(
                repository = repository,
                id = entry.arguments?.getInt("id") ?: return@composable,
                libraryStore = libraryStore,
                onOpenDetails = { navController.navigate("details/$it") },
                onOpenEpisodes = { navController.navigate("episodes/$it") },
                onBack = { navController.popBackStack() },
            )
        }
        composable(
            route = "episodes/{id}",
            arguments = listOf(navArgument("id") { type = NavType.IntType }),
        ) { entry ->
            EpisodesScreen(
                repository = repository,
                id = entry.arguments?.getInt("id") ?: return@composable,
                onOpenWatch = { animeId, episode ->
                    navController.navigate("watch/$animeId/$episode")
                },
                onBack = { navController.popBackStack() },
            )
        }
        composable(
            route = "watch/{id}/{episode}",
            arguments = listOf(
                navArgument("id") { type = NavType.IntType },
                navArgument("episode") { type = NavType.IntType },
            ),
        ) { entry ->
            val animeId = entry.arguments?.getInt("id") ?: return@composable
            val episode = entry.arguments?.getInt("episode") ?: return@composable
            WatchScreen(
                repository = repository,
                playbackRepository = playbackRepository,
                libraryStore = libraryStore,
                downloadRepository = downloadRepository,
                id = animeId,
                episodeNumber = episode,
                onOpenEpisode = { nextEp ->
                    navController.navigate("watch/$animeId/$nextEp") {
                        popUpTo("watch/$animeId/$episode") { inclusive = true }
                    }
                },
                onBack = { navController.popBackStack() },
            )
        }
        composable("library") {
            LibraryScreen(
                libraryStore = libraryStore,
                downloadRepository = downloadRepository,
                onOpenDetails = { navController.navigate("details/$it") },
                onOpenWatch = { animeId, episode ->
                    navController.navigate("watch/$animeId/$episode")
                },
                onBack = { navController.popBackStack() },
            )
        }
        composable("settings") {
            SettingsScreen(
                libraryStore = libraryStore,
                sessionViewModel = sessionViewModel,
                onSignOut = { onSignOut(); navController.popBackStack() },
                onBack = { navController.popBackStack() },
            )
        }
    }
}
