---
name: Original Android source scope
description: The user's standing rule for modifying Anime NOVA in this repository.
---

For Anime NOVA, use WebView build #4 as the sole feature and UI reference. Rebuild its behavior in the existing native Kotlin, Jetpack Compose, and AndroidX Media3 app; do not add a WebView or use any other build as the specification. Preserve the native app's identity, navigation, server connection, and Rift Player. If the API lacks a capability, disclose that limitation rather than presenting mock data as real.

**Why:** The user explicitly chose the WebView build #4 as the required reference and requested a native implementation with its full feature set.

**How to apply:** Compare the selected WebView build's screens and interactions with the checked-out Android source, then port gaps into the existing native app. Do not infer features from other builds.
