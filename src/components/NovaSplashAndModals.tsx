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
} from "lucide-react";
import { ThemePalette } from "../constants/novaColors";
import { useTvMetrics } from "../utils/tv";

export const TELEGRAM_CHANNEL_URL = "https://t.me/ANIME_N0VA";

/* ══════════════════════════════════════════════════════════════════════════
   1. BrandSplash — Redesigned Luxury Cinema Startup Window
      Keeps "ANIME" in #FFFFFF and "NOVA" in #38BDF8 while all other text is white
   ══════════════════════════════════════════════════════════════════════════ */
export function BrandSplash({ onFinish }: { onFinish: () => void }) {
  const [fadingOut, setFadingOut] = useState(false);
  const [progress, setProgress] = useState(18);

  useEffect(() => {
    const step1 = setTimeout(() => setProgress(54), 350);
    const step2 = setTimeout(() => setProgress(86), 850);
    const step3 = setTimeout(() => setProgress(100), 1350);
    const fadeTimer = setTimeout(() => setFadingOut(true), 1650);
    const doneTimer = setTimeout(() => onFinish(), 2050);
    return () => {
      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(step3);
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onFinish]);

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[100] flex items-center justify-center select-none overflow-hidden transition-opacity duration-400"
      style={{
        opacity: fadingOut ? 0 : 1,
        background:
          "radial-gradient(circle at 50% 24%, rgba(14, 165, 233, 0.18) 0%, rgba(7, 9, 14, 0.96) 52%, #05070B 100%)",
        paddingLeft: 22,
        paddingRight: 22,
      }}
    >
      {/* Ambient Decorative Glows */}
      <div
        className="pointer-events-none absolute rounded-full"
        style={{
          width: 340,
          height: 340,
          top: -90,
          right: -70,
          background:
            "radial-gradient(circle, rgba(56, 189, 248, 0.16) 0%, rgba(56, 189, 248, 0) 70%)",
          filter: "blur(24px)",
        }}
      />
      <div
        className="pointer-events-none absolute rounded-full"
        style={{
          width: 300,
          height: 300,
          bottom: -80,
          left: -60,
          background:
            "radial-gradient(circle, rgba(2, 132, 199, 0.14) 0%, rgba(2, 132, 199, 0) 70%)",
          filter: "blur(24px)",
        }}
      />

      {/* Main Startup Cinema Card */}
      <div
        className="relative w-full flex flex-col items-center nova-anim-fade"
        style={{
          maxWidth: 380,
          borderRadius: 30,
          paddingTop: 32,
          paddingBottom: 26,
          paddingLeft: 24,
          paddingRight: 24,
          background:
            "linear-gradient(180deg, rgba(17, 23, 36, 0.92) 0%, rgba(10, 14, 23, 0.97) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow:
            "0 28px 64px -12px rgba(0, 0, 0, 0.85), 0 0 36px -10px rgba(56, 189, 248, 0.22)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Top Release Pill */}
        <div
          className="inline-flex items-center gap-1.5"
          style={{
            paddingLeft: 12,
            paddingRight: 12,
            paddingTop: 5,
            paddingBottom: 5,
            borderRadius: 999,
            backgroundColor: "rgba(255, 255, 255, 0.07)",
            border: "1px solid rgba(255, 255, 255, 0.14)",
            marginBottom: 20,
          }}
        >
          <Sparkles size={12} color="#FFFFFF" />
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: "#FFFFFF",
              letterSpacing: "0.3px",
            }}
          >
            الإصدار السينمائي · V3.4
          </span>
        </div>

        {/* Official Nova Mobile App Icon (IMG_20261025_020007_932_0a013fb3.jpg) */}
        <div className="relative flex items-center justify-center mb-5">
          <div
            className="absolute rounded-[34px]"
            style={{
              width: 156,
              height: 156,
              background:
                "radial-gradient(circle, rgba(139, 92, 246, 0.38) 0%, rgba(56, 189, 248, 0.18) 50%, rgba(0, 0, 0, 0) 75%)",
              filter: "blur(8px)",
            }}
          />
          <div
            className="relative flex items-center justify-center overflow-hidden"
            style={{
              width: 132,
              height: 132,
              borderRadius: 30,
              backgroundColor: "#06050B",
              border: "1.5px solid rgba(167, 139, 250, 0.45)",
              boxShadow:
                "0 18px 42px rgba(0, 0, 0, 0.82), 0 0 28px rgba(139, 92, 246, 0.32)",
            }}
          >
            <img
              src="/assets/aistudio/IMG_20261025_020007_932_0a013fb3.jpg"
              alt="Anime NOVA Official Icon"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Brand Logo — ONLY "NOVA" stays blue (#38BDF8) per user specification */}
        <div
          dir="ltr"
          className="flex items-center justify-center gap-2"
          style={{
            fontSize: 30,
            fontWeight: 900,
            letterSpacing: "2px",
            lineHeight: "36px",
          }}
        >
          <span style={{ color: "#FFFFFF" }}>ANIME</span>
          <span
            style={{
              color: "#38BDF8",
              textShadow: "0 0 18px rgba(56, 189, 248, 0.45)",
            }}
          >
            NOVA
          </span>
        </div>

        <p
          className="m-0 mt-2 text-center"
          style={{
            fontSize: 13.5,
            fontWeight: 700,
            color: "#FFFFFF",
            opacity: 0.9,
          }}
        >
          منصة الأنمي والمدبلجات العربية الأولى
        </p>

        {/* Feature Capsules */}
        <div
          className="w-full grid grid-cols-3 gap-2"
          style={{ marginTop: 22, marginBottom: 22 }}
        >
          {[
            { icon: Play, label: "بث فوري" },
            { icon: Bookmark, label: "مكتبتك الخاصة" },
            { icon: Download, label: "تحميل مباشر" },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex flex-col items-center justify-center gap-1.5"
                style={{
                  paddingTop: 10,
                  paddingBottom: 10,
                  paddingLeft: 8,
                  paddingRight: 8,
                  borderRadius: 14,
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.10)",
                }}
              >
                <Icon size={15} color="#FFFFFF" />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#FFFFFF",
                    textAlign: "center",
                  }}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Smooth Progress Loader + Skip Button */}
        <div className="w-full flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "rgba(255, 255, 255, 0.85)",
              }}
            >
              جاري تهيئة السيرفرات والمكتبة...
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: "#FFFFFF",
              }}
            >
              {progress}%
            </span>
          </div>
          <div
            className="w-full overflow-hidden"
            style={{
              height: 6,
              borderRadius: 999,
              backgroundColor: "rgba(255, 255, 255, 0.10)",
            }}
          >
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                borderRadius: 999,
                background: "linear-gradient(90deg, #FFFFFF 0%, #38BDF8 100%)",
              }}
            />
          </div>
        </div>

        <button
          onClick={onFinish}
          className="mt-4 cursor-pointer active:scale-95 transition-transform"
          style={{
            paddingLeft: 16,
            paddingRight: 16,
            paddingTop: 6,
            paddingBottom: 6,
            borderRadius: 999,
            backgroundColor: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            fontSize: 11.5,
            fontWeight: 700,
            color: "#FFFFFF",
          }}
        >
          تخطي والدخول الآن
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   2. TelegramAnnouncementModal — Redesigned Executive Community Modal
      All typography is crisp white (#FFFFFF) with cinema video preview
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

  const handleClose = () => {
    if (onClose) onClose();
    if (onDismiss) onDismiss();
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[90] flex items-center justify-center select-none nova-anim-fade"
      style={{
        backgroundColor: "rgba(4, 6, 12, 0.82)",
        backdropFilter: "blur(12px)",
        paddingLeft: 18,
        paddingRight: 18,
      }}
      onClick={handleClose}
    >
      <div
        className="w-full relative overflow-hidden"
        style={{
          maxWidth: tvMode ? 520 : 390,
          borderRadius: 28,
          backgroundColor: "#0B0F19",
          border: "1px solid rgba(255, 255, 255, 0.14)",
          boxShadow:
            "0 28px 65px -10px rgba(0, 0, 0, 0.88), 0 0 32px -10px rgba(255, 255, 255, 0.12)",
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
                "linear-gradient(180deg, rgba(11,15,25,0.45) 0%, rgba(11,15,25,0.15) 45%, rgba(11,15,25,0.98) 100%)",
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
                backgroundColor: "rgba(11, 15, 25, 0.78)",
                border: "1px solid rgba(255, 255, 255, 0.18)",
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
                  color: "#FFFFFF",
                }}
              >
                القناة الرسمية · مجتمع ANIME NOVA
              </span>
            </div>

            <button
              onClick={handleClose}
              aria-label="إغلاق"
              className="flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
              style={{
                width: 34,
                height: 34,
                borderRadius: 999,
                backgroundColor: "rgba(11, 15, 25, 0.78)",
                border: "1px solid rgba(255, 255, 255, 0.18)",
                backdropFilter: "blur(10px)",
              }}
            >
              <X size={17} color="#FFFFFF" />
            </button>
          </div>

          {/* Floating Telegram Emblem at Bottom-Right of Video */}
          <div
            className="absolute bottom-3 right-4 flex items-center gap-2.5"
          >
            <div
              className="flex items-center justify-center"
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background:
                  "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)",
                border: "1.5px solid rgba(255, 255, 255, 0.28)",
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
                  color: "rgba(255, 255, 255, 0.8)",
                }}
              >
                إشعارات الحلقات الفورية والتحديثات
              </div>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div
          style={{
            paddingTop: 14,
            paddingBottom: 20,
            paddingLeft: 18,
            paddingRight: 18,
          }}
        >
          <p
            className="m-0"
            style={{
              fontSize: tvMode ? 15 : 13,
              lineHeight: tvMode ? "24px" : "21px",
              color: "#FFFFFF",
              opacity: 0.92,
              textAlign: "right",
              fontWeight: 600,
            }}
          >
            احصل على تنبيهات الحلقات الجديدة فور صدورها، روابط تحميل التحديثات المباشرة، ودعم فني سريع عبر قناتنا الرسمية على تلجرام.
          </p>

          {/* Highlights Row */}
          <div className="grid grid-cols-2 gap-2 mt-3.5 mb-4">
            <div
              className="flex items-center gap-2"
              style={{
                padding: "9px 11px",
                borderRadius: 12,
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.10)",
              }}
            >
              <Tv size={15} color="#FFFFFF" />
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: "#FFFFFF",
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
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.10)",
              }}
            >
              <ShieldCheck size={15} color="#FFFFFF" />
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 800,
                  color: "#FFFFFF",
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
                background:
                  "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)",
                border: "1px solid rgba(255, 255, 255, 0.22)",
                boxShadow: "0 10px 24px -6px rgba(2, 132, 199, 0.55)",
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
              onClick={handleClose}
              className="w-full flex items-center justify-center cursor-pointer active:scale-[0.99] transition-transform"
              style={{
                height: 42,
                borderRadius: 14,
                backgroundColor: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
              }}
            >
              <span
                style={{
                  color: "#FFFFFF",
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
