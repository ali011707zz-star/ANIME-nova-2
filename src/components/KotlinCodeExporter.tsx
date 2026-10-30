import React, { useState } from 'react';
import { KOTLIN_ANDROID_PROJECT, KotlinSourceFile } from '../data/kotlinCodebase';
import { Language } from '../types/anime';
import JSZip from 'jszip';
import {
  Code2,
  Copy,
  Check,
  Download,
  FileCode,
  ShieldCheck,
  Tv,
  Smartphone,
  Layers,
  X
} from 'lucide-react';

interface KotlinCodeExporterProps {
  language: Language;
  onClose: () => void;
}

export const KotlinCodeExporter: React.FC<KotlinCodeExporterProps> = ({
  language,
  onClose
}) => {
  const isAr = language === 'ar';
  const [activeFile, setActiveFile] = useState<KotlinSourceFile>(KOTLIN_ANDROID_PROJECT[0]);
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(activeFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      const zip = new JSZip();

      // Add each Kotlin, XML, Gradle file to zip
      KOTLIN_ANDROID_PROJECT.forEach((file) => {
        zip.file(file.path, file.code);
      });

      // Add README.md with Android Studio setup guide
      const readmeContent = `# Anime NOVA — Kotlin & Android Native Rewrite (Jetpack Compose + Media3)
إعادة كتابة تطبيق Anime NOVA الأصلي بلغة Kotlin وAndroid Native للهاتف وAndroid TV

## Key Architecture Highlights:
1. Original Anime NOVA Identity:
   - Reference identity: \`com.nova.anime\` (\`nova-anime-mobile-v1\`) with configurable Gradle properties (\`nova.release.applicationId\`, \`nova.release.clientId\`, \`nova.release.versionName\`).
2. Unified Phone & Android TV Support:
   - \`android.software.leanback\` and \`android.hardware.touchscreen\` marked \`required="false"\`.
   - Dual intent-filters (\`LAUNCHER\` + \`LEANBACK_LAUNCHER\`) and automatic TV detection via \`UI_MODE_TYPE_TELEVISION\`.
3. Media3 ExoPlayer (RiftPlayer Native):
   - Progressive SSE source streaming (\`/api/anime/sources-stream\`) with immediate playback, stream cancellation on exit, automatic source failover preserving position, skip intro/outro (\`/api/anime/skip-times\`), gestures, and TV D-Pad controls.
4. Cloud-Synced Library & MP4 Downloads:
   - Account-isolated storage (\`nova-history:account:{userId}\`), deferred deletions, FNV-1a namespace isolation (\`getWatchContentId\`), and MP4 DownloadManager + MediaStore gallery export.
`;
      zip.file('README.md', readmeContent);
      zip.file(
        '.github/workflows/build-android-apk.yml',
        `name: Build Anime NOVA Android APK (v3.5)
on:
  push:
    branches: [ main, master ]
  workflow_dispatch:
jobs:
  build-apk:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
      - uses: gradle/actions/setup-gradle@v4
        with:
          gradle-version: '8.11.1'
      - run: gradle assembleDebug assembleRelease --no-daemon
      - uses: actions/upload-artifact@v4
        with:
          name: Anime-NOVA-v3.5-Android-APK
          path: |
            app/build/outputs/apk/release/*.apk
            app/build/outputs/apk/debug/*.apk
`
      );

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'AnimeNova-Kotlin-Android-Native.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate zip', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="relative w-full max-w-5xl rounded-3xl bg-neutral-900 border border-white/15 overflow-hidden shadow-2xl text-white my-auto flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between gap-4 bg-neutral-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-400">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">
                    {isAr
                      ? `كود Anime NOVA الأصلي — Kotlin & Android Native (${KOTLIN_ANDROID_PROJECT.length} ملفًا)`
                      : `Anime NOVA Original — Kotlin & Android Native (${KOTLIN_ANDROID_PROJECT.length} Files)`}
                  </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[11px] font-bold text-emerald-400">
                  Jetpack Compose + Media3 + TV
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                {isAr
                  ? 'إعادة كتابة كاملة لتطبيق Anime NOVA الأصلي بـ Jetpack Compose وMedia3 للهاتف وAndroid TV'
                  : 'Complete Kotlin Native rewrite of the original Anime NOVA app for Phone & Android TV'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg transition-transform active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isZipping ? (isAr ? 'جاري التحزيم...' : 'Zipping...') : (isAr ? 'تحميل المشروع (.zip)' : 'Download Zip')}</span>
            </button>

            <button
              onClick={onClose}
              aria-label="Close"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Technical Architecture Summary Pills */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-neutral-950/40 border-b border-white/10 text-xs">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block">
                {isAr ? 'سر التبديل بسلامة (Safe Handover)' : 'Safe Handover Secret'}
              </span>
              <p className="text-neutral-400 text-[11px] mt-0.5">
                {isAr
                  ? 'استخدام configChanges و Singleton ViewModel لحفظ الثواني ومسار الصوت دون إعادة إنشاء النشاط'
                  : 'configChanges & Singleton ViewModel prevent activity destruction and preserve audio/subtitles'}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-start gap-2.5">
            <Tv className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block">
                {isAr ? 'واجهة التلفاز (10-Foot UI)' : '10-Foot Leanback UI'}
              </span>
              <p className="text-neutral-400 text-[11px] mt-0.5">
                {isAr
                  ? 'مكتبة androidx.tv.material3 مع تركيز D-Pad وهوامش أمان 5% للشاشات الكبيرة'
                  : 'androidx.tv.material3 with TvLazyRow, D-Pad focus borders, and overscan protection'}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-start gap-2.5">
            <Smartphone className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block">
                {isAr ? 'توافق أندرويد المزدوج' : 'Dual Manifest Setup'}
              </span>
              <p className="text-neutral-400 text-[11px] mt-0.5">
                {isAr
                  ? 'leanback=false و touchscreen=false يتيحان تثبيت نفس الـ APK على الهاتف والتلفاز معاً'
                  : 'leanback=false & touchscreen=false enable installing the same single APK on both'}
              </p>
            </div>
          </div>
        </div>

        {/* Code Viewer Layout: Sidebar Files + Code Editor */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 overflow-hidden">
          {/* File selector column */}
          <div className="md:col-span-4 p-3 border-r border-white/10 bg-neutral-950/60 overflow-y-auto space-y-1.5">
            <span className="text-[11px] font-bold text-neutral-400 px-2 block mb-2 uppercase tracking-wider">
              {isAr ? 'ملفات المشروع' : 'Project Files'}
            </span>

            {KOTLIN_ANDROID_PROJECT.map((file) => {
              const isSelected = activeFile.name === file.name;
              return (
                <button
                  key={file.name}
                  onClick={() => setActiveFile(file)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all text-xs flex flex-col gap-1 border ${
                    isSelected
                      ? 'bg-violet-600/20 border-violet-500 text-white font-bold'
                      : 'bg-transparent border-transparent text-neutral-400 hover:bg-white/5 hover:text-neutral-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileCode className={`w-4 h-4 shrink-0 ${isSelected ? 'text-violet-400' : 'text-neutral-500'}`} />
                    <span className="font-mono truncate">{file.name}</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 line-clamp-1">
                    {isAr ? file.descriptionAr : file.descriptionEn}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Code Viewer column */}
          <div className="md:col-span-8 flex flex-col min-h-0 bg-neutral-950">
            {/* File Path and Copy Action Bar */}
            <div className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between text-xs bg-neutral-900/60">
              <span className="font-mono text-neutral-400 truncate max-w-[340px]">
                {activeFile.path}
              </span>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-200 hover:text-white font-medium transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">{isAr ? 'تم النسخ!' : 'Copied!'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>{isAr ? 'نسخ الكود' : 'Copy Code'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Code Content View */}
            <div dir="ltr" className="flex-1 p-4 overflow-y-auto font-mono text-xs leading-relaxed text-neutral-200 bg-neutral-950/90 selection:bg-violet-600 selection:text-white text-left">
              <pre className="whitespace-pre font-mono text-left">{activeFile.code}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
