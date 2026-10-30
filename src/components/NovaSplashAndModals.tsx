import React, { useEffect, useState } from "react";
import {
  Play,
  Bookmark,
  Download,
  Send,
  X,
  Sparkles,
  Tv,
  ShieldCheck,
  ExternalLink,
  Film,
  BookOpen,
  Smartphone,
  CheckCircle2,
} from "lucide-react";
import { ThemePalette } from "../constants/novaColors";
import { useTvMetrics } from "../utils/tv";

export const TELEGRAM_CHANNEL_URL = "https://t.me/ANIME_N0VA";

/* ══════════════════════════════════════════════════════════════════════════
   1. BrandSplash — Larger, Comprehensive & Ultra-Elegant Cinema Startup Screen
      Keeps "ANIME" in #FFFFFF (or dark in light theme) and "NOVA" in #38BDF8
   ══════════════════════════════════════════════════════════════════════════ */
export function BrandSplash({
  colors,
  onFinish,
}: {
  colors?: ThemePalette;
  onFinish: () => void;
}) {
  const { tv: tvMode } = useTvMetrics();
  const [fadingOut, setFadingOut] = useState(false);
  const [progress, setProgress] = useState(22);

  const isLight =
    colors?.background === "#F8FAFC" || colors?.background === "#FFFFFF";

  useEffect(() => {
    const step1 = setTimeout(() => setProgress(58), 400);
    const step2 = setTimeout(() => setProgress(88), 950);
    const step3 = setTimeout(() => setProgress(100), 1450);
    const fadeTimer = setTimeout(() => setFadingOut(true), 1850);
    const doneTimer = setTimeout(() => onFinish(), 2250);
    return () => {
      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(step3);
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onFinish]);

  const statusLabel =
    progress < 50
      ? "جاري الاتصال بسيرفرات البث السحابية فائقة السرعة..."
      : progress < 95
      ? "جاري تجهيز مكتبة الأنمي والأفلام والمانجا المترجمة..."
      : "اكتملت التهيئة بنجاح · جاهز للمشاهدة الفورية!";

  const comprehensiveFeatures = [
    {
      icon: Play,
      title: "أنمي مترجم وأفلام",
      sub: "بث فوري 1080p FHD",
      accent: "#38BDF8",
    },
    {
      icon: Film,
      title: "مدبلج وسبيستون",
      sub: "أرشيف الكرتون والمدبلجات",
      accent: "#10B981",
    },
    {
      icon: BookOpen,
      title: "مانجا ومانهوا",
      sub: "قارئ فصول ذكي وملون",
      accent: "#F59E0B",
    },
    {
      icon: Download,
      title: "تنزيل بلا إنترنت",
      sub: "إيقاف واستئناف مباشر",
      accent: "#A78BFA",
    },
    {
      icon: Bookmark,
      title: "مكتبتك السحابية",
      sub: "المفضلة وسجل المشاهدة",
      accent: "#F43F5E",
    },
    {
      icon: Smartphone,
      title: "للهاتف والتلفاز",
      sub: "دعم كامل لـ Android TV",
      accent: "#06B6D4",
    },
  ];

  return (
    <div
      dir="rtl"
      data-testid="brand-splash-screen"
      className="fixed inset-0 z-[100] flex items-center justify-center select-none overflow-y-auto no-scrollbar transition-opacity duration-400"
      style={{
        opacity: fadingOut ? 0 : 1,
        background: isLight
          ? "radial-gradient(circle at 50% 18%, rgba(14, 165, 233, 0.16) 0%, rgba(241, 245, 249, 0.98) 55%, #E2E8F0 100%)"
          : "radial-gradient(circle at 50% 18%, rgba(14, 165, 233, 0.22) 0%, rgba(7, 10, 18, 0.97) 54%, #04060B 100%)",
        padding: tvMode ? "28px 32px" : "16px 14px",
      }}
    >
      {/* Ambient Decorative Glows */}
      <div
        className="pointer-events-none absolute rounded-full"
        style={{
          width: 420,
          height: 420,
          top: -110,
          right: -90,
          background:
            "radial-gradient(circle, rgba(56, 189, 248, 0.20) 0%, rgba(56, 189, 248, 0) 70%)",
          filter: "blur(30px)",
        }}
      />
      <div
        className="pointer-events-none absolute rounded-full"
        style={{
          width: 380,
          height: 380,
          bottom: -100,
          left: -80,
          background:
            "radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, rgba(2, 132, 199, 0) 70%)",
          filter: "blur(28px)",
        }}
      />

      {/* Larger, Comprehensive & Elegant Startup Showcase Window */}
      <div
        data-testid="brand-splash-card"
        className="relative w-full flex flex-col items-center nova-anim-fade"
        style={{
          maxWidth: tvMode ? 680 : 480,
          borderRadius: 32,
          paddingTop: tvMode ? 34 : 26,
          paddingBottom: tvMode ? 30 : 22,
          paddingLeft: tvMode ? 32 : 20,
          paddingRight: tvMode ? 32 : 20,
          background: isLight
            ? "linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.99) 100%)"
            : "linear-gradient(180deg, rgba(15, 22, 36, 0.95) 0%, rgba(8, 12, 21, 0.98) 100%)",
          border: isLight
            ? "1.5px solid rgba(14, 165, 233, 0.28)"
            : "1.5px solid rgba(56, 189, 248, 0.24)",
          boxShadow: isLight
            ? "0 28px 64px -12px rgba(15, 23, 42, 0.18), 0 0 36px -10px rgba(14, 165, 233, 0.18)"
            : "0 32px 72px -12px rgba(0, 0, 0, 0.92), 0 0 44px -10px rgba(56, 189, 248, 0.26)",
          backdropFilter: "blur(24px)",
        }}
      >
        {/* Top Comprehensive Header Strip */}
        <div className="w-full flex items-center justify-between gap-2 mb-5">
          <div
            className="inline-flex items-center gap-1.5"
            style={{
              paddingLeft: 12,
              paddingRight: 12,
              paddingTop: 5,
              paddingBottom: 5,
              borderRadius: 999,
              backgroundColor: isLight
                ? "rgba(14, 165, 233, 0.10)"
                : "rgba(56, 189, 248, 0.12)",
              border: isLight
                ? "1px solid rgba(14, 165, 233, 0.28)"
                : "1px solid rgba(56, 189, 248, 0.30)",
            }}
          >
            <Sparkles size={13} color="#0EA5E9" />
            <span
              style={{
                fontSize: 11,
                fontWeight: 900,
                color: isLight ? "#0369A1" : "#E0F2FE",
                letterSpacing: "0.2px",
              }}
            >
              الإصدار السينمائي الشامل · V3.5
            </span>
          </div>

          <div
            className="inline-flex items-center gap-1.5"
            style={{
              paddingLeft: 10,
              paddingRight: 10,
              paddingTop: 5,
              paddingBottom: 5,
              borderRadius: 999,
              backgroundColor: isLight
                ? "rgba(16, 185, 129, 0.10)"
                : "rgba(16, 185, 129, 0.14)",
              border: "1px solid rgba(16, 185, 129, 0.32)",
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: "#10B981" }}
            />
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                color: isLight ? "#047857" : "#6EE7B7",
              }}
            >
              خوادم البث متصلة
            </span>
          </div>
        </div>

        {/* Hero Centerpiece: Official Nova Emblem + Brand Identity */}
        <div className="w-full flex flex-col items-center">
          <div className="relative flex items-center justify-center mb-4">
            <div
              className="absolute rounded-[38px]"
              style={{
                width: tvMode ? 176 : 156,
                height: tvMode ? 176 : 156,
                background:
                  "radial-gradient(circle, rgba(56, 189, 248, 0.36) 0%, rgba(16, 185, 129, 0.18) 52%, rgba(0, 0, 0, 0) 75%)",
                filter: "blur(10px)",
              }}
            />
            <div
              className="relative flex items-center justify-center overflow-hidden"
              style={{
                width: tvMode ? 148 : 132,
                height: tvMode ? 148 : 132,
                borderRadius: 32,
                backgroundColor: "#06050B",
                border: "2px solid rgba(56, 189, 248, 0.55)",
                boxShadow:
                  "0 20px 44px rgba(0, 0, 0, 0.78), 0 0 30px rgba(56, 189, 248, 0.32)",
              }}
            >
              <img
                src="/assets/aistudio/IMG_20261025_020007_932_0a013fb3.jpg"
                alt="Anime NOVA Official Icon"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Floating FHD Quality Badge */}
            <div
              dir="ltr"
              className="absolute -bottom-2 px-3 py-1 rounded-full flex items-center gap-1"
              style={{
                background: "linear-gradient(90deg, #0284C7 0%, #10B981 100%)",
                border: "1.5px solid rgba(255, 255, 255, 0.45)",
                boxShadow: "0 6px 16px rgba(2, 132, 199, 0.45)",
              }}
            >
              <CheckCircle2 size={11} color="#FFFFFF" />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 900,
                  color: "#FFFFFF",
                  letterSpacing: "0.5px",
                }}
              >
                1080p FHD · ARABIC
              </span>
            </div>
          </div>

          {/* Brand Logo */}
          <div
            dir="ltr"
            className="flex items-center justify-center gap-2.5 mt-2"
            style={{
              fontSize: tvMode ? 38 : 33,
              fontWeight: 900,
              letterSpacing: "2.2px",
              lineHeight: "40px",
            }}
          >
            <span style={{ color: isLight ? "#0F172A" : "#FFFFFF" }}>ANIME</span>
            <span
              style={{
                color: isLight ? "#0284C7" : "#38BDF8",
                textShadow: isLight
                  ? "none"
                  : "0 0 20px rgba(56, 189, 248, 0.45)",
              }}
            >
              NOVA
            </span>
          </div>

          <p
            className="m-0 mt-1.5 text-center"
            style={{
              fontSize: tvMode ? 15 : 13.5,
              fontWeight: 800,
              color: isLight ? "#1E293B" : "#F8FAFC",
            }}
          >
            المنصة العربية الشاملة للأنمي والمدبلجات وأفلام الأنمي والمانجا
          </p>
          <p
            className="m-0 mt-1 text-center"
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              color: isLight ? "#64748B" : "rgba(226, 232, 240, 0.72)",
            }}
          >
            مشاهدة فورية بدون تقطيع · تخطي ذكي للمقدمات · تحميل ومزامنة سحابية
          </p>
        </div>

        {/* Comprehensive 6-Pillar Bento Grid */}
        <div
          className="w-full grid grid-cols-2 sm:grid-cols-3 gap-2.5"
          style={{ marginTop: 18, marginBottom: 18 }}
        >
          {comprehensiveFeatures.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-2.5 p-2.5 rounded-2xl"
                style={{
                  backgroundColor: isLight
                    ? "rgba(241, 245, 249, 0.9)"
                    : "rgba(255, 255, 255, 0.045)",
                  border: isLight
                    ? "1px solid rgba(15, 23, 42, 0.09)"
                    : "1px solid rgba(255, 255, 255, 0.09)",
                }}
              >
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 11,
                    backgroundColor: `${item.accent}20`,
                    border: `1px solid ${item.accent}45`,
                  }}
                >
                  <Icon size={16} color={item.accent} />
                </div>
                <div className="min-w-0 flex-1 text-right">
                  <div
                    className="line-clamp-1"
                    style={{
                      fontSize: 11.5,
                      fontWeight: 900,
                      color: isLight ? "#0F172A" : "#FFFFFF",
                    }}
                  >
                    {item.title}
                  </div>
                  <div
                    className="line-clamp-1"
                    style={{
                      fontSize: 9.5,
                      fontWeight: 700,
                      color: isLight ? "#64748B" : "rgba(203, 213, 225, 0.75)",
                    }}
                  >
                    {item.sub}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Smooth Progress Loader + Direct Enter CTA */}
        <div
          className="w-full p-3.5 rounded-2xl flex flex-col gap-2.5"
          style={{
            backgroundColor: isLight
              ? "rgba(241, 245, 249, 0.95)"
              : "rgba(255, 255, 255, 0.04)",
            border: isLight
              ? "1px solid rgba(15, 23, 42, 0.08)"
              : "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <span
              className="line-clamp-1"
              style={{
                fontSize: 11.5,
                fontWeight: 800,
                color: isLight ? "#334155" : "rgba(255, 255, 255, 0.88)",
              }}
            >
              {statusLabel}
            </span>
            <span
              dir="ltr"
              style={{
                fontSize: 12,
                fontWeight: 900,
                color: isLight ? "#0284C7" : "#38BDF8",
              }}
            >
              {progress}%
            </span>
          </div>
          <div
            className="w-full overflow-hidden"
            style={{
              height: 8,
              borderRadius: 999,
              backgroundColor: isLight
                ? "rgba(15, 23, 42, 0.10)"
                : "rgba(255, 255, 255, 0.10)",
            }}
          >
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                borderRadius: 999,
                background:
                  "linear-gradient(90deg, #06B6D4 0%, #38BDF8 55%, #10B981 100%)",
                boxShadow: "0 0 12px rgba(56, 189, 248, 0.5)",
              }}
            />
          </div>
        </div>

        <button
          type="button"
          data-testid="brand-splash-enter-btn"
          onClick={onFinish}
          className="w-full mt-3.5 py-3 px-5 cursor-pointer active:scale-[0.99] transition-transform flex items-center justify-center gap-2"
          style={{
            borderRadius: 16,
            background: "linear-gradient(135deg, #0284C7 0%, #0EA5E9 55%, #10B981 100%)",
            border: "1px solid rgba(255, 255, 255, 0.28)",
            boxShadow: "0 10px 24px -6px rgba(14, 165, 233, 0.45)",
            fontSize: 13,
            fontWeight: 900,
            color: "#FFFFFF",
          }}
        >
          <span>الدخول إلى التطبيق الآن</span>
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   2. TelegramAnnouncementModal — Theme-Aware Executive Community Modal
      Dynamically adapts to Light Theme (أبيض ساطع) and Dark Theme (OLED)
   ══════════════════════════════════════════════════════════════════════════ */
