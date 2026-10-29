import {
  Anime,
  AwDubbedSeries,
  DubbedSeries,
  StardimaSeries,
} from '../types/anime';

// Royalty-free HD video stream samples for testing playback
const SAMPLE_STREAM_1 = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
const SAMPLE_STREAM_2 = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4';
const SAMPLE_STREAM_3 = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
const SAMPLE_STREAM_4 = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4';

// Exact 1:1 YouTube ID extractor from artifacts/nova-mobile/utils/youtube.ts
const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/;

export function extractYoutubeId(raw?: string | null): string | null {
  const value = String(raw || '').trim();
  if (!value) return null;
  if (YOUTUBE_ID_RE.test(value)) return value;
  const patterns = [
    /[?&]v=([A-Za-z0-9_-]{11})/i,
    /youtu\.be\/([A-Za-z0-9_-]{11})/i,
    /youtube(?:-nocookie)?\.com\/embed\/([A-Za-z0-9_-]{11})/i,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/i,
  ];
  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match?.[1] && YOUTUBE_ID_RE.test(match[1])) {
      return match[1];
    }
  }
  return null;
}

export function getYoutubeThumbUrl(ytId?: string | null): string | null {
  const clean = extractYoutubeId(ytId);
  return clean ? `https://img.youtube.com/vi/${clean}/hqdefault.jpg` : null;
}

