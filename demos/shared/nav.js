// Demo switcher for the full demo pages (all MoHeat Evo demos load this). Adds a "Demos" panel and ‹ › buttons to the top bar.
// Hidden in ?embed=1 (site menu) and ?cover=1 (cover export) — the bar is hidden there anyway. Add new demos to DEMOS.
(() => {
  // The demo list (data). The DISPLAYED order is automatic (below, guide §7.3 2d) — the order of these lines does not matter.
  //   cat / dir: demos/<cat>/<dir>/ · group: 0 all ages · 1 healing · 2 for him · 3 for her · 4 Nobunaga × Suntory (= cat)
  //   series: a key of SERIES (its demos stay together, in `part` order) · part: 1, 2, … inside the series (shown as "Part n / N")
  //   cast: the main character(s), '+'-joined (same character → shown next to each other) · featured: true → always in "Try these first"
  //   new: true → a NEW badge. Checked by tools/web/check_nav.py (fields, series / part, folders, thumbnails).
  const DEMOS = [
    { cat: 'all-ages', dir: 'Demo01_SnowFoxfire', ja: '雪と狐火のひそひそ話', en: 'Whispers of Snow and Flame', zh: '雪与狐火的悄悄话', ko: '눈과 여우불의 소곤소곤 이야기', series: 'snowfox', part: 1, cast: 'koyuki+homura', group: 0 },
    { cat: 'all-ages', dir: 'Demo28_SnowFoxLullaby', ja: 'ふたりの、こもりうた', en: 'A Lullaby for Two', zh: '两个人的摇篮曲', ko: '둘이서 불러 주는 자장가', series: 'snowfox', part: 2, cast: 'koyuki+homura', group: 0 },
    { cat: 'idol', dir: 'Demo02_FanMeeting_v2', ja: 'キミだけのスペシャルファンミーティング', en: 'Your Special Fan Meeting', zh: '只属于你的特别见面会', ko: '너만을 위한 스페셜 팬미팅', series: 'ayane', part: 1, cast: 'ayane', group: 5 },
    { cat: 'idol', dir: 'Demo03_ShiningSmileRemake', ja: '氷と炎の星光コンサート', en: 'Ice & Fire Concert', zh: '冰与火的星光演唱会', ko: '얼음과 불꽃의 별빛 콘서트', series: 'ayane', part: 2, cast: 'ayane', group: 5 },
    { cat: 'idol', dir: 'Demo63_AyaneDivaRock', ja: 'ストーム・ハート', en: 'Storm Heart', zh: '风暴之心', ko: '스톰 하트', series: 'ayane', part: 3, cast: 'ayane', new: true, group: 5 },
    { cat: 'idol', dir: 'Demo65_AyaneDivaBallad', ja: 'まどべの ゆき', en: 'Snow by the Window', zh: '窗边的雪', ko: '창가의 눈', series: 'ayane', part: 4, cast: 'ayane', new: true, group: 5 },
    { cat: 'idol', dir: 'Demo64_AyaneDivaWafu', ja: 'なつよい まつり', en: 'Summer Night Matsuri', zh: '夏宵祭', ko: '여름밤 마츠리', series: 'ayane', part: 5, cast: 'ayane', new: true, group: 5 },
    { cat: 'idol', dir: 'games/diva-diary', kind: 'game', ja: '歌姫プロデュース · ゲーム', en: 'Diva Diary · Game', zh: '歌姬养成日记 · 游戏', ko: '디바 다이어리 · 게임', series: 'ayane', part: 6, cast: 'ayane', new: true, group: 5 },
    { cat: 'idol', dir: 'games/hibiki-diary', kind: 'game', ja: 'プリンス・プロデュース · ゲーム', en: 'Prince Diary · Game', zh: '王子养成日记 · 游戏', ko: '프린스 다이어리 · 게임', series: 'hibiki', part: 6, cast: 'hibiki', new: true, group: 5 },
    { cat: 'idol', dir: 'Demo66_HibikiFanMeeting', ja: '響の、きみだけのファンミーティング', en: "Hibiki's Fan Meeting", zh: '响的专属见面会', ko: '히비키의 팬미팅', series: 'hibiki', part: 1, cast: 'hibiki', new: true, group: 5 },
    { cat: 'idol', dir: 'Demo67_HibikiDivaParade', ja: 'ほしふる パレード', en: 'Starfall Parade', zh: '星落游行', ko: '별이 쏟아지는 퍼레이드', series: 'hibiki', part: 2, cast: 'hibiki', new: true, group: 5 },
    { cat: 'idol', dir: 'Demo68_HibikiDivaCrown', ja: 'こおりの おうかん', en: 'Crown of Ice', zh: '冰之王冠', ko: '얼음 왕관', series: 'hibiki', part: 3, cast: 'hibiki', new: true, group: 5 },
    { cat: 'idol', dir: 'Demo69_HibikiDivaSnow', ja: 'ゆきあかり', en: 'Snowlight', zh: '雪光', ko: '눈빛', series: 'hibiki', part: 4, cast: 'hibiki', new: true, group: 5 },
    { cat: 'idol', dir: 'Demo70_HibikiDivaBench', ja: 'ひだまりの ベンチ', en: 'The Sunny Bench', zh: '向阳的长椅', ko: '양지바른 벤치', series: 'hibiki', part: 5, cast: 'hibiki', new: true, group: 5 },
    { cat: 'all-ages', dir: 'Demo04_SeasonsExpress', ja: '季節が、暴走する。', en: 'The Runaway Seasons Express', zh: '四季失控的魔法列车', ko: '계절이 폭주한다.', cast: 'train', group: 0 },
    { cat: 'all-ages', dir: 'Demo47_GhostLantern', ja: 'ひやっと！おばけやしきの ちょうちんばん', en: 'Lantern Keeper of the Spooky House', zh: '鬼屋提灯值日生', ko: '오싹! 유령의 집 등불 당번', cast: 'bonchan+yurari', new: true, group: 0 },
    { cat: 'all-ages', dir: 'Demo48_AnimalOnsen', ja: 'ゆけむり どうぶつおんせん', en: 'Steamy Animal Hot Spring', zh: '蒸汽腾腾的动物温泉', ko: '모락모락 동물 온천', cast: 'yuzujii', new: true, group: 0 },
    { cat: 'all-ages', dir: 'Demo10_CaveSpring', ja: '火をともして、ひみつの泉へ', en: 'Kindle the Fire, Find the Hidden Spring', zh: '点燃火光，寻找秘密之泉', ko: '불을 밝혀, 비밀의 샘으로', cast: 'kohaku', group: 0 },
    { cat: 'healing', dir: 'Demo11_Naomi', ja: 'ナオミと、ふわふわの一日', en: 'A Fluffy Day with Naomi', zh: '和 Naomi 的毛茸茸一天', ko: '나오미와 보송보송한 하루', series: 'naomi', part: 1, cast: 'naomi', group: 1 },
    { cat: 'healing', dir: 'Demo13_NaomiCam', ja: 'ナオミ、いまなにしてる？', en: "What's Naomi Up To? · Pet Cam", zh: 'Naomi，你在干嘛呀？', ko: '나오미, 지금 뭐 해?', series: 'naomi', part: 2, cast: 'naomi', group: 1 },
    { cat: 'healing', dir: 'Demo26_BecomeNaomi', ja: 'ねこになった日', en: 'The Day I Became Naomi', zh: '变成猫咪的那一天', ko: '고양이가 된 날', series: 'naomi', part: 3, cast: 'naomi', group: 1 },
    { cat: 'healing', dir: 'Demo49_NaomiSummer', ja: 'なつやすみ、ナオミと せんぷうき', en: 'Summer Fan Days with Naomi', zh: '暑假，Naomi 和电风扇', ko: '여름방학, 나오미와 선풍기', cast: 'naomi', new: true, group: 1 },
    { cat: 'healing', dir: 'Demo15_FamilyCall', ja: 'もしもし、おばあちゃん？', en: 'Hello, Grandma? · A Call Home, Part 1', zh: '喂，奶奶吗？', ko: '여보세요, 할머니?', series: 'family', part: 1, cast: 'hana+gen', group: 1 },
    { cat: 'healing', dir: 'Demo16_FamilyCall2', ja: 'じいちゃんの、ゆきだるま', en: "Grandpa's Little Snowman · A Call Home, Part 2", zh: '爷爷的小雪人', ko: '할아버지의 눈사람', series: 'family', part: 2, cast: 'hana+gen', group: 1 },
    { cat: 'healing', dir: 'Demo29_FamilyVisit', ja: 'ただいま、じいちゃん・ばあちゃん', en: 'Home for New Year', zh: '爷爷奶奶，我回来了', ko: '할아버지, 할머니, 저 왔어요', series: 'family', part: 3, cast: 'hana+gen', group: 1 },
    { cat: 'healing', dir: 'Demo50_WatermelonSummer', ja: 'なつやすみ、じいちゃんちの すいかわり', en: "Summer at Grandpa's: Watermelon Split", zh: '暑假，爷爷家的劈西瓜', ko: '여름방학, 할아버지 댁 수박 깨기', cast: 'grandma+grandpa', new: true, group: 1 },
    { cat: 'for-men', dir: 'Demo14_MintStream', ja: 'ミントの、おみみ専門店', en: "Mint's Ear Salon", zh: '薄荷的耳朵专门店', ko: '민트의 귀 전문점', series: 'stream', cast: 'mint', group: 2 },
    { cat: 'for-men', dir: 'Demo17_CocoaStream', ja: 'ココアの、バレンタイン前夜', en: "Valentine's Eve with Cocoa", zh: '可可的情人节前夜', ko: '코코아의 밸런타인 전날 밤', series: 'stream', cast: 'cocoa', group: 2 },
    { cat: 'for-men', dir: 'Demo18_HinataStream', ja: 'ひなたと、ゲーセンデート', en: 'Arcade Date with Hinata', zh: '和日向的游戏厅约会', ko: '히나타와 오락실 데이트', series: 'stream', cast: 'hinata', group: 2 },
    { cat: 'for-men', dir: 'Demo19_LunaStream', ja: 'ルナの、ひみつのカクテル', en: "Luna's Secret Cocktail", zh: '露娜的秘密鸡尾酒', ko: '루나의 비밀 칵테일', series: 'stream', cast: 'luna', group: 2 },
    { cat: 'for-men', dir: 'Demo25_HatsumodeDate', ja: 'はじめての、初詣デート', en: 'My First Hatsumode', zh: '第一次的新年参拜约会', ko: '처음 함께하는 새해 참배 데이트', cast: 'tsubaki', group: 2 },
    { cat: 'for-men', dir: 'Demo31_SummerRooftop', ja: 'なつの、おくじょうで', en: 'Up on the Summer Roof', zh: '夏日，屋顶上', ko: '여름, 옥상에서', cast: 'nagisa', group: 2 },
    { cat: 'for-men', dir: 'Demo43_BlizzardInn', ja: '白嶺の峠、ひと晩の宿', en: 'One Night at the White-Ridge Inn', zh: '白岭山口，一夜客栈', ko: '하쿠레이 고개, 하룻밤의 여관', cast: 'mint+hinata+nagisa', new: true, group: 2 },
    { cat: 'for-men', dir: 'Demo44_MagicAcademy', ja: 'まちがい召喚と、まほう学院の三人', en: 'Summoned by Mistake', zh: '错误召唤：魔法学院的三人', ko: '잘못된 소환과 마법 학원의 세 사람', cast: 'tsubaki+cocoa+luna', new: true, group: 2 },
    { cat: 'for-women', dir: 'Demo12_LateCall', ja: 'もしもし、きこえる？', en: 'Can You Hear Me?', zh: '喂，听得到吗？', ko: '여보세요, 들려?', cast: 'ren', group: 3 },
    { cat: 'for-women', dir: 'Demo20_HinataHandshake', ja: 'あと10秒だけ、ね？', en: 'Just Ten More Seconds?', zh: '再多10秒，好吗？', ko: '딱 10초만 더, 응?', cast: 'hinata_m', group: 3 },
    { cat: 'for-women', dir: 'Demo21_JinLounge', ja: '俺だけ見てろ', en: 'Look Only at Me', zh: '只准看着我', ko: '나만 봐', cast: 'jin', group: 3 },
    { cat: 'for-women', dir: 'Demo22_ShionRain', ja: '雨が止むまで', en: 'Until the Rain Stops', zh: '直到雨停', ko: '비가 그칠 때까지', cast: 'shion', group: 3 },
    { cat: 'for-women', dir: 'Demo24_GakuCamp', ja: 'ガクの、焚き火キャンプ配信', en: "Gaku's Campfire Stream", zh: '岳的篝火露营直播', ko: '가쿠의 모닥불 캠핑 방송', cast: 'gaku', group: 3 },
    { cat: 'for-women', dir: 'Demo30_SakuFestival', ja: 'なつまつり、ふたりで', en: 'Summer Festival, Just Us', zh: '夏日祭典，只有我们俩', ko: '여름 축제, 우리 둘이서', cast: 'saku', group: 3 },
    { cat: 'for-women', dir: 'Demo45_CelestialPalace', ja: 'てんにょ様は、未来から', en: 'A Celestial from the Future', zh: '来自未来的天女', ko: '선녀님은 미래에서', cast: 'jin+shion+saku', new: true, group: 3 },
    { cat: 'for-women', dir: 'Demo46_DragonContract', ja: '竜の王と、エルフの王と、小悪魔', en: 'The Dragon King, the Elf King and the Little Devil', zh: '龙王、精灵王与小恶魔', ko: '용왕과 엘프 왕과 작은 악마', cast: 'hinata_m+gaku+ren', new: true, group: 3 },
    { cat: 'nobunaga-suntory', dir: 'Demo05_GifuCastle', ja: '信長の岐阜城へようこそ', en: "Welcome to Nobunaga's Gifu Castle", zh: '欢迎来到信长的岐阜城', ko: '노부나가의 기후성에 어서 오세요', series: 'nobunaga', part: 1, cast: 'nobunaga+ieyasu', group: 4 },
    { cat: 'nobunaga-suntory', dir: 'Demo06_FutureWhisky', ja: '未来の酒と、安土の夜', en: 'Future Whisky at Azuchi', zh: '未来之酒与安土之夜', ko: '미래의 술과 아즈치의 밤', series: 'nobunaga', part: 2, cast: 'nobunaga+ieyasu', group: 4 },
    { cat: 'nobunaga-suntory', dir: 'Demo07_KyotoIzakaya', ja: '信長と家康、京都の居酒屋へ', en: 'Two Warlords in a Kyoto Izakaya', zh: '信长与家康，京都居酒屋之夜', ko: '노부나가와 이에야스, 교토의 이자카야로', series: 'nobunaga', part: 3, cast: 'nobunaga+ieyasu', group: 4 },
    { cat: 'nobunaga-suntory', dir: 'Demo08_YamazakiDistillery', ja: '信長と家康、山崎蒸溜所へ', en: 'Two Warlords at the Yamazaki Distillery', zh: '信长与家康，探访山崎蒸馏所', ko: '노부나가와 이에야스, 야마자키 증류소로', series: 'nobunaga', part: 4, cast: 'nobunaga+ieyasu', group: 4 },
    { cat: 'nobunaga-suntory', dir: 'Demo09_SengokuBanquet', ja: '安土最後の酒宴', en: 'The Last Banquet at Azuchi', zh: '安土最后的酒宴', ko: '아즈치의 마지막 연회', series: 'nobunaga', part: 5, cast: 'nobunaga+ieyasu', group: 4 },
    { cat: 'nobunaga-suntory', dir: 'Demo23_NobunagaTalk', ja: '信長と、語らう', en: 'Talk with Nobunaga', zh: '与信长对谈', ko: '노부나가와 이야기하다', series: 'talk', part: 1, cast: 'nobunaga', group: 4 },
    { cat: 'nobunaga-suntory', dir: 'Demo41_IeyasuTalk', ja: '家康と、語らう', en: 'Talk with Ieyasu', zh: '与家康对谈', ko: '이에야스와 이야기하다', series: 'talk', part: 2, cast: 'ieyasu', group: 4 },
    { cat: 'nobunaga-suntory', dir: 'Demo42_SengokuRoundtable', ja: '信長と家康の、座談会', en: 'Round Table with Nobunaga & Ieyasu', zh: '信长与家康的座谈会', ko: '노부나가와 이에야스의 좌담회', series: 'talk', part: 3, cast: 'nobunaga+ieyasu', group: 4 },
  ];
  // ---------------------------------------------------------------- the displayed order (user 2026-11-08: 菜单按类别 → 系列自动排序; guide §7.3 2d)
  // category (all ages → healing → for him → for her → Nobunaga) → series stay together, parts in order → series / single demos by the
  // thermal-use score (推荐度 = how fully the thermal feedback is used: tools/qa/thermal_score.py, best first) → demos with the same main
  // character next to each other → folder number. "Try these first" = featured + the top 3 by score. ‹ ›, swipes and the "n / N" follow it.
  const SERIES = {
    snowfox: { ja: '小雪と焔', en: 'Koyuki & Homura', zh: '小雪与焰', ko: '코유키와 호무라' }, ayane: { ja: '星乃綾音', en: 'Hoshino Ayane', zh: '星乃绫音', ko: '호시노 아야네' }, hibiki: { ja: '響', en: 'Hibiki', zh: '响', ko: '히비키' },
    naomi: { ja: 'ナオミ', en: 'Naomi', zh: 'Naomi', ko: '나오미' }, family: { ja: 'じいちゃん・ばあちゃん', en: 'Grandma & Grandpa', zh: '爷爷奶奶', ko: '할아버지·할머니' },
    stream: { ja: '配信ルーム', en: 'Live streams', zh: '直播间', ko: '라이브 방송' }, nobunaga: { ja: '信長と家康 · 全5話', en: 'Nobunaga & Ieyasu · 5 episodes', zh: '信长与家康 · 共5集', ko: '노부나가와 이에야스 · 전 5화' },
    talk: { ja: '語らう', en: 'Talk with them', zh: '对谈', ko: '이야기 나누기' },
  };
  const HEAT = {"Demo01_SnowFoxfire":85,"Demo02_FanMeeting_v2":85,"Demo03_ShiningSmileRemake":85,"Demo04_SeasonsExpress":84,"Demo05_GifuCastle":80,"Demo06_FutureWhisky":75,"Demo07_KyotoIzakaya":83,"Demo08_YamazakiDistillery":83,"Demo09_SengokuBanquet":82,"Demo10_CaveSpring":84,"Demo11_Naomi":69,"Demo12_LateCall":0,"Demo13_NaomiCam":75,"Demo14_MintStream":69,"Demo15_FamilyCall":69,"Demo16_FamilyCall2":83,"Demo17_CocoaStream":80,"Demo18_HinataStream":83,"Demo19_LunaStream":79,"Demo20_HinataHandshake":83,"Demo21_JinLounge":75,"Demo22_ShionRain":86,"Demo23_NobunagaTalk":72,"Demo24_GakuCamp":85,"Demo25_HatsumodeDate":87,"Demo26_BecomeNaomi":81,"Demo28_SnowFoxLullaby":84,"Demo29_FamilyVisit":83,"Demo30_SakuFestival":91,"Demo31_SummerRooftop":85,"Demo41_IeyasuTalk":69,"Demo42_SengokuRoundtable":70,"Demo43_BlizzardInn":83,"Demo44_MagicAcademy":98,"Demo45_CelestialPalace":92,"Demo46_DragonContract":90,"Demo47_GhostLantern":99,"Demo48_AnimalOnsen":99,"Demo49_NaomiSummer":99,"Demo50_WatermelonSummer":94};   // thermal-use score 0–100 per folder — ONE line, written by tools/qa/thermal_score.py (tools/qa/thermal_scores.json)
  { const CATS = ['all-ages', 'healing', 'for-men', 'for-women', 'nobunaga-suntory', 'idol'], num = (d) => +((d.dir.match(/^Demo(\d+)/) || [])[1] || 999), sc = (d) => HEAT[d.dir] || 0;
    const out = [];
    for (const cat of CATS) {
      const units = [], ser = {};
      for (const d of DEMOS.filter((x) => x.cat === cat)) { if (d.series) { if (!ser[d.series]) units.push(ser[d.series] = []); ser[d.series].push(d); } else units.push([d]); }
      for (const u of units) {   // inside a series: part order, else best score first; the unit's score / number / characters
        u.sort((a, b) => (a.part || 99) - (b.part || 99) || sc(b) - sc(a) || num(a) - num(b));
        u.score = Math.max(...u.map(sc)); u.num = Math.min(...u.map(num)); u.cast = new Set(u.flatMap((d) => (d.cast || d.dir).split('+')));
      }
      const AFTER = { talk: 1 };   // story order beats the score: the Nobunaga films (Ep 1–5) first, then Talk → Talk → Round table (user 2026-11-11)
      const rest = units.sort((a, b) => (AFTER[a[0].series] || 0) - (AFTER[b[0].series] || 0) || b.score - a.score || a.num - b.num);
      while (rest.length) {   // same main character next to each other: a unit pulls the next ones that share a character
        const u = rest.shift(); out.push(...u);
        for (let k = 0; k < rest.length; k++) if ([...rest[k].cast].some((c) => u.cast.has(c))) { out.push(...rest[k]); rest.splice(k--, 1); }
      }
    }
    for (const d of DEMOS) if (!out.includes(d)) out.push(d);   // an unknown category: at the end
    DEMOS.splice(0, DEMOS.length, ...out);
  }
  window.MoHeatOrder = { SERIES, HEAT };   // for tools / other pages (the sorted list itself is the shared demo list below)
  const TOP = [...DEMOS.filter((d) => d.featured), ...DEMOS.filter((d) => !d.featured && HEAT[d.dir]).sort((a, b) => HEAT[b.dir] - HEAT[a.dir])].slice(0, Math.max(3, DEMOS.filter((d) => d.featured).length));
  // rights notes shown under each demo's cover credits (full pages only); the full list is the site's credits.html
  const HIST = 'Oda Nobunaga and Tokugawa Ieyasu are portrayed as fictional characters', ADULT = 'お酒は20歳になってから · 20+ only';
  const RIGHTS = {
    Demo01_SnowFoxfire: 'Art: ChatGPT (OpenAI) · original characters', Demo02_FanMeeting_v2: 'Art: ChatGPT (OpenAI) · original character and song',
    Demo05_GifuCastle: `${HIST} · art: ChatGPT (OpenAI)`,
    Demo06_FutureWhisky: `${HIST} · Suntory, Yamazaki, Hibiki and Hakushu (names and bottle designs) are trademarks of Suntory Holdings Limited · ${ADULT}`,
    Demo07_KyotoIzakaya: `${HIST} · art: ChatGPT (OpenAI) · ${ADULT}`,
    Demo08_YamazakiDistillery: `${HIST} · Suntory and Yamazaki are trademarks of Suntory Holdings Limited · ${ADULT}`,
    Demo09_SengokuBanquet: `${HIST} · art: ChatGPT (OpenAI) · ${ADULT}`,
    Demo23_NobunagaTalk: `${HIST} · art: ChatGPT (OpenAI)`,
    Demo41_IeyasuTalk: `${HIST} · art: ChatGPT (OpenAI)`, Demo42_SengokuRoundtable: `${HIST} · art: ChatGPT (OpenAI)`,
  };
  const GROUPS = ['全年齢 · All ages', '癒し · Healing', '男性向け · For him', '女性向け · For her', '信長シリーズ · Nobunaga Series', 'アイドル・ミュージック · Idol Music'];   // numbers are the list order
  window.MoHeatDemos = { DEMOS, GROUPS };   // the demo list for other pages (kiosk/: menu, attract loop, summary); MOHEAT_NAV_DATA_ONLY = data only, no UI
  if (window.MOHEAT_NAV_DATA_ONLY) return;
  const qs = new URLSearchParams(location.search);
  { let k = qs.get('kiosk'); try { k = k ?? localStorage.getItem('moheat.kiosk'); } catch {}   // exhibition mode (shared/kiosk.js, guide §7.4): only when on
    const me = document.currentScript?.src; if (me && k && k !== '0' && !qs.has('cover') && !qs.has('render') && !qs.has('embed')) { const s = document.createElement('script'); s.src = me.replace(/nav\.js(\?.*)?$/, 'kiosk.js?v=6f830c64'); s.async = false; document.head.appendChild(s); } }
  { const me = document.currentScript?.src;   // subtitle language EN / 日本語 / 中文 (also in ?embed): shared/subs.js next to this file
    const shot = qs.has('cover') && qs.has('sub');   // per-language thumbnail export (tools/web/thumbs.py): only the display language
    if (me && !window.MoHeatSub && (shot || (!qs.has('cover') && !qs.has('render')))) for (const f of shot ? ['subs.js?v=4e4e3f27'] : ['subs.js?v=4e4e3f27', 'fullscreen.js?v=4', 'guide.js?v=06015cbb', 'thermocheck.js?v=600bf6fe']) {   // display language + ⛶ fullscreen + first-visit guide + 🌡 thermal check (tools/web/bump.py updates these numbers)
      const s = document.createElement('script'); s.src = me.replace(/nav\.js(\?.*)?$/, f); s.async = false; document.head.appendChild(s); } 
    else if (!window.MoHeatSub) document.documentElement.classList.add('l10n-ready'); }   // no subs.js (?cover / ?render): the cover text shows as is (series.css hides it until l10n-ready)
  if (qs.has('embed') || qs.has('cover') || qs.has('render')) return;
  { const me = document.currentScript?.src;   // drag gestures on phones (stroke / pet / rub / aim): no page scroll, zoom, swipe-back (shared/gesture.js, guide §7.1)
    if (me && !window.MoHeatGesture) { const s = document.createElement('script'); s.src = me.replace(/nav\.js(\?.*)?$/, 'gesture.js?v=1'); s.async = false; document.head.appendChild(s); } }
  // one screen: measure the bar and what sits below the stage, series.css sizes the stage and the side panel from these
  if (!('serial' in navigator)) document.documentElement.classList.add('no-serial');   // phones: no Web Serial → series.css hides the device controls
  const root = document.documentElement, fit = () => {
    const bar = document.querySelector('header.bar'), lay = document.querySelector('.layout'), stage = document.querySelector('.stage-col .stage') || document.querySelector('.stage');
    if (!lay || !stage) return;
    root.classList.add('fit');   // first, so the column is no longer stretched to the side panel's height when measured
    const col = stage.closest('.stage-col') || stage.parentElement, cs = getComputedStyle(lay);
    root.style.setProperty('--fit-bar', `${bar && getComputedStyle(bar).position !== 'fixed' ? bar.offsetHeight : 0}px`);   // landscape phones: the bar is a column on the left (series.css)
    root.style.setProperty('--fit-pad', `${parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)}px`);
    const below = Math.max(0, col.getBoundingClientRect().height - stage.getBoundingClientRect().height);
    root.style.setProperty('--fit-below', `${below}px`);
    // responsive side panel (≤ 1100 px): "below" the player when at least 220 px are left under the full-width player (portrait phones / tablets),
    // otherwise a "drawer" that slides in from the right (landscape phones / tablets) — the player always keeps its largest 16:9 size
    const side = document.querySelector('aside.side');
    if (side && matchMedia('(max-width: 1100px)').matches) {
      const barH = parseFloat(root.style.getPropertyValue('--fit-bar')) || 0, barW = bar && getComputedStyle(bar).position === 'fixed' ? bar.offsetWidth : 0;
      const W = innerWidth - barW - 16, H = innerHeight - barH - 16, stageH = Math.min(W * 9 / 16, Math.max(0, H - below));
      const drawer = H - stageH - below < 220;
      root.classList.toggle('lay-drawer', drawer); root.classList.toggle('lay-below', !drawer);
      if (!drawer) root.classList.remove('side-open');
    } else root.classList.remove('lay-drawer', 'lay-below', 'side-open');
  };
  fit(); addEventListener('resize', fit); addEventListener('load', fit); setTimeout(fit, 600);
  // touch: a long press on a hold button / the picture must not open the callout menu (the hold would be cancelled)
  addEventListener('contextmenu', (e) => { if (e.target.closest?.('.stage :is(.hold, .act-btn, .ch, canvas, video, img)')) e.preventDefault(); });
  { const dir = (DEMOS.find((d) => location.pathname.includes(`/${d.dir}/`)) || {}).dir, cr = document.getElementById('credits');
    if (cr && RIGHTS[dir] && !document.querySelector('.dn-rights')) { const r = document.createElement('p'); r.className = 'draft dn-rights'; r.textContent = RIGHTS[dir]; cr.after(r); } }
  const bar = document.querySelector('header.bar'); if (!bar) return;
  // compact top bar (≤ 1100 px, series.css): 🎛 opens the side panel as a drawer when it has no room under the player; 🔌 opens the device controls
  // (port / Add / Connect, only in browsers with Web Serial) as a small menu instead of a second row
  const T3 = (o) => { const l = window.MoHeatSub?.lang || 'en'; return o[l] || o.en; };
  const PANEL = { en: 'Sound map, thermal output & settings', ja: '音の位置・温冷・設定', zh: '声音位置、冷热输出和设置', ko: '소리 위치·온냉 출력·설정' }, DEV = { en: 'Connect MoHeat Evo', ja: 'MoHeat Evo をつなぐ', zh: '连接 MoHeat Evo', ko: 'MoHeat Evo 연결' };
  const mini = (cls, icon, tip, onTap) => { const b = document.createElement('button'); b.type = 'button'; b.className = `btn sm ${cls}`; b.textContent = icon;
    const lab = () => { b.title = T3(tip); b.setAttribute('aria-label', T3(tip)); }; lab(); addEventListener('moheat:sublang', lab);
    b.addEventListener('click', (e) => { e.stopPropagation(); onTap(); }); const stop = document.getElementById('estop'); stop ? stop.before(b) : bar.appendChild(b); return b; };
  const toggle = (c, v) => { root.classList.toggle(c, v); dispatchEvent(new Event('resize')); };
  if (document.querySelector('aside.side')) mini('mside-btn', '🎛', PANEL, () => toggle('side-open', !root.classList.contains('side-open')));
  if (bar.querySelector('.device')) mini('mdev-btn', '🔌', DEV, () => toggle('dev-open', !root.classList.contains('dev-open')));
  document.addEventListener('click', (e) => {   // tap outside closes the drawer / the device menu
    if (root.classList.contains('side-open') && !e.target.closest('aside.side, .mside-btn, .mg-tip')) toggle('side-open', false);
    if (root.classList.contains('dev-open') && !e.target.closest('.bar .device, .mdev-btn')) toggle('dev-open', false);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { root.classList.remove('side-open', 'dev-open'); } });
  const cur = DEMOS.findIndex((d) => location.pathname.includes(`/${d.dir}/`));
  const href = (d) => `../../${d.cat}/${d.dir}/`, thumb = (i, l) => `../../../assets/images/demos/${DEMOS[i].dir}${l ? '.' + l : ''}.jpg`;   // pages live at demos/<cat>/<dir>/   // named by folder, so inserting a demo renames nothing

  const css = document.createElement('style');
  css.textContent = `
  .dnav{display:flex;align-items:center;gap:6px;margin-left:6px}
  .dnav a.dn-step,.dnav button{display:inline-flex;align-items:center;justify-content:center;gap:4px;height:32px;min-width:32px;padding:0 10px;border-radius:999px;border:1px solid rgba(255,255,255,.16);
    background:rgba(255,255,255,.05);color:inherit;font:600 13px/1 Inter,system-ui,sans-serif;text-decoration:none;cursor:pointer;white-space:nowrap}
  .dnav a.dn-step{padding:0;width:32px;font-size:17px}
  .dnav a.dn-step[aria-disabled=true]{opacity:.3;pointer-events:none}
  .dnav a.dn-step:hover,.dnav button:hover,.dnav button[aria-expanded=true]{border-color:#ff9a7a;background:rgba(255,140,110,.14)}
  .dn-panel{position:fixed;left:50%;top:calc(var(--fit-bar,54px) + 8px);transform:translateX(-50%);width:min(980px,calc(100vw - 24px));max-height:calc(100dvh - var(--fit-bar,54px) - 16px);overflow:auto;z-index:50;
    padding:16px;border-radius:18px;background:rgba(20,13,16,.97);border:1px solid rgba(255,255,255,.12);box-shadow:0 24px 70px rgba(0,0,0,.6);color:#f4ece8}
  .dn-panel[hidden]{display:none}
  .dn-panel h4{margin:6px 4px 10px;font:800 11px/1 Inter,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#ffab93}
  .dn-panel section+section h4{margin-top:18px}
  .dn-tabs{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 12px;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,.08)}
  .dn-tabs button{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 12px;border-radius:999px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.05);color:#cbbfb8;font:700 12px/1 Inter,"Noto Sans JP",sans-serif;cursor:pointer}
  .dn-tabs button i{font-style:normal;font-size:11px;opacity:.65}
  .dn-tabs button:hover{color:#fff;border-color:rgba(255,255,255,.35)}
  .dn-tabs button[aria-selected=true]{border-color:#ff9a7a;background:rgba(255,140,110,.16);color:#ffd2c4}
  .dn-panel section[hidden]{display:none}
  .dn-foot{margin:14px 4px 2px;padding-top:10px;border-top:1px solid rgba(255,255,255,.08);font:500 12px/1.4 Inter,sans-serif;color:#a99e93}.dn-foot a{color:#ffc4b2}
  .dn-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px}
  .dn-card{display:block;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:inherit;text-decoration:none;transition:transform .15s,border-color .15s}
  .dn-card:hover{transform:translateY(-2px);border-color:rgba(255,255,255,.35)}
  .dn-card.is-cur{border-color:#ff9a7a;box-shadow:0 0 0 1px #ff9a7a inset}
  .dn-card img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover}
  .dn-card span{display:block;padding:8px 10px 10px}
  .dn-card em{display:block;font:800 9.5px/1.2 Inter,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#a99e93;font-style:normal}
  .dn-card.is-cur em{color:#ffab93}
  .dn-card b{display:block;margin-top:4px;font:700 14px/1.3 "Noto Sans JP",sans-serif}
  .dn-card small{display:block;margin-top:2px;font:500 12px/1.3 Inter,sans-serif;color:#cbbfb8}
  .dn-card small.dn-now{color:#ffd58a;font-weight:600}   /* under the title, so every card's title lines up */
  .dn-card em i{font-style:normal;margin-left:6px;padding:1px 6px;border-radius:999px;background:#ff7a59;color:#fff;letter-spacing:.06em}
  .dn-card em s{text-decoration:none;color:#ffd58a}
  .dn-top h4{color:#ffd58a}
  @media (max-width:700px){.dnav .dn-label{display:none}.dn-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.dn-card b{font-size:12.5px}.dn-card small{display:none}}`;
  document.head.appendChild(css);

  // the switcher shows ONE language, the display language of shared/subs.js (user: it showed Japanese + small English)
  const LG = () => window.MoHeatSub?.lang || (() => { try { return sessionStorage.getItem('moheat.sublang'); } catch { return null; } })() || 'en';
  const pickT = (o) => { const l = LG(); return o[l] || (l === 'zh-Hant' && o.zh) || o.en; };
  const TITLE = (d) => pickT({ ja: d.ja, en: d.en, zh: d.zh, ko: d.ko });
  const GZH = ['全年龄', '治愈', '男性向', '女性向', '信长系列', '偶像音乐'], GKO = ['전체 이용가', '힐링', '남성향', '여성향', '노부나가 시리즈', '아이돌 뮤직'];
  const GT = (gi) => { const [ja, en] = GROUPS[gi].split(' · '); return pickT({ ja, en, zh: GZH[gi], ko: GKO[gi] }); };
  const W = { all: { ja: 'すべて', en: 'All', zh: '全部', ko: '전체' }, now: { ja: '再生中', en: 'Now playing', zh: '正在播放', ko: '재생 중' }, heat: { ja: '温冷', en: 'Thermal', zh: '温冷', ko: '온냉' }, ep: { ja: '第', en: 'Ep ', zh: '第', ko: '제' },
    demos: { ja: 'デモ', en: 'Demos', zh: '演示', ko: '데모' }, rec: { ja: '★ おすすめ', en: '★ Recommended', zh: '★ 推荐', ko: '★ 추천' }, top: { ja: 'まずはこれから · 温冷をいちばん感じられる3本', en: 'Try these first · the most thermal feedback', zh: '推荐先体验 · 冷热反馈最丰富的3个', ko: '먼저 이것부터 · 온냉을 가장 잘 느낄 수 있는 3편' }, credits: { ja: '権利表記', en: 'Credits', zh: '版权与署名', ko: '크레디트' },
    rights: { ja: '声・イラスト・音楽・商標', en: 'voices, art, music, trademarks', zh: '配音、美术、音乐、商标', ko: '목소리·그림·음악·상표' }, prev: { ja: '前へ', en: 'Previous', zh: '上一个', ko: '이전' }, next: { ja: '次へ', en: 'Next', zh: '下一个', ko: '다음' } };
  const nav = document.createElement('nav'); nav.className = 'dnav'; nav.setAttribute('aria-label', 'Choose another demo');
  const prev = DEMOS[cur - 1], next = DEMOS[cur + 1];
  nav.innerHTML = `<a class="dn-step" href="${prev ? href(prev) : '#'}" title="${prev ? 'Previous: ' + prev.en : ''}" aria-label="Previous demo" ${prev ? '' : 'aria-disabled="true"'}>‹</a>`
    + `<button type="button" aria-expanded="false" aria-haspopup="true">☰ <span class="dn-label" data-w="demos">Demos</span>&nbsp;${cur + 1} / ${DEMOS.length}</button>`
    + `<a class="dn-step" href="${next ? href(next) : '#'}" title="${next ? 'Next: ' + next.en : ''}" aria-label="Next demo" ${next ? '' : 'aria-disabled="true"'}>›</a>`;
  // ‹ › / swipe feel instant (user 2026-11-08: switching demos is slow): when the page is idle, prefetch the neighbours' page + cover image
  addEventListener('load', () => (window.requestIdleCallback || ((f) => setTimeout(f, 1500)))(() => { if (navigator.connection?.saveData) return;
    for (const d of [next, prev]) if (d) for (const u of [href(d), `${href(d)}media/cover/${window.MoHeatSub?.lang || 'en'}.${innerWidth < 820 ? 'c1200' : 'w1280'}.webp`]) { const l = document.createElement('link'); l.rel = 'prefetch'; l.href = u; document.head.appendChild(l); } }), { once: true });
  const panel = document.createElement('div'); panel.className = 'dn-panel'; panel.hidden = true;
  const span = (gi) => { const n = DEMOS.map((d, i) => (d.group === gi ? i + 1 : 0)).filter(Boolean); return gi !== 4 ? (n.length > 1 ? ` · ${n[0]}–${n[n.length - 1]}` : ` · ${n[0]}`) : ''; };
  const count = (gi) => DEMOS.filter((d) => d.group === gi).length;   // level 1: category tabs (+ "all"); level 2: that category's demos
  const card = (d, i, top) => { const of = d.part ? DEMOS.filter((x) => x.series === d.series && x.part).length : 0;   // one menu card
    return `<a class="dn-card${i === cur ? ' is-cur' : ''}" href="${href(d)}"><img src="${thumb(i)}" data-t="${i}" alt="" loading="lazy"><span><em>${top && HEAT[d.dir] ? `<s data-heat="${HEAT[d.dir]}"></s> · ` : ''}Demo ${i + 1}${d.part && of > 1 ? ` · <span data-part="${d.part}/${of}"></span>` : ''}${d.new ? '<i>NEW</i>' : ''}</em><b data-d="${i}"></b>${i === cur ? '<small class="dn-now" data-w="now"></small>' : ''}</span></a>`; };
  // "Recommended" is its OWN top-level tab (user 2026-11-09: never mixed into the category lists); the categories show only their demos
  panel.innerHTML = `<div class="dn-tabs" role="tablist">${TOP.length ? `<button type="button" role="tab" data-g="top"><span data-w="rec"></span><i>${TOP.length}</i></button>` : ''}<button type="button" role="tab" data-g="all"><span data-w="all"></span><i>${DEMOS.length}</i></button>`
    + GROUPS.map((g, gi) => `<button type="button" role="tab" data-g="${gi}"><span data-gt="${gi}"></span><i>${count(gi)}</i></button>`).join('') + '</div>'
    + (TOP.length ? `<section class="dn-top" data-g="top"><h4 data-w="top"></h4><div class="dn-grid">${TOP.map((d) => card(d, DEMOS.indexOf(d), true)).join('')}</div></section>` : '')
    + GROUPS.map((g, gi) => `<section data-g="${gi}"><h4><span data-gt="${gi}"></span>${span(gi)}</h4><div class="dn-grid">` + DEMOS.map((d, i) => d.group !== gi ? '' :
    card(d, i)).join('') + '</div></section>').join('')
    + '<p class="dn-foot"><a href="../../../credits.html" data-w="credits"></a> · <span data-w="rights"></span> · © 2026 MoHeat Evo</p>';
  function paint() {   // texts in the display language; again whenever it changes
    for (const r of [nav, panel]) {
      r.querySelectorAll('[data-w]').forEach((e) => { e.textContent = pickT(W[e.dataset.w]); });
      r.querySelectorAll('[data-gt]').forEach((e) => { e.textContent = GT(+e.dataset.gt); });
      r.querySelectorAll('[data-d]').forEach((e) => { e.textContent = TITLE(DEMOS[+e.dataset.d]); }); r.querySelectorAll('[data-heat]').forEach((e) => { e.textContent = `${pickT(W.heat)} ${e.dataset.heat}`; });
      r.querySelectorAll('[data-part]').forEach((e) => { const l = LG(), [n, of] = e.dataset.part.split('/'); e.textContent = l === 'en' ? `Part ${n} / ${of}` : l === 'ja' ? `第${n}話 / 全${of}話` : l === 'ko' ? `${n}화 / 전 ${of}화` : `第${n}集 / 共${of}集`; });
    }
    // thumbnails in the display language (assets/images/demos/<dir>.<lang>.jpg from tools/web/thumbs.py; missing → <dir>.jpg)
    panel.querySelectorAll('img[data-t]').forEach((im) => { const i = +im.dataset.t, src = thumb(i, LG()); if (im.dataset.l === LG()) return; im.dataset.l = LG(); im.onerror = () => { im.onerror = null; im.src = thumb(i); }; im.src = src; });
    const st = nav.querySelectorAll('.dn-step');
    if (prev) st[0].title = `${pickT(W.prev)}: ${TITLE(prev)}`; if (next) st[1].title = `${pickT(W.next)}: ${TITLE(next)}`;
  }
  paint(); addEventListener('moheat:sublang', paint);
  const show = (g) => { panel.querySelectorAll('.dn-tabs button').forEach((b) => b.setAttribute('aria-selected', b.dataset.g === String(g))); panel.querySelectorAll('section').forEach((x) => { x.hidden = String(g) === 'top' ? x.dataset.g !== 'top' : x.dataset.g === 'top' || (g !== 'all' && x.dataset.g !== String(g)); }); };   // Recommended = its own tab only
  panel.querySelector('.dn-tabs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { e.stopPropagation(); show(b.dataset.g); } });
  show(cur >= 0 ? DEMOS[cur].group : 'all');
  const brand = bar.querySelector('.brand');
  (brand ? brand.after(nav) : bar.prepend(nav)); document.body.appendChild(panel);
  const btn = nav.querySelector('button');
  const open = (v) => { panel.hidden = !v; btn.setAttribute('aria-expanded', String(v)); };
  btn.addEventListener('click', (e) => { e.stopPropagation(); open(panel.hidden); });
  document.addEventListener('click', (e) => { if (!panel.hidden && !panel.contains(e.target)) open(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') open(false); });
  if (location.hash === '#demos') open(true);
})();