export function TelegramAnnouncementModal({
  visible,
  colors,
  onClose,
  onDismiss,
}: {
  visible: boolean;
  colors?: ThemePalette;
  onClose?: () => void;
  onDismiss?: () => void;
}) {
  const { tv: tvMode } = useTvMetrics();

  if (!visible) return null;

  const isLight =
    colors?.background === "#F8FAFC" || colors?.background === "#FFFFFF";

  const modalBg = isLight ? "#FFFFFF" : colors?.surface || "#0B0F19";
  const modalBorder = isLight
    ? colors?.border || "#E2E8F0"
    : "rgba(255, 255, 255, 0.14)";
  const primaryText = isLight ? "#0F172A" : "#FFFFFF";
  const secondaryText = isLight ? "#334155" : "rgba(255, 255, 255, 0.90)";
  const chipBg = isLight
    ? colors?.input || "#F1F5F9"
    : "rgba(255, 255, 255, 0.05)";
  const chipBorder = isLight
    ? colors?.border || "#E2E8F0"
    : "rgba(255, 255, 255, 0.10)";

  const handleClose = () => {
    if (onClose) onClose();
    if (onDismiss) onDismiss();
  };

  return (
    <div
      dir="rtl"
      data-testid="telegram-announcement-modal"
      className="fixed inset-0 z-[90] flex items-center justify-center select-none nova-anim-fade"
      style={{
        backgroundColor: isLight
          ? "rgba(15, 23, 42, 0.55)"
          : "rgba(4, 6, 12, 0.82)",
        backdropFilter: "blur(12px)",
        paddingLeft: 18,
        paddingRight: 18,
      }}
      onClick={handleClose}
    >
      <div
        data-testid="telegram-modal-card"
        className="w-full relative overflow-hidden"
        style={{
          maxWidth: tvMode ? 520 : 400,
          borderRadius: 28,
          backgroundColor: modalBg,
          border: `1.5px solid ${modalBorder}`,
          boxShadow: isLight
            ? "0 24px 54px -10px rgba(15, 23, 42, 0.22)"
            : "0 28px 65px -10px rgba(0, 0, 0, 0.88), 0 0 32px -10px rgba(255, 255, 255, 0.12)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Video Showcase Banner */}
        <div
          className="relative w-full overflow-hidden"
          style={{
            height: tvMode ? 220 : 185,
            backgroundColor: "#06080E",
          }}
        >
          <video
            src="/assets/jjk-lethal-company-dance.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />

          {/* Cinema Gradient Overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, rgba(11,15,25,0.42) 0%, rgba(11,15,25,0.18) 45%, rgba(11,15,25,0.92) 100%)",
            }}
          />

          {/* Top Bar inside Video: Official Badge + Close Button */}
          <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
            <div
              className="inline-flex items-center gap-1.5"
              style={{
                paddingLeft: 11,
                paddingRight: 11,
                paddingTop: 5,
                paddingBottom: 5,
                borderRadius: 999,
                backgroundColor: isLight
                  ? "rgba(255, 255, 255, 0.92)"
                  : "rgba(11, 15, 25, 0.78)",
                border: isLight
                  ? "1px solid rgba(15, 23, 42, 0.14)"
                  : "1px solid rgba(255, 255, 255, 0.18)",
                backdropFilter: "blur(10px)",
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: "#10B981" }}
              />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: isLight ? "#0F172A" : "#FFFFFF",
                }}
              >
                القناة الرسمية · مجتمع ANIME NOVA
              </span>
            </div>

            <button
              type="button"
              onClick={handleClose}
              aria-label="إغلاق"
              className="flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
              style={{
                width: 34,
                height: 34,
                borderRadius: 999,
                backgroundColor: isLight
                  ? "rgba(255, 255, 255, 0.92)"
                  : "rgba(11, 15, 25, 0.78)",
                border: isLight
                  ? "1px solid rgba(15, 23, 42, 0.14)"
                  : "1px solid rgba(255, 255, 255, 0.18)",
                backdropFilter: "blur(10px)",
              }}
            >
              <X size={17} color={isLight ? "#0F172A" : "#FFFFFF"} />
            </button>
          </div>

          {/* Floating Telegram Emblem at Bottom-Right of Video */}
          <div className="absolute bottom-3 right-4 flex items-center gap-2.5">
            <div
              className="flex items-center justify-center"
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)",
                border: "1.5px solid rgba(255, 255, 255, 0.32)",
                boxShadow: "0 8px 20px rgba(0, 0, 0, 0.5)",
              }}
            >
              <Send size={20} color="#FFFFFF" />
            </div>
            <div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 900,
                  color: "#FFFFFF",
                  lineHeight: "22px",
                }}
              >
                انضم إلى عائلة التطبيق
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: "rgba(255, 255, 255, 0.85)",
                }}
              >
                إشعارات الحلقات الفورية والتحديثات
              </div>
            </div>
          </div>
        </div>

        {/* Theme-Adaptive Body Content */}
        <div
          style={{
            paddingTop: 16,
            paddingBottom: 20,
            paddingLeft: 18,
            paddingRight: 18,
            backgroundColor: modalBg,
          }}
        >
          <p
            className="m-0"
            style={{
              fontSize: tvMode ? 15 : 13,
              lineHeight: tvMode ? "24px" : "21px",
              color: secondaryText,
              textAlign: "right",
              fontWeight: 700,
            }}
          >
            احصل على تنبيهات الحلقات الجديدة فور صدورها، روابط تحميل التحديثات
            المباشرة، ودعم فني سريع عبر قناتنا الرسمية على تلجرام.
          </p>

          {/* Highlights Row */}
          <div className="grid grid-cols-2 gap-2 mt-3.5 mb-4">
            <div
              className="flex items-center gap-2"
              style={{
                padding: "9px 11px",
                borderRadius: 12,
                backgroundColor: chipBg,
                border: `1px solid ${chipBorder}`,
              }}
            >
              <Tv size={15} color={isLight ? "#0284C7" : "#38BDF8"} />
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: primaryText,
                }}
              >
                تنبيهات الحلقات يومياً
              </span>
            </div>
            <div
              className="flex items-center gap-2"
              style={{
                padding: "9px 11px",
                borderRadius: 12,
                backgroundColor: chipBg,
                border: `1px solid ${chipBorder}`,
              }}
            >
              <ShieldCheck size={15} color="#10B981" />
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: primaryText,
                }}
              >
                تحديثات رسمية مباشرة
              </span>
            </div>
          </div>

          {/* Primary & Secondary Action Buttons */}
          <div className="flex flex-col gap-2.5">
            <a
              href={TELEGRAM_CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleClose}
              className="w-full flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] transition-transform no-underline"
              style={{
                height: 46,
                borderRadius: 14,
                background: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)",
                border: "1px solid rgba(255, 255, 255, 0.22)",
                boxShadow: "0 10px 24px -6px rgba(2, 132, 199, 0.45)",
              }}
            >
              <Send size={17} color="#FFFFFF" />
              <span
                style={{
                  color: "#FFFFFF",
                  fontSize: tvMode ? 16 : 14,
                  fontWeight: 900,
                }}
              >
                انضم إلى قناة تلجرام الآن
              </span>
              <ExternalLink size={14} color="#FFFFFF" />
            </a>

            <button
              type="button"
              onClick={handleClose}
              className="w-full flex items-center justify-center cursor-pointer active:scale-[0.99] transition-transform"
              style={{
                height: 42,
                borderRadius: 14,
                backgroundColor: chipBg,
                border: `1px solid ${chipBorder}`,
              }}
            >
              <span
                style={{
                  color: primaryText,
                  fontSize: tvMode ? 15 : 13,
                  fontWeight: 800,
                }}
              >
                متابعة إلى التطبيق
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