export const ANIME_DATABASE: Anime[] = [
  {
    id: 'one-punch-man',
    anilistId: 21087,
    title: 'One-Punch Man',
    titleAr: 'ون بنش مان',
    titleJp: 'ワンパンマン',
    synopsis: 'The seemingly ordinary and unimpressive Saitama has a rather unique hobby: being a hero. In order to pursue his childhood dream, he trained relentlessly for three years and lost all of his hair in the process. Now, Saitama is all-powerful, so much so that no enemy is able to defeat him in battle. In fact, all it takes to defeat evildoers is just one punch.',
    synopsisAr: 'سايتاما شاب يبدو عادياً تماماً ولكنه يمتلك هواية فريدة: أن يكون بطلاً خارقاً! بعد تدريب شاق لثلاث سنوات خسر فيه كل شعره، أصبح يتمتع بقوة مطلقة تهزم أي شرير بضربة واحدة فقط، مما يجعله يبحث باستمرار عن خصم قوي يعيد إليه شغف القتال.',
    score: 8.5,
    year: 2015,
    status: 'Completed',
    statusAr: 'مكتمل',
    genres: ['Action', 'Comedy', 'Sci-Fi', 'Super Power'],
    genresAr: ['أكشن', 'كوميديا', 'خيال علمي', 'قوى خارقة'],
    episodesCount: 12,
    durationPerEp: '24 دقيقة',
    format: 'TV',
    coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21087-B5DHjqZ3kW4b.jpg',
    bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/21087-sHb9zUZFsHe1.jpg',
    bannerColor: 'from-amber-950 via-red-950 to-black',
    posterBg: 'linear-gradient(135deg, #1f0f0a 0%, #170d10 50%, #050508 100%)',
    accentColor: '#ef4444',
    rating: '16+',
    studio: 'Madhouse',
    featured: true,
    progress: 0.65,
    badge: 'الأكثر طلباً',
    trailerYtId: 'Poo5lqoWSGw',
    episodes: [
      {
        id: 'opm-ep-1',
        number: 1,
        title: 'The Strongest Man',
        titleAr: 'الحلقة 1: أقوى رجل',
        duration: '24:12',
        videoUrl: SAMPLE_STREAM_1,
        thumbnail: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21087-B5DHjqZ3kW4b.jpg',
        synopsis: 'Saitama defeats a giant monster with a single punch and reminisces about how he became a hero.',
        synopsisAr: 'يهزم سايتاما وحشاً عملاقاً بضربة واحدة ويتذكر بداياته وكيف قرر أن يصبح بطلاً.'
      },
      {
        id: 'opm-ep-2',
        number: 2,
        title: 'The Lone Cyborg',
        titleAr: 'الحلقة 2: السايبورغ الوحيد',
        duration: '24:08',
        videoUrl: SAMPLE_STREAM_2,
        thumbnail: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21087-B5DHjqZ3kW4b.jpg',
        synopsis: 'A cyborg named Genos witnesses Saitama\'s incredible power and begs to become his disciple.',
        synopsisAr: 'يشهد السايبورغ جينوس القوة الهائلة لسايتاما ويتوسل إليه ليكون تلميذه.'
      },
      {
        id: 'opm-ep-3',
        number: 3,
        title: 'The Obsessive Scientist',
        titleAr: 'الحلقة 3: العالم المهووس',
        duration: '24:05',
        videoUrl: SAMPLE_STREAM_3,
        thumbnail: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21087-B5DHjqZ3kW4b.jpg',
        synopsis: 'Genos and Saitama face the House of Evolution and its ultimate combat creation, Carnage Kabuto.',
        synopsisAr: 'يواجه سايتاما وجينوس بيت التطور ومقاتلهم الأقوى كارناج كابوتو في معركة حاسمة.'
      }
    ],
    characters: [
      { name: 'Saitama', nameAr: 'سايتاما', role: 'Main Protagonist', roleAr: 'البطل', imageUrl: '' },
      { name: 'Genos', nameAr: 'جينوس', role: 'Disciple / Cyborg', roleAr: 'التلميذ', imageUrl: '' },
      { name: 'Tatsumaki', nameAr: 'تاتسوماكي', role: 'S-Class Hero', roleAr: 'بطلة الرتبة S', imageUrl: '' }
    ]
  },
  {
    id: 'solo-leveling',
    anilistId: 151807,
    title: 'Solo Leveling',
    titleAr: 'سولو ليفلينغ (الارتقاء المنفرد)',
    titleJp: '俺だけレベルアップな件',
    synopsis: 'In a world where hunters must battle deadly monsters to protect humanity, Sung Jinwoo, notoriously known as the weakest hunter of all mankind, finds himself in a mysterious double dungeon that changes his destiny forever.',
    synopsisAr: 'في عالم يواجه فيه الصيادون وحوشاً فتاكة لحماية البشرية، يجد سونغ جينوو، الملقب بأضعف صياد في البشرية، نفسه داخل زنزانة مزدوجة غامضة تمنحه نظاماً سرياً يتيح له رفع مستواه دون حدود.',
    score: 8.9,
    year: 2024,
    status: 'Airing',
    statusAr: 'مستمر',
    genres: ['Action', 'Fantasy', 'Supernatural'],
    genresAr: ['أكشن', 'فانتازيا', 'خارق للطبيعة'],
    episodesCount: 12,
    durationPerEp: '24 دقيقة',
    format: 'TV',
    coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151807-it355ZgzquUd.png',
    bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/151807-37yfQA3ym8PA.jpg',
    bannerColor: 'from-blue-950 via-slate-900 to-black',
    posterBg: 'linear-gradient(135deg, #091a3c 0%, #1e1035 50%, #050508 100%)',
    accentColor: '#3b82f6',
    rating: '16+',
    studio: 'A-1 Pictures',
    featured: true,
    progress: 0.4,
    badge: 'جديد',
    trailerYtId: 'bssSj4cKsrI',
    episodes: [
      {
        id: 'sl-ep-1',
        number: 1,
        title: 'I\'m Used to It',
        titleAr: 'الحلقة 1: لقد اعتدت على ذلك',
        duration: '23:45',
        videoUrl: SAMPLE_STREAM_1,
        thumbnail: 'https://img.anili.st/media/151807',
        synopsis: 'Jinwoo enters an E-rank dungeon with his party, but stumbles upon an ominous hidden gate.',
        synopsisAr: 'يدخل جينوو زنزانة من الرتبة E مع فريقه، لكنهم يعثرون على بوابة خفية غامضة تقودهم لمصير مجهول.'
      },
      {
        id: 'sl-ep-2',
        number: 2,
        title: 'If I Had One More Chance',
        titleAr: 'الحلقة 2: لو أتيحت لي فرصة أخرى',
        duration: '24:10',
        videoUrl: SAMPLE_STREAM_2,
        thumbnail: 'https://img.anili.st/media/151807',
        synopsis: 'Facing slaughter by giant stone statues, Jinwoo deciphers the temple commandments.',
        synopsisAr: 'في مواجهة التماثيل الحجرية العملاقة، يكتشف جينوو وصايا المعبد في محاولة يائسة للنجاة.'
      },
      {
        id: 'sl-ep-3',
        number: 3,
        title: 'It\'s Like a Game',
        titleAr: 'الحلقة 3: إنه يشبه لعبة فيديو',
        duration: '23:55',
        videoUrl: SAMPLE_STREAM_3,
        thumbnail: 'https://img.anili.st/media/151807',
        synopsis: 'Awakening in a hospital bed, Jinwoo sees a floating quest log visible only to him.',
        synopsisAr: 'يستيقظ جينوو في المشفى ليرى شاشة مهام عائمة أمامه، ويبدأ رحلة تدريب غير مسبوقة.'
      }
    ],
    characters: [
      { name: 'Sung Jinwoo', nameAr: 'سونغ جينوو', role: 'Main Protagonist', roleAr: 'البطل الرئيسي', imageUrl: '' },
      { name: 'Cha Hae-in', nameAr: 'تشا هاي إن', role: 'S-Rank Hunter', roleAr: 'صيادة رتبة S', imageUrl: '' },
      { name: 'Go Gunhee', nameAr: 'غو غونهي', role: 'Chairman', roleAr: 'رئيس جمعية الصيادين', imageUrl: '' }
    ]
  },
  {
    id: 'jujutsu-kaisen',
    anilistId: 113415,
    title: 'Jujutsu Kaisen',
    titleAr: 'جوجوتسو كايسن',
    titleJp: '呪術廻戦',
    synopsis: 'A boy swallows a cursed talisman - the finger of a demon - and becomes cursed himself. He enters a shaman\'s school to be able to locate the demon\'s other body parts and thus exorcise himself.',
    synopsisAr: 'يولج يوجي إيتادوري عالم اللعنات بعد أن ابتلع إصبع الملك الشرير ريومن سوكونا، وينضم إلى ثانوية الجوجوتسو لجمع بقية الأصابع وتطهير اللعنات وإنقاذ رفاقه.',
    score: 8.7,
    year: 2020,
    status: 'Completed',
    statusAr: 'مكتمل',
    genres: ['Action', 'Fantasy', 'Supernatural'],
    genresAr: ['أكشن', 'فانتازيا', 'خارق للطبيعة'],
    episodesCount: 24,
    durationPerEp: '24 دقيقة',
    format: 'TV',
    coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-LHBAeoZDIsnF.jpg',
    bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/113415-jQBSkxWAAk83.jpg',
    bannerColor: 'from-purple-950 via-neutral-900 to-black',
    posterBg: 'linear-gradient(135deg, #1b0a2a 0%, #110d18 50%, #050508 100%)',
    accentColor: '#8b5cf6',
    rating: '16+',
    studio: 'MAPPA',
    featured: true,
    badge: 'شائع',
    trailerYtId: '4A_X-Dvl0ws',
    episodes: [
      {
        id: 'jjk-ep-1',
        number: 1,
        title: 'Ryomen Sukuna',
        titleAr: 'الحلقة 1: ريومن سوكونا',
        duration: '24:00',
        videoUrl: SAMPLE_STREAM_1,
        thumbnail: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-LHBAeoZDIsnF.jpg',
        synopsis: 'Yuji swallows a cursed finger to save his club members from horrific curses.',
        synopsisAr: 'يبتلع يوجي إصبع اللعنة لحماية أصدقائه من الكائنات الملعونة.'
      }
    ],
    characters: [
      { name: 'Yuji Itadori', nameAr: 'يوجي إيتادوري', role: 'Main Protagonist', roleAr: 'البطل', imageUrl: '' },
      { name: 'Satoru Gojo', nameAr: 'ساتورو غوجو', role: 'Strongest Sorcerer', roleAr: 'المعلم الأقوى', imageUrl: '' },
      { name: 'Ryomen Sukuna', nameAr: 'ريومن سوكونا', role: 'King of Curses', roleAr: 'ملك اللعنات', imageUrl: '' }
    ]
  },
  {
    id: 'attack-on-titan',
    anilistId: 16498,
    title: 'Attack on Titan',
    titleAr: 'هجوم العمالقة (شينغيكي نو كيوجين)',
    titleJp: '進撃の巨人',
    synopsis: 'After his hometown is destroyed and his mother is killed, young Eren Jaeger vows to cleanse the earth of the giant humanoid Titans that have brought humanity to the brink of extinction.',
    synopsisAr: 'بعد تدمير مدينته ومقتل والدته، يقسم إيرين ييغر على تطهير الأرض من العمالقة الآكلين للبشر، وينضم إلى فيلق الاستطلاع لكشف أسرار العالم خلف الأسوار.',
    score: 9.1,
    year: 2023,
    status: 'Completed',
    statusAr: 'مكتمل',
    genres: ['Action', 'Drama', 'Mystery'],
    genresAr: ['أكشن', 'دراما', 'غموض'],
    episodesCount: 89,
    durationPerEp: '24 دقيقة',
    format: 'TV',
    coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-buvcRTBx4NSm.jpg',
    bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/16498-8jpFCOcDmneX.jpg',
    bannerColor: 'from-amber-950 via-stone-900 to-black',
    posterBg: 'linear-gradient(135deg, #2b1108 0%, #17110c 60%, #070707 100%)',
    accentColor: '#f97316',
    rating: '18+',
    studio: 'MAPPA / Wit Studio',
    featured: true,
    progress: 0.85,
    trailerYtId: 'MGRm4IzK1SQ',
    episodes: [
      {
        id: 'aot-ep-1',
        number: 1,
        title: 'To You, in 2000 Years',
        titleAr: 'الحلقة 1: إليك بعد 2000 عام',
        duration: '24:20',
        videoUrl: SAMPLE_STREAM_4,
        thumbnail: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-buvcRTBx4NSm.jpg',
        synopsis: 'The Colossal Titan smashes through Wall Maria, shattering 100 years of peaceful isolation.',
        synopsisAr: 'يحطم العملاق الهائل جدار ماريا لينهي قرناً من السلام الوهمي خلف الأسوار.'
      }
    ],
    characters: [
      { name: 'Eren Jaeger', nameAr: 'إيرين ييغر', role: 'Main Protagonist', roleAr: 'البطل', imageUrl: '' },
      { name: 'Mikasa Ackerman', nameAr: 'ميكاسا أكرمان', role: 'Soldier', roleAr: 'مقاتلة النخبة', imageUrl: '' },
      { name: 'Levi Ackerman', nameAr: 'ليفاي أكرمان', role: 'Captain', roleAr: 'القائد ليفاي', imageUrl: '' }
    ]
  },
  {
    id: 'demon-slayer',
    anilistId: 101922,
    title: 'Demon Slayer: Kimetsu no Yaiba',
    titleAr: 'قاتل الشياطين (كيميتسو نو يايبا)',
    titleJp: '鬼滅の刃',
    synopsis: 'Tanjiro Kamado sets out on a perilous journey to become a demon slayer to avenge his slaughtered family and find a cure to turn his demonized sister Nezuko back into a human.',
    synopsisAr: 'ينطلق تانجيرو كامادو في رحلة ملحمية ليصبح قاتلاً للشياطين بعد مقتل عائلته وتحول شقيقته نيزوكو إلى شيطانة، ساعياً لإعادتها إنسانية وهزيمة موزان كيبوتسوجي.',
    score: 8.9,
    year: 2024,
    status: 'Completed',
    statusAr: 'مكتمل',
    genres: ['Action', 'Fantasy', 'Historical'],
    genresAr: ['أكشن', 'فانتازيا', 'تاريخي'],
    episodesCount: 55,
    durationPerEp: '24 دقيقة',
    format: 'TV',
    coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-WBsBl0ClmgYL.jpg',
    bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/101922-YfZhKBUDDS6L.jpg',
    bannerColor: 'from-teal-950 via-slate-900 to-black',
    posterBg: 'linear-gradient(135deg, #092520 0%, #111e1c 50%, #060908 100%)',
    accentColor: '#14b8a6',
    rating: '16+',
    studio: 'ufotable',
    featured: true,
    badge: 'الأعلى تقييماً',
    trailerYtId: 'VQGCKyvzIM4',
    episodes: [
      {
        id: 'ds-ep-1',
        number: 1,
        title: 'Cruelty',
        titleAr: 'الحلقة 1: القسوة',
        duration: '23:40',
        videoUrl: SAMPLE_STREAM_2,
        thumbnail: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-WBsBl0ClmgYL.jpg',
        synopsis: 'Tanjiro returns home from town to find his family slaughtered by demons.',
        synopsisAr: 'يعود تانجيرو إلى منزله ليجد عائلته قد تعرضت لهجوم مأساوي من الشياطين.'
      }
    ],
    characters: [
      { name: 'Tanjiro Kamado', nameAr: 'تانجيرو كامادو', role: 'Main Protagonist', roleAr: 'البطل', imageUrl: '' },
      { name: 'Nezuko Kamado', nameAr: 'نيزوكو كامادو', role: 'Sister', roleAr: 'الأخت', imageUrl: '' },
      { name: 'Zenitsu Agatsuma', nameAr: 'زينيتسو أغاتسوما', role: 'Thunder Slayer', roleAr: 'سياف البرق', imageUrl: '' }
    ]
  },
  {
    id: 'frieren',
    anilistId: 154587,
    title: 'Frieren: Beyond Journey\'s End',
    titleAr: 'فريرين: بعد نهاية الرحلة',
    titleJp: '葬送のフリーレン',
    synopsis: 'An elven mage and her fellow adventurers have defeated the Demon King and brought peace to the land. But after the quest ends, Frieren must face the passage of time as her mortal companions age and die, embarking on a new quest to understand humanity.',
    synopsisAr: 'تهزم الساحرة الآلفية فريرين ورفاقها ملك الشياطين ويعم السلام. ولكن مع مرور العقود وفناء رفاقها البشر بسبب قصر أعمارهم، تبدأ فريرين رحلة استكشافية جديدة لتفهم معنى الحياة ومشاعر البشر.',
    score: 9.3,
    year: 2024,
    status: 'Completed',
    statusAr: 'مكتمل',
    genres: ['Adventure', 'Drama', 'Fantasy'],
    genresAr: ['مغامرة', 'دراما', 'فانتازيا'],
    episodesCount: 28,
    durationPerEp: '24 دقيقة',
    format: 'TV',
    coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-gHSraOSa0nBG.jpg',
    bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/154587-ivXNJ23SM1xB.jpg',
    bannerColor: 'from-sky-950 via-slate-900 to-black',
    posterBg: 'linear-gradient(135deg, #0d2232 0%, #151d27 50%, #06090e 100%)',
    accentColor: '#38bdf8',
    rating: '13+',
    studio: 'Madhouse',
    featured: true,
    badge: 'الأعلى تقييماً',
    trailerYtId: 'Iwr1aLEDpe4',
    episodes: [
      {
        id: 'fri-ep-1',
        number: 1,
        title: 'The Journey\'s End',
        titleAr: 'الحلقة 1: نهاية الرحلة',
        duration: '24:00',
        videoUrl: SAMPLE_STREAM_3,
        thumbnail: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-gHSraOSa0nBG.jpg',
        synopsis: 'The Hero Party returns victorious after a 10-year quest to vanquish the Demon King.',
        synopsisAr: 'يعود فريق الأبطال منتصراً بعد رحلة استمرت عشر سنوات لهزيمة ملك الشياطين.'
      }
    ],
    characters: [
      { name: 'Frieren', nameAr: 'فريرين', role: 'Mage', roleAr: 'الساحرة الآلفية', imageUrl: '' },
      { name: 'Fern', nameAr: 'فيرن', role: 'Apprentice', roleAr: 'التلميذة', imageUrl: '' },
      { name: 'Stark', nameAr: 'ستارك', role: 'Warrior', roleAr: 'المحارب', imageUrl: '' }
    ]
  },
  {
    id: 'bleach-tybw',
    anilistId: 114446,
    title: 'Bleach: Thousand-Year Blood War',
    titleAr: 'بليتش: حرب الألف عام الدموية',
    titleJp: 'BLEACH 千年血戦篇',
    synopsis: 'The peace is suddenly broken when warning sirens blare through the Soul Society. Residents are disappearing without a trace and nobody knows who is behind it. Meanwhile, a dark shadow is also extending itself toward Ichigo and his friends in Karakura Town.',
    synopsisAr: 'تدوي صفارات الإنذار في مجتمع الأرواح إثر هجوم مفاجئ من إمبراطور الكوينشي يوهاباخ وجيش الفاندنرايخ، مما يستدعي إيتشيغو كوروساكي لحماية عالم الأرواح وعالم الأحياء.',
    score: 9.0,
    year: 2024,
    status: 'Airing',
    statusAr: 'مستمر',
    genres: ['Action', 'Adventure', 'Supernatural'],
    genresAr: ['أكشن', 'مغامرة', 'خارق للطبيعة'],
    episodesCount: 26,
    durationPerEp: '24 دقيقة',
    format: 'TV',
    coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-buvcRTBx4NSm.jpg',
    bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/114446-DTd4xfGx7DJB.jpg',
    bannerColor: 'from-orange-950 via-neutral-900 to-black',
    posterBg: 'linear-gradient(135deg, #2b1104 0%, #17110d 50%, #060505 100%)',
    accentColor: '#ea580c',
    rating: '16+',
    studio: 'Pierrot',
    featured: true,
    badge: 'جديد',
    trailerYtId: 'e8YBesRKq_U',
    episodes: [
      {
        id: 'bl-ep-1',
        number: 1,
        title: 'The Blood Warfare',
        titleAr: 'الحلقة 1: الحرب الدموية',
        duration: '24:15',
        videoUrl: SAMPLE_STREAM_1,
        thumbnail: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-buvcRTBx4NSm.jpg',
        synopsis: 'Substitute Soul Reaper Ichigo Kurosaki responds to a sudden hollow surge in Karakura Town.',
        synopsisAr: 'يستجيب حاصد الأرواح البديل إيتشيغو لاضطراب مفاجئ للهولو في مدينة كاراكورا.'
      }
    ],
    characters: [
      { name: 'Ichigo Kurosaki', nameAr: 'إيتشيغو كوروساكي', role: 'Substitute Shinigami', roleAr: 'البطل', imageUrl: '' },
      { name: 'Rukia Kuchiki', nameAr: 'روكيا كوتشيكي', role: 'Shinigami', roleAr: 'حاصدة أرواح', imageUrl: '' },
      { name: 'Yhwach', nameAr: 'يوهاباخ', role: 'Quincy King', roleAr: 'ملك الكوينشي', imageUrl: '' }
    ]
  },
  {
    id: 'detective-conan',
    anilistId: 235,
    title: 'Detective Conan',
    titleAr: 'المحقق كونان',
    titleJp: '名探偵コナン',
    synopsis: 'High school detective Shinichi Kudo is transformed into a child by a mysterious criminal organization. Adopting the alias Conan Edogawa, he solves countless cases while seeking the antidote.',
    synopsisAr: 'يتحول المحقق الشاب شينيتشي كودو إلى طفل صغير بعد إجباره على تناول عقار سام من منظمة المعاطف السوداء. يتنكر تحت اسم كونان إيدوغاوا لحل القضايا وكشف أسرار المنظمة.',
    score: 8.3,
    year: 1996,
    status: 'Airing',
    statusAr: 'مستمر',
    genres: ['Mystery', 'Comedy', 'Police'],
    genresAr: ['غموض', 'كوميديا', 'بوليسي', 'مدبلج'],
    episodesCount: 1100,
    durationPerEp: '24 دقيقة',
    format: 'TV',
    coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx235-MyYT7K3chBdO.jpg',
    bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/235-MTmiz0uB0fMd.jpg',
    bannerColor: 'from-blue-950 via-indigo-950 to-black',
    posterBg: 'linear-gradient(135deg, #0d1e3a 0%, #111422 50%, #06060a 100%)',
    accentColor: '#2563eb',
    rating: 'All',
    studio: 'TMS Entertainment',
    featured: false,
    provider: 'spacetoon',
    badge: 'مدبلج',
    trailerYtId: 'JofxV0ehN2s',
    episodes: [
      {
        id: 'dc-ep-1',
        number: 1,
        title: 'Roller Coaster Murder',
        titleAr: 'الحلقة 1: جريمة قطار الملاهي',
        duration: '24:00',
        videoUrl: SAMPLE_STREAM_4,
        thumbnail: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx235-MyYT7K3chBdO.jpg',
        synopsis: 'Shinichi solves a murder on a rollercoaster and notices suspicious men in black.',
        synopsisAr: 'يحل شينيتشي جريمة مروعة على متن قطار الملاهي ويرصد أعضاء العصابة السوداء.'
      }
    ],
    characters: [
      { name: 'Conan Edogawa', nameAr: 'كونان إيدوغاوا', role: 'Detective', roleAr: 'المحقق الذكي', imageUrl: '' },
      { name: 'Ran Mouri', nameAr: 'ران موري', role: 'Friend', roleAr: 'ران', imageUrl: '' },
      { name: 'Kogoro Mouri', nameAr: 'توغو موري', role: 'Private Investigator', roleAr: 'المحقق توغو', imageUrl: '' }
    ]
  },
  {
    id: 'hunter-x-hunter',
    anilistId: 11061,
    title: 'Hunter x Hunter (2011)',
    titleAr: 'القناص (هنتر x هنتر)',
    titleJp: 'HUNTER×HUNTER',
    synopsis: 'Gon Freecss aspires to become a Hunter, an exceptional being capable of greatness. With his friends Killua, Kurapika and Leorio, Gon embarks on a dangerous journey to find his father Ging.',
    synopsisAr: 'يطمح غون فريكس لأن يصبح صياداً محترفاً للبحث عن والده جينغ، وينطلق برفقة أصدقائه كيلوا وكورابيكا وليوريو في اختبارات ملحمية ومغامرات تحبس الأنفاس.',
    score: 9.0,
    year: 2011,
    status: 'Completed',
    statusAr: 'مكتمل',
    genres: ['Action', 'Adventure', 'Fantasy'],
    genresAr: ['أكشن', 'مغامرة', 'فانتازيا', 'مدبلج'],
    episodesCount: 148,
    durationPerEp: '24 دقيقة',
    format: 'TV',
    coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx11061-sIpBprNRfzCe.png',
    bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/11061-8WkkTZ6duKpq.jpg',
    bannerColor: 'from-emerald-950 via-slate-900 to-black',
    posterBg: 'linear-gradient(135deg, #09281a 0%, #101c18 50%, #060907 100%)',
    accentColor: '#10b981',
    rating: '13+',
    studio: 'Madhouse',
    featured: false,
    provider: 'spacetoon',
    badge: 'مدبلج',
    trailerYtId: 'd6kBeJjTGnY',
    episodes: [
      {
        id: 'hxh-ep-1',
        number: 1,
        title: 'Departure x And x Friends',
        titleAr: 'الحلقة 1: رحيل x و x رفاق',
        duration: '23:50',
        videoUrl: SAMPLE_STREAM_1,
        thumbnail: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx11061-sIpBprNRfzCe.png',
        synopsis: 'Gon leaves Whale Island to participate in the arduous Hunter Examination.',
        synopsisAr: 'يغادر غون جزيرة الحوت متجهاً نحو اختبار الصيادين الصارم.'
      }
    ],
    characters: [
      { name: 'Gon Freecss', nameAr: 'غون فريكس', role: 'Hunter', roleAr: 'غون', imageUrl: '' },
      { name: 'Killua Zoldyck', nameAr: 'كيلوا زولديك', role: 'Assassin / Friend', roleAr: 'كيلوا', imageUrl: '' },
      { name: 'Kurapika', nameAr: 'كورابيكا', role: 'Avenger', roleAr: 'كورابيكا', imageUrl: '' }
    ]
  },
  {
    id: 'dragon-ball-z',
    anilistId: 813,
    title: 'Dragon Ball Z',
    titleAr: 'دراغون بول زد',
    titleJp: 'ドラゴンボールZ',
    synopsis: 'Goku and the Z-Fighters defend Earth against powerful extraterrestrial villains and gods.',
    synopsisAr: 'يخوض غوكو ومحاربو الزد معارك أسطورية لحماية الأرض والكون من الغزاة الفضائيين وشرور فريزا وسيل وبو.',
    score: 8.3,
    year: 1989,
    status: 'Completed',
    statusAr: 'مكتمل',
    genres: ['Action', 'Adventure', 'Fantasy'],
    genresAr: ['أكشن', 'مغامرة', 'خيال علمي', 'مدبلج'],
    episodesCount: 291,
    durationPerEp: '24 دقيقة',
    format: 'TV',
    coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx813-ZhnFNOeCU5dQ.png',
    bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/813-03ZLvWJgR6Wd.jpg',
    bannerColor: 'from-amber-950 via-orange-950 to-black',
    posterBg: 'linear-gradient(135deg, #2b1704 0%, #1c1108 50%, #070503 100%)',
    accentColor: '#f59e0b',
    rating: '12+',
    studio: 'Toei Animation',
    featured: false,
    provider: 'spacetoon',
    badge: 'سبيستون',
    trailerYtId: 'sxufB6DxXk0',
    episodes: [
      {
        id: 'dbz-ep-1',
        number: 1,
        title: 'The New Threat',
        titleAr: 'الحلقة 1: الخطر الجديد',
        duration: '24:00',
        videoUrl: SAMPLE_STREAM_2,
        thumbnail: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx813-ZhnFNOeCU5dQ.png',
        synopsis: 'A mysterious Saiyan named Raditz arrives on Earth seeking his brother Kakarot.',
        synopsisAr: 'يصل راديتز إلى الأرض كاشفاً سر أصل غوكو الساياني الحقيقي.'
      }
    ],
    characters: [
      { name: 'Goku', nameAr: 'غوكو', role: 'Saiyan Warrior', roleAr: 'غوكو', imageUrl: '' },
      { name: 'Vegeta', nameAr: 'فيجيتا', role: 'Saiyan Prince', roleAr: 'أمير السايان', imageUrl: '' },
      { name: 'Gohan', nameAr: 'غوهان', role: 'Son of Goku', roleAr: 'غوهان', imageUrl: '' }
    ]
  },
  {
    id: 'adnan-wa-lina',
    anilistId: 3083,
    title: 'Future Boy Conan (Adnan & Lina)',
    titleAr: 'عدنان ولينا (مغامرات الفتى كنان)',
    titleJp: '未来少年コナン',
    synopsis: 'In a post-apocalyptic Earth devastated by tectonic weapons, the resilient boy Conan journeys across island ruins to rescue the telepathic girl Lana from the despotic regime of Industria.',
    synopsisAr: 'في عالم ما بعد الحرب العالمية، ينطلق الفتى الشجاع عدنان في مغامرة بحرية لإنقاذ الفتاة لينا من قبضة قلعة الأمل وإعادة السلام والحياة الطبيعية للأرض.',
    score: 8.6,
    year: 1978,
    status: 'Completed',
    statusAr: 'مكتمل',
    genres: ['Adventure', 'Drama', 'Sci-Fi'],
    genresAr: ['مغامرة', 'دراما', 'خيال علمي', 'مدبلج'],
    episodesCount: 26,
    durationPerEp: '24 دقيقة',
    format: 'TV',
    coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-ELSYx3yMPcKM.jpg',
    bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/21-wf37VakJmZqs.jpg',
    bannerColor: 'from-cyan-950 via-slate-900 to-black',
    posterBg: 'linear-gradient(135deg, #092329 0%, #101a1c 50%, #06090a 100%)',
    accentColor: '#06b6d4',
    rating: 'All',
    studio: 'Nippon Animation / Hayao Miyazaki',
    featured: false,
    provider: 'spacetoon',
    badge: 'سبيستون زمان',
    trailerYtId: '5xqEp7R9SYM',
    episodes: [
      {
        id: 'al-ep-1',
        number: 1,
        title: 'Remnant Island',
        titleAr: 'الحلقة 1: الجزيرة المفقودة',
        duration: '24:00',
        videoUrl: SAMPLE_STREAM_3,
        thumbnail: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-ELSYx3yMPcKM.jpg',
        synopsis: 'Conan and his grandfather find a girl washed ashore on their isolated island.',
        synopsisAr: 'يعثر عدنان وجده على الفتاة لينا مغشياً عليها على شاطئ الجزيرة النائية.'
      }
    ],
    characters: [
      { name: 'Conan (Adnan)', nameAr: 'عدنان', role: 'Main Protagonist', roleAr: 'عدنان', imageUrl: '' },
      { name: 'Lana (Lina)', nameAr: 'لينا', role: 'Friend', roleAr: 'لينا', imageUrl: '' },
      { name: 'Jimsy (Abssi)', nameAr: 'عبسي', role: 'Loyal Companion', roleAr: 'عبسي', imageUrl: '' }
    ]
  },
  {
    id: 'captain-tsubasa',
    anilistId: 2116,
    title: 'Captain Tsubasa (Captain Majed)',
    titleAr: 'كابتن ماجد (كابتن تسوباسا)',
    titleJp: 'キャプテン翼',
    synopsis: 'The passion and legendary journey of young football prodigy Tsubasa Oozora to lead his team to the national tournament and the World Cup.',
    synopsisAr: 'الرحلة الأسطورية والشغف الاستثنائي للفتى ماجد كامل في قيادة فريقه المجد نحو الفوز بالبطولات الوطنية والوصول إلى كأس العالم.',
    score: 7.9,
    year: 1983,
    status: 'Completed',
    statusAr: 'مكتمل',
    genres: ['Sports', 'Action'],
    genresAr: ['رياضة', 'أكشن', 'مدبلج'],
    episodesCount: 128,
    durationPerEp: '24 دقيقة',
    format: 'TV',
    coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx145139-rRimpHGWLhym.png',
    bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/2116-DccGEDGnsqcu.jpg',
    bannerColor: 'from-emerald-950 via-slate-900 to-black',
    posterBg: 'linear-gradient(135deg, #09281a 0%, #101c18 50%, #060907 100%)',
    accentColor: '#10b981',
    rating: 'All',
    studio: 'Tsuchida Production',
    featured: false,
    provider: 'spacetoon',
    badge: 'سبيستون زمان',
    trailerYtId: 'K6zQ1qs2hLY',
    episodes: [
      {
        id: 'ct-ep-1',
        number: 1,
        title: 'The Great Dream',
        titleAr: 'الحلقة 1: الحلم الكبير',
        duration: '24:00',
        videoUrl: SAMPLE_STREAM_1,
        thumbnail: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx145139-rRimpHGWLhym.png',
        synopsis: 'Tsubasa arrives in Nankatsu and challenges the genius goalkeeper Wakabayashi.',
        synopsisAr: 'ينتقل ماجد إلى المدينة الجديدة ويتحدى الحارس المتألق وليد بتسديدة تاريخية.'
      }
    ],
    characters: [
      { name: 'Tsubasa Oozora (Majed)', nameAr: 'كابتن ماجد', role: 'Captain', roleAr: 'ماجد', imageUrl: '' },
      { name: 'Genzo Wakabayashi (Walid)', nameAr: 'وليد', role: 'Goalkeeper', roleAr: 'الحارس وليد', imageUrl: '' },
      { name: 'Kojiro Hyuga (Bassam)', nameAr: 'بسام', role: 'Striker / Rival', roleAr: 'بسام', imageUrl: '' }
    ]
  },
  {
    id: 'kimetsu-mugen-train-movie',
    anilistId: 112151,
    title: 'Demon Slayer: Mugen Train Movie',
    titleAr: 'فيلم قاتل الشياطين: قطار اللانهاية',
    titleJp: '劇場版「鬼滅の刃」無限列車編',
    synopsis: 'Tanjiro Kamado, joined with Inosuke Hashibira and Zenitsu Agatsuma, board the Infinity Train on a new mission with the Flame Hashira, Kyojuro Rengoku, to defeat a demon who has been tormenting the passengers.',
    synopsisAr: 'ينطلق تانجيرو ورفاقه على متن قطار اللانهاية برفقة هاشيرا اللهب كيوجيرو رينغوكو في مهمة ملحمية لمواجهة شيطان غامض يحتجز الركاب داخل أحلامهم.',
    score: 9.0,
    year: 2020,
    status: 'Completed',
    statusAr: 'مكتمل',
    genres: ['Movie', 'Action', 'Fantasy', 'Supernatural', 'Award Winning'],
    genresAr: ['أفلام الأنمي', 'أكشن', 'فانتازيا', 'خارق للطبيعة', 'الفائزة بجوائز'],
    episodesCount: 1,
    durationPerEp: '117 دقيقة',
    format: 'MOVIE',
    coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx112151-1fa63W7ffUGp.jpg',
    bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/101922-YfZhKBUDDS6L.jpg',
    bannerColor: 'from-orange-950 via-red-950 to-black',
    posterBg: 'linear-gradient(135deg, #2a1008 0%, #1a0b0e 50%, #050508 100%)',
    accentColor: '#f97316',
    rating: '16+',
    studio: 'ufotable',
    featured: true,
    badge: 'فيلم أنمي',
    trailerYtId: 'ATJYac_dORw',
    episodes: [
      {
        id: 'mugen-movie-1',
        number: 1,
        title: 'Mugen Train (Full Movie)',
        titleAr: 'الفيلم الكامل: قطار اللانهاية',
        duration: '1:57:00',
        videoUrl: SAMPLE_STREAM_3,
        thumbnail: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx112151-1fa63W7ffUGp.jpg',
        synopsis: 'Full theatrical anime movie in 1080p Blu-ray quality.',
        synopsisAr: 'الفيلم السينمائي الكامل بجودة بلوراي فائقة الوضوح ومترجم للعربية.'
      }
    ],
    characters: [
      { name: 'Kyojuro Rengoku', nameAr: 'كيوجيرو رينغوكو', role: 'Flame Hashira', roleAr: 'هاشيرا اللهب', imageUrl: '' },
      { name: 'Tanjiro Kamado', nameAr: 'تانجيرو كامادو', role: 'Main Protagonist', roleAr: 'البطل', imageUrl: '' }
    ]
  },
  {
    id: 'jujutsu-kaisen-0-movie',
    anilistId: 131573,
    title: 'Jujutsu Kaisen 0 Movie',
    titleAr: 'فيلم جوجوتسو كايسن 0',
    titleJp: '劇場版 呪術廻戦 0',
    synopsis: 'Yuta Okkotsu is a nervous high school student who is suffering from a serious problem—his childhood friend Rika has turned into a Curse and does not leave him alone. Satoru Gojo enrolls him in Tokyo Prefectural Jujutsu High School.',
    synopsisAr: 'يعاني الطالب يوتا أوكوتسو من لعنة خطيرة مرتبطة بصديقة طفولته ريكا، فيضمه ساتورو غوجو إلى ثانوية الجوجوتسو لتعلم السيطرة على قوته الهائلة ومواجهة سوغورو غيتو.',
    score: 8.8,
    year: 2021,
    status: 'Completed',
    statusAr: 'مكتمل',
    genres: ['Movie', 'Action', 'Supernatural', 'Fantasy'],
    genresAr: ['أفلام الأنمي', 'أكشن', 'خارق للطبيعة', 'فانتازيا'],
    episodesCount: 1,
    durationPerEp: '105 دقيقة',
    format: 'MOVIE',
    coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx131573-rfd72G04C97Z.jpg',
    bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/113415-jQBSkxWAAk83.jpg',
    bannerColor: 'from-indigo-950 via-purple-950 to-black',
    posterBg: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #050508 100%)',
    accentColor: '#6366f1',
    rating: '16+',
    studio: 'MAPPA',
    featured: false,
    badge: 'فيلم أنمي',
    trailerYtId: 'e8nij72a6fU',
    episodes: [
      {
        id: 'jjk0-movie-1',
        number: 1,
        title: 'Jujutsu Kaisen 0 (Full Movie)',
        titleAr: 'الفيلم الكامل: جوجوتسو كايسن 0',
        duration: '1:45:00',
        videoUrl: SAMPLE_STREAM_2,
        thumbnail: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx131573-rfd72G04C97Z.jpg',
        synopsis: 'Full theatrical movie of Jujutsu Kaisen 0.',
        synopsisAr: 'الفيلم السينمائي الكامل لجوجوتسو كايسن 0 مترجم بالعربية.'
      }
    ],
    characters: [
      { name: 'Yuta Okkotsu', nameAr: 'يوتا أوكوتسو', role: 'Main Protagonist', roleAr: 'البطل', imageUrl: '' },
      { name: 'Satoru Gojo', nameAr: 'ساتورو غوجو', role: 'Mentor', roleAr: 'المعلم', imageUrl: '' }
    ]
  },
  {
    id: 'your-name-movie',
    anilistId: 21519,
    title: 'Your Name. (Kimi no Na wa)',
    titleAr: 'فيلم اسمك (Your Name)',
    titleJp: '君の名は。',
    synopsis: 'Mitsuha Miyamizu, a high school girl living in the rural town of Itomori, and Taki Tachibana, a boy in Tokyo, begin mysteriously swapping bodies across time and space.',
    synopsisAr: 'ميتسوها فتاة تعيش في بلدة ريفية هادئة، وتاكي فتى يعيش في قلب طوكيو، يكتشفان ظاهرة غامضة تجعلهما يتبادلان الأجساد عبر الزمان والمكان في رحلة درامية ساحرة.',
    score: 9.1,
    year: 2016,
    status: 'Completed',
    statusAr: 'مكتمل',
    genres: ['Movie', 'Drama', 'Supernatural', 'Award Winning'],
    genresAr: ['أفلام الأنمي', 'دراما', 'خارق للطبيعة', 'الفائزة بجوائز'],
    episodesCount: 1,
    durationPerEp: '106 دقيقة',
    format: 'MOVIE',
    coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21519-XIr3PeczUjjF.png',
    bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/21519-1459465729.jpg',
    bannerColor: 'from-sky-950 via-blue-950 to-black',
    posterBg: 'linear-gradient(135deg, #0c192c 0%, #172554 50%, #050508 100%)',
    accentColor: '#38bdf8',
    rating: '13+',
    studio: 'CoMix Wave Films',
    featured: true,
    badge: 'فيلم أنمي',
    trailerYtId: 'xU47nhruN-Q',
    episodes: [
      {
        id: 'your-name-ep-1',
        number: 1,
        title: 'Your Name (Full Movie)',
        titleAr: 'الفيلم الكامل: اسمك (Your Name)',
        duration: '1:46:00',
        videoUrl: SAMPLE_STREAM_1,
        thumbnail: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21519-XIr3PeczUjjF.png',
        synopsis: 'Full theatrical anime movie directed by Makoto Shinkai.',
        synopsisAr: 'الفيلم السينمائي الكامل للمخرج ماكوتو شينكاي بجودة عالية.'
      }
    ],
    characters: [
      { name: 'Taki Tachibana', nameAr: 'تاكي تاتشيبانا', role: 'Main Protagonist', roleAr: 'البطل', imageUrl: '' },
      { name: 'Mitsuha Miyamizu', nameAr: 'ميتسوها مياميزو', role: 'Main Heroine', roleAr: 'البطلة', imageUrl: '' }
    ]
  },
  {
    id: 'suzume-movie',
    anilistId: 142770,
    title: 'Suzume',
    titleAr: 'فيلم سوزومي (Suzume)',
    titleJp: 'すずめの戸締まり',
    synopsis: 'A 17-year-old girl named Suzume helps a mysterious young man close doors from the other side that are releasing disasters all over in Japan.',
    synopsisAr: 'تنطلق الفتاة سوزومي ذات الـ 17 عاماً في مغامرة عبر أنحاء اليابان لإغلاق أبواب غامضة تجلب الكوارث من العالم الآخر.',
    score: 8.6,
    year: 2022,
    status: 'Completed',
    statusAr: 'مكتمل',
    genres: ['Movie', 'Adventure', 'Fantasy', 'Award Winning'],
    genresAr: ['أفلام الأنمي', 'مغامرة', 'فانتازيا', 'الفائزة بجوائز'],
    episodesCount: 1,
    durationPerEp: '122 دقيقة',
    format: 'MOVIE',
    coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx142770-dDaDIRns05jN.jpg',
    bannerImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/154587-ivXNJ23SM1xB.jpg',
    bannerColor: 'from-teal-950 via-cyan-950 to-black',
    posterBg: 'linear-gradient(135deg, #082f49 0%, #0f172a 50%, #050508 100%)',
    accentColor: '#2dd4bf',
    rating: '13+',
    studio: 'CoMix Wave Films',
    featured: false,
    badge: 'فيلم أنمي',
    trailerYtId: '5pTcio2hTSw',
    episodes: [
      {
        id: 'suzume-ep-1',
        number: 1,
        title: 'Suzume (Full Movie)',
        titleAr: 'الفيلم الكامل: سوزومي',
        duration: '2:02:00',
        videoUrl: SAMPLE_STREAM_4,
        thumbnail: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx142770-dDaDIRns05jN.jpg',
        synopsis: 'Full theatrical movie Suzume.',
        synopsisAr: 'الفيلم السينمائي الكامل سوزومي مترجم بالعربية.'
      }
    ],
    characters: [
      { name: 'Suzume Iwato', nameAr: 'سوزومي إيواتو', role: 'Main Heroine', roleAr: 'البطلة', imageUrl: '' },
      { name: 'Souta Munakata', nameAr: 'سوتا موناكاتا', role: 'Closer', roleAr: 'حارس الأبواب', imageUrl: '' }
    ]
  }
];

