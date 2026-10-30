plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
    id("org.jetbrains.kotlin.plugin.serialization")
}

// Identity contract note:
// Reference production app (artifacts/nova-mobile/app.json & api-server/src/lib/security.ts):
//   MOBILE_PACKAGE_NAME = "com.nova.anime"
//   MOBILE_CLIENT_ID    = "nova-anime-mobile-v1"
//   MIN_VERSION         = "1.0.0"
// Draft migration identity in nova2-android:
//   NOVA2_PACKAGE_NAME  = "com.nova.anime.nova2"
//   NOVA2_CLIENT_ID     = "nova2-android"
// Keep defaultConfig configurable via Gradle properties so switching to com.nova.anime
// happens only when signing with the production keystore and after explicit release approval.
val novaAppId = (project.findProperty("nova.release.applicationId") as String?)?.trim()
    ?.takeIf { it.isNotEmpty() } ?: "com.nova.anime.nova2"
val novaClientId = (project.findProperty("nova.release.clientId") as String?)?.trim()
    ?.takeIf { it.isNotEmpty() } ?: "nova2-android"
val novaVersionName = (project.findProperty("nova.release.versionName") as String?)?.trim()
    ?.takeIf { it.isNotEmpty() } ?: "3.5.0"

android {
    namespace = "com.nova.anime.nova2"
    compileSdk = 35

    defaultConfig {
        applicationId = novaAppId
        minSdk = 24
        targetSdk = 35
        versionCode = 35
        versionName = novaVersionName

        buildConfigField("String", "NOVA_API_URL", "\"https://animenovaa.duckdns.org\"")
        buildConfigField("String", "NOVA_CLIENT_ID", "\"$novaClientId\"")
        buildConfigField("String", "NOVA_VERSION", "\"$novaVersionName\"")
        buildConfigField("String", "NOVA_PACKAGE", "\"$novaAppId\"")
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            isShrinkResources = false
            signingConfig = signingConfigs.getByName("debug")
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
        }
        debug {
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"
        }
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    packaging {
        resources.excludes += setOf(
            "META-INF/AL2.0",
            "META-INF/LGPL2.1",
        )
    }
}

dependencies {
    implementation(platform("androidx.compose:compose-bom:2024.12.01"))
    implementation("androidx.activity:activity-compose:1.10.1")
    implementation("androidx.activity:activity-ktx:1.10.1")
    implementation("androidx.compose.foundation:foundation")
    implementation("androidx.compose.foundation:foundation-layout")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material3:material3-window-size-class:1.3.1")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    debugImplementation("androidx.compose.ui:ui-tooling")

    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.7")
    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.8.7")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
    implementation("androidx.navigation:navigation-compose:2.8.5")
    implementation("androidx.tv:tv-foundation:1.0.0-alpha11")
    implementation("androidx.webkit:webkit:1.12.1")

    implementation("androidx.security:security-crypto:1.1.0-alpha06")
    implementation("androidx.datastore:datastore-preferences:1.1.1")

    implementation("androidx.media3:media3-exoplayer:1.5.1")
    implementation("androidx.media3:media3-exoplayer-hls:1.5.1")
    implementation("androidx.media3:media3-ui:1.5.1")
    implementation("androidx.media3:media3-datasource-okhttp:1.5.1")

    implementation("io.coil-kt:coil-compose:2.7.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
}