/* ══════════════════════════════════════════════════════════════════════════
   1. AW_DUBBED_SERIES (أنيميشن مدبلج ومترجم — /aw-dubbed/[key].tsx)
   ══════════════════════════════════════════════════════════════════════════ */
export const AW_DUBBED_SERIES: AwDubbedSeries[] = [
  {
    key: 'arcane-ar',
    title: 'Arcane: League of Legends',
    titleAr: 'آركين: ليغ أوف ليجندز',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-LHBAeoZDIsnF.jpg',
    badge: 'مدبلج',
    seasons: [
      {
        key: 'arcane-s1',
        label: 'الموسم 1',
        seasonNumber: 1,
        episodes: Array.from({ length: 9 }, (_, i) => ({
          number: i + 1,
          title: `الحلقة ${i + 1}`,
          videoUrl: SAMPLE_STREAM_1,
        })),
      },
      {
        key: 'arcane-s2',
        label: 'الموسم 2',
        seasonNumber: 2,
        episodes: Array.from({ length: 9 }, (_, i) => ({
          number: i + 1,
          title: `الحلقة ${i + 1}`,
          videoUrl: SAMPLE_STREAM_2,
        })),
      },
    ],
  },
  {
    key: 'avatar-last-airbender',
    title: 'Avatar: The Last Airbender',
    titleAr: 'آفاتار: أسطورة آنغ',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx145139-rRimpHGWLhym.png',
    badge: 'مدبلج',
    seasons: [
      {
        key: 'avatar-s1',
        label: 'الكتاب الأول: الماء',
        seasonNumber: 1,
        episodes: Array.from({ length: 20 }, (_, i) => ({
          number: i + 1,
          title: `الحلقة ${i + 1}`,
          videoUrl: SAMPLE_STREAM_3,
        })),
      },
      {
        key: 'avatar-s2',
        label: 'الكتاب الثاني: الأرض',
        seasonNumber: 2,
        episodes: Array.from({ length: 20 }, (_, i) => ({
          number: i + 1,
          title: `الحلقة ${i + 1}`,
          videoUrl: SAMPLE_STREAM_4,
        })),
      },
      {
        key: 'avatar-s3',
        label: 'الكتاب الثالث: النار',
        seasonNumber: 3,
        episodes: Array.from({ length: 21 }, (_, i) => ({
          number: i + 1,
          title: `الحلقة ${i + 1}`,
          videoUrl: SAMPLE_STREAM_1,
        })),
      },
    ],
  },
  {
    key: 'invincible-sub',
    title: 'Invincible',
    titleAr: 'إنفينسيبل (لا يُقهر)',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151807-it355ZgzquUd.png',
    badge: 'مترجم',
    seasons: [
      {
        key: 'invincible-s1',
        label: 'الموسم 1',
        seasonNumber: 1,
        episodes: Array.from({ length: 8 }, (_, i) => ({
          number: i + 1,
          title: `الحلقة ${i + 1}`,
          videoUrl: SAMPLE_STREAM_2,
        })),
      },
      {
        key: 'invincible-s2',
        label: 'الموسم 2',
        seasonNumber: 2,
        episodes: Array.from({ length: 8 }, (_, i) => ({
          number: i + 1,
          title: `الحلقة ${i + 1}`,
          videoUrl: SAMPLE_STREAM_3,
        })),
      },
    ],
  },
  {
    key: 'miraculous-ar',
    title: 'Miraculous: Tales of Ladybug & Cat Noir',
    titleAr: 'ميراكيولوس: قصص الفتاة الدعسوقة والقط الأسود',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-WBsBl0ClmgYL.jpg',
    badge: 'مدبلج',
    seasons: [
      {
        key: 'miraculous-s1',
        label: 'الموسم 1',
        seasonNumber: 1,
        episodes: Array.from({ length: 26 }, (_, i) => ({
          number: i + 1,
          title: `الحلقة ${i + 1}`,
          videoUrl: SAMPLE_STREAM_1,
        })),
      },
      {
        key: 'miraculous-s2',
        label: 'الموسم 2',
        seasonNumber: 2,
        episodes: Array.from({ length: 26 }, (_, i) => ({
          number: i + 1,
          title: `الحلقة ${i + 1}`,
          videoUrl: SAMPLE_STREAM_4,
        })),
      },
    ],
  },
  {
    key: 'rick-and-morty-sub',
    title: 'Rick and Morty',
    titleAr: 'ريك ومورتي',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-gHSraOSa0nBG.jpg',
    badge: 'مترجم',
    seasons: [
      {
        key: 'rm-s1',
        label: 'الموسم 1',
        seasonNumber: 1,
        episodes: Array.from({ length: 11 }, (_, i) => ({
          number: i + 1,
          title: `الحلقة ${i + 1}`,
          videoUrl: SAMPLE_STREAM_2,
        })),
      },
    ],
  },
  {
    key: 'samurai-jack-ar',
    title: 'Samurai Jack',
    titleAr: 'ساموراي جاك',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-buvcRTBx4NSm.jpg',
    badge: 'مدبلج',
    seasons: [
      {
        key: 'sj-s1',
        label: 'الموسم 1',
        seasonNumber: 1,
        episodes: Array.from({ length: 13 }, (_, i) => ({
          number: i + 1,
          title: `الحلقة ${i + 1}`,
          videoUrl: SAMPLE_STREAM_3,
        })),
      },
    ],
  },
];

/* ══════════════════════════════════════════════════════════════════════════
   2. SPACETOON_SERIES (مسلسلات سبيستون — /dubbed/[id].tsx?provider=sp)
   ══════════════════════════════════════════════════════════════════════════ */
export const SPACETOON_SERIES: DubbedSeries[] = [
  {
    id: 'sp-conan',
    provider: 'sp',
    title: 'المحقق كونان (دبلجة مركز الزهرة)',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx235-MyYT7K3chBdO.jpg',
    badge: 'مدبلج',
    year: 1996,
    seasons: [
      {
        key: 'sp-conan-s1',
        label: 'الجزء الأول',
        seasonNumber: 1,
        episodes: Array.from({ length: 40 }, (_, i) => ({
          number: i + 1,
          title: `الحلقة ${i + 1}`,
          videoUrl: SAMPLE_STREAM_4,
        })),
      },
      {
        key: 'sp-conan-s2',
        label: 'الجزء الثاني',
        seasonNumber: 2,
        episodes: Array.from({ length: 40 }, (_, i) => ({
          number: i + 1,
          title: `الحلقة ${i + 1}`,
          videoUrl: SAMPLE_STREAM_1,
        })),
      },
      {
        key: 'sp-conan-s3',
        label: 'الجزء الثالث',
        seasonNumber: 3,
        episodes: Array.from({ length: 40 }, (_, i) => ({
          number: i + 1,
          title: `الحلقة ${i + 1}`,
          videoUrl: SAMPLE_STREAM_2,
        })),
      },
    ],
  },
  {
    id: 'sp-hxh',
    provider: 'sp',
    title: 'القناص (هزيم الرعد · مركز الزهرة)',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx11061-sIpBprNRfzCe.png',
    badge: 'مدبلج',
    year: 1999,
    seasons: [
      {
        key: 'sp-hxh-s1',
        label: 'قائمة الحلقات',
        seasonNumber: 1,
        episodes: Array.from({ length: 62 }, (_, i) => ({
          number: i + 1,
          title: `الحلقة ${i + 1}`,
          videoUrl: SAMPLE_STREAM_1,
        })),
      },
    ],
  },
  {
    id: 'sp-dbz',
    provider: 'sp',
    title: 'دراغون بول زد (دبلجة سبيستون)',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx813-ZhnFNOeCU5dQ.png',
    badge: 'مدبلج',
    year: 1989,
    seasons: [
      {
        key: 'sp-dbz-s1',
        label: 'الموسم الأول: السايان',
        seasonNumber: 1,
        episodes: Array.from({ length: 53 }, (_, i) => ({
          number: i + 1,
          title: `الحلقة ${i + 1}`,
          videoUrl: SAMPLE_STREAM_2,
        })),
      },
      {
        key: 'sp-dbz-s2',
        label: 'الموسم الثاني: كوكب ناميك',
        seasonNumber: 2,
        episodes: Array.from({ length: 52 }, (_, i) => ({
          number: i + 1,
          title: `الحلقة ${i + 1}`,
          videoUrl: SAMPLE_STREAM_3,
        })),
      },
    ],
  },
  {
    id: 'sp-adnan',
    provider: 'sp',
    title: 'عدنان ولينا (مغامرات الفتى كنان)',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-ELSYx3yMPcKM.jpg',
    badge: 'مدبلج',
    year: 1978,
    seasons: [
      {
        key: 'sp-adnan-s1',
        label: 'قائمة الحلقات',
        seasonNumber: 1,
        episodes: Array.from({ length: 26 }, (_, i) => ({
          number: i + 1,
          title: `الحلقة ${i + 1}`,
          videoUrl: SAMPLE_STREAM_3,
        })),
      },
    ],
  },
  {
    id: 'sp-majed',
    provider: 'sp',
    title: 'كابتن ماجد (الشبح)',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx145139-rRimpHGWLhym.png',
    badge: 'مدبلج',
    year: 1983,
    seasons: [
      {
        key: 'sp-majed-s1',
        label: 'الجزء الأول',
        seasonNumber: 1,
        episodes: Array.from({ length: 52 }, (_, i) => ({
          number: i + 1,
          title: `الحلقة ${i + 1}`,
          videoUrl: SAMPLE_STREAM_1,
        })),
      },
      {
        key: 'sp-majed-s2',
        label: 'الجزء الثاني: عودة ماجد',
        seasonNumber: 2,
        episodes: Array.from({ length: 46 }, (_, i) => ({
          number: i + 1,
          title: `الحلقة ${i + 1}`,
          videoUrl: SAMPLE_STREAM_4,
        })),
      },
    ],
  },
  {
    id: 'sp-remy',
    provider: 'sp',
    title: 'دروب ريمي (سبيستون زمان)',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-gHSraOSa0nBG.jpg',
    badge: 'مدبلج',
    year: 1996,
    seasons: [
      {
        key: 'sp-remy-s1',
        label: 'قائمة الحلقات',
        seasonNumber: 1,
        episodes: Array.from({ length: 26 }, (_, i) => ({
          number: i + 1,
          title: `الحلقة ${i + 1}`,
          videoUrl: SAMPLE_STREAM_2,
        })),
      },
    ],
  },
];

/* ══════════════════════════════════════════════════════════════════════════
   3. CARTOON_SERIES (كرتون مدبلج ومترجم — /dubbed/[id].tsx?provider=ct)
   ══════════════════════════════════════════════════════════════════════════ */
export const CARTOON_SERIES: DubbedSeries[] = [
  {
    id: 'sponge-bob',
    provider: 'ct',
    title: 'سبونج بوب سكوير بانتس',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21087-B5DHjqZ3kW4b.jpg',
    badge: 'مدبلج',
    year: 1999,
    seasons: [
      {
        key: 'sb-s1',
        label: 'الموسم 1',
        seasonNumber: 1,
        episodes: Array.from({ length: 20 }, (_, i) => ({
          number: i + 1,
          title: `الحلقة ${i + 1}`,
          videoUrl: SAMPLE_STREAM_1,
        })),
      },
      {
        key: 'sb-s2',
        label: 'الموسم 2',
        seasonNumber: 2,
        episodes: Array.from({ length: 20 }, (_, i) => ({
          number: i + 1,
          title: `الحلقة ${i + 1}`,
          videoUrl: SAMPLE_STREAM_2,
        })),
      },
      {
        key: 'sb-s3',
        label: 'الموسم 3',
        seasonNumber: 3,
        episodes: Array.from({ length: 20 }, (_, i) => ({
          number: i + 1,
          title: `الحلقة ${i + 1}`,
          videoUrl: SAMPLE_STREAM_3,
        })),
      },
    ],
  },
  {
    id: 'gumball',
    provider: 'ct',
    title: 'عالم غامبول المدهش',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx11061-sIpBprNRfzCe.png',
    badge: 'مدبلج',
    year: 2011,
    seasons: [
      {
        key: 'gb-s1',
        label: 'الموسم 1',
        seasonNumber: 1,
        episodes: Array.from({ length: 36 }, (_, i) => ({
          number: i + 1,
          title: `الحلقة ${i + 1}`,
          videoUrl: SAMPLE_STREAM_2,
        })),
      },
      {
        key: 'gb-s2',
        label: 'الموسم 2',
        seasonNumber: 2,
        episodes: Array.from({ length: 40 }, (_, i) => ({
          number: i + 1,
          title: `الحلقة ${i + 1}`,
          videoUrl: SAMPLE_STREAM_4,
        })),
      },
    ],
  },
  {
    id: 'ben-10',
    provider: 'ct',
    title: 'بن 10: أومنيفرس',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx813-ZhnFNOeCU5dQ.png',
    badge: 'مدبلج',
    year: 2012,
    seasons: [
      {
        key: 'b10-s1',
        label: 'الموسم 1',
        seasonNumber: 1,
        episodes: Array.from({ length: 20 }, (_, i) => ({
          number: i + 1,
          title: `الحلقة ${i + 1}`,
          videoUrl: SAMPLE_STREAM_3,
        })),
      },
      {
        key: 'b10-s2',
        label: 'الموسم 2',
        seasonNumber: 2,
        episodes: Array.from({ length: 20 }, (_, i) => ({
          number: i + 1,
          title: `الحلقة ${i + 1}`,
          videoUrl: SAMPLE_STREAM_1,
        })),
      },
    ],
  },
  {
    id: 'tmnt',
    provider: 'ct',
    title: 'سلاحف النينجا',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-ELSYx3yMPcKM.jpg',
    badge: 'مدبلج',
    year: 2012,
    seasons: [
      {
        key: 'tmnt-s1',
        label: 'الموسم 1',
        seasonNumber: 1,
        episodes: Array.from({ length: 26 }, (_, i) => ({
          number: i + 1,
          title: `الحلقة ${i + 1}`,
          videoUrl: SAMPLE_STREAM_4,
        })),
      },
    ],
  },
  {
    id: 'teen-titans',
    provider: 'ct',
    title: 'أبطال التايتنز انطلقوا!',
    poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-buvcRTBx4NSm.jpg',
    badge: 'مدبلج',
    year: 2013,
    seasons: [
      {
        key: 'tt-s1',
        label: 'الموسم 1',
        seasonNumber: 1,
        episodes: Array.from({ length: 52 }, (_, i) => ({
          number: i + 1,
          title: `الحلقة ${i + 1}`,
          videoUrl: SAMPLE_STREAM_1,
        })),
      },
    ],
  },
];

/* ══════════════════════════════════════════════════════════════════════════
   4. STARDIMA_SERIES (StarDima Catalog — stardima-title -> stardima-servers -> stardima-player)
   ══════════════════════════════════════════════════════════════════════════ */
function makeStardimaSeasons(prefix: string, seasonCount: number, epPerSeason: number) {
  return Array.from({ length: seasonCount }, (_, sIdx) => {
    const seasonNumber = sIdx + 1;
    return {
      season_number: seasonNumber,
      episode_count: epPerSeason,
      episodes: Array.from({ length: epPerSeason }, (_, eIdx) => {
        const episodeNumber = eIdx + 1;
        return {
          provider_episode_id: `${prefix}-s${seasonNumber}-e${episodeNumber}`,
          season_number: seasonNumber,
          episode_number: episodeNumber,
          title_raw: `الحلقة ${episodeNumber}`,
          qualities: [
            {
              quality: '1080p' as const,
              servers: [
                {
                  server_key: 'stardima-cdn-1080',
                  label: 'StarDima CDN · العربية',
                  verified: true,
                  videoUrl: SAMPLE_STREAM_1,
                },
                {
                  server_key: 'vidstream-1080',
                  label: 'VidStream HD · العربية',
                  verified: true,
                  videoUrl: SAMPLE_STREAM_2,
                },
              ],
            },
            {
              quality: '720p' as const,
              servers: [
                {
                  server_key: 'stardima-cdn-720',
                  label: 'StarDima CDN · العربية',
                  verified: true,
                  videoUrl: SAMPLE_STREAM_3,
                },
                {
                  server_key: 'mp4upload-720',
                  label: 'Mp4Upload · العربية',
                  verified: false,
                  videoUrl: SAMPLE_STREAM_4,
                },
              ],
            },
            {
              quality: '480p' as const,
              servers: [
                {
                  server_key: 'backup-sd-480',
                  label: 'سيرفر احتياطي SD · العربية',
                  verified: false,
                  videoUrl: SAMPLE_STREAM_1,
                },
              ],
            },
          ],
        };
      }),
    };
  });
}

export const STARDIMA_SERIES: StardimaSeries[] = [
  {
    provider_title_id: 'sd-generator-rex',
    slug: 'generator-rex-ar',
    title_ar: 'جينيريتور ريكس (مدبلج عربي)',
    poster_url: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-buvcRTBx4NSm.jpg',
    media_type: 'series',
    release_year: 2010,
    episode_count: 20,
    badge: 'مدبلج',
    category: 'cartoon',
    seasons: makeStardimaSeasons('sd-rex', 2, 10),
  },
  {
    provider_title_id: 'sd-slugterra',
    slug: 'slugterra-ar',
    title_ar: 'سلغتيرا (Slugterra)',
    poster_url: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151807-it355ZgzquUd.png',
    media_type: 'series',
    release_year: 2012,
    episode_count: 26,
    badge: 'مدبلج',
    category: 'animation',
    seasons: makeStardimaSeasons('sd-slug', 2, 13),
  },
  {
    provider_title_id: 'sd-adventure-time',
    slug: 'adventure-time-ar',
    title_ar: 'وقت المغامرة (دبلجة كرتون نتورك)',
    poster_url: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-WBsBl0ClmgYL.jpg',
    media_type: 'series',
    release_year: 2010,
    episode_count: 26,
    badge: 'مدبلج',
    category: 'cartoon',
    seasons: makeStardimaSeasons('sd-adv', 2, 13),
  },
];

export const GENRE_LIST = [
  { id: 'all', labelAr: 'الكل', labelEn: 'All' },
  { id: 'dubbed', labelAr: 'مدبلج وسبيستون', labelEn: 'Dubbed' },
  { id: 'Action', labelAr: 'أكشن', labelEn: 'Action' },
  { id: 'Fantasy', labelAr: 'فانتازيا', labelEn: 'Fantasy' },
  { id: 'Supernatural', labelAr: 'خارق للطبيعة', labelEn: 'Supernatural' },
  { id: 'Mystery', labelAr: 'غموض', labelEn: 'Mystery' },
  { id: 'Adventure', labelAr: 'مغامرة', labelEn: 'Adventure' },
  { id: 'Comedy', labelAr: 'كوميديا', labelEn: 'Comedy' },
  { id: 'Sports', labelAr: 'رياضة', labelEn: 'Sports' }
];

