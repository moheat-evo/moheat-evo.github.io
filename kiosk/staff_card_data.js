// The staff cheat sheet, one structure in three languages (content as data, DEMO_DESIGN_GUIDE §14). Rendered by kiosk/staff_card.html (A4, one page per
// language); docs/kiosk_staff_card.md is generated from this file: node tools/web/staff_card_md.js (--check = exit 1 when out of date).
// **bold** and `code` work in every string. Keep each language on one A4 page (check the PDF after editing).
(() => {
  const URL = 'https://moheat-evo.github.io/kiosk/?kiosk=1';
  const CARD = {
    zh: {
      lang: 'zh-CN', name: '中文', title: '展示速查卡',
      head: [['网址', `\`${URL}\``], ['工作人员面板', '**长按**左上角的 **工作人员** 按钮约 1.5 秒 → PIN（初始 `0000`，请马上修改，不要写在这张卡上）。Demo 进行中打开面板会结束当前体验。']],
      sections: [
        { h: '开机（约 5 分钟）', steps: [
          '电脑接电源；**关闭睡眠、屏保、通知**（macOS 终端：`caffeinate -dis &`）。',
          '系统声音输出选**降噪入耳式耳机**。用 Chrome 打开上面的网址，全屏（macOS `⌃⌘F`，Windows `F11`）。',
          '接上 MoHeat Evo → 面板 Device：**+ Add** 选设备 → **Connect**，右上角小圆点变绿。授权一次后会自动连接。',
          '屏幕 2：显示器设为「扩展」→ 面板 **Open queue screen** → 窗口拖到屏幕 2 → 按 `F` 全屏。默认播放宣传视频 + 二维码，没有视频时显示实时冷热画面。',
          '看一眼排队开关，然后自己完整走一遍。',
        ] },
        { h: '每位访客', steps: [
          '访客点 Start，或点排队时用手机选好的**号码**，戴上**降噪入耳式耳机**（L 左 R 右），自己做左右和音量测试。',
          '屏幕出现「声音没问题？」→ 向访客确认 → 点 **继续（工作人员）**。',
          '戴之前**请访客把头发别到耳后、露出耳朵**（隔着头发感觉不到冷热）。',
          '**把大的 MoHeat Evo 头戴设备戴在入耳式耳机外面** → 点 **继续** → 左暖、右暖、左凉、右凉各 2 秒。',
          '屏幕出现「两边都感觉到了？」→ 向访客确认 → 点 **继续**。',
          '访客自己完成：暖、凉校准（快要不舒服时按 STOP）→ 焰、小雪试听（太弱 / 刚好 / 太强）→ **一个完整的 Demo**（从头到尾）。',
          '结束：冷热自动停止 →「请先摘下 MoHeat Evo」→ **帮访客取下，点继续** → 访客取下入耳式耳机 → 体验卡 → 感谢 + 二维码 → 自动回到欢迎画面。',
        ] },
        { h: '排队开关 · 在场开关', items: [
          '**长按左下角小圆点约 1 秒**，或按键盘 `Q`（欢迎、选 Demo 等画面可用；引导中和 Demo 播放中不能切换）。不用 PIN，一直保持到下次切换。',
          '**橙色 = 有人排队**：每人 1 个 Demo（展会默认）。**灰色 = 没人排队**：可以继续体验别的 Demo，不用重新引导。',
          '**离开展台时**：长按左下角**第二个小圆点**，或按 `S` → 红色 = 无人：整屏「请勿触摸」、冷热停止、点按无效，排队屏同步。回来后再按一次（绿色 = 在场，回到欢迎画面）。立牌：面板 **Print signs**。',
        ] },
        { h: '常见问题', faq: [
          ['没有声音', '系统输出是不是降噪入耳式耳机 → 系统音量 → 页面右下的音量滑块'],
          ['输出确认时没感觉', 'MoHeat Evo 是否端正地罩住双耳 → 小圆点是否绿色 → 面板 Connect → 点「有问题」→「再检查一次」'],
          ['太热 / 太凉，要马上停', '点右上角 **■ STOP**；校准时点屏幕任意位置。之后在面板调低暖 / 凉上限（Warm cap / Cool cap）'],
          ['「MoHeat Evo 已断开」大提示', '重新插好，几秒后会自动连接；连不上就到面板 Connect'],
          ['画面卡住', '按 `⌘R` / `F5` 刷新；还不行就关掉浏览器，重新打开网址'],
          ['访客中途离开', '引导中点「跳过」，60 秒后自动回到欢迎画面；Demo 中点「✕ 结束」'],
          ['没有网络', '事先在面板点过 **Save all demos for offline** 就能继续'],
        ] },
        { h: '收展', items: [ '面板 **Daily report**（当天小结）+ **Export CSV / JSON** 存到 U 盘。数据只在这台电脑的浏览器里，不会上传，清除浏览器数据前务必导出。最后一天：**Exit kiosk mode**。卫生：每位访客后擦拭入耳式耳机和 MoHeat Evo。' ] },
      ],
    },
    ja: {
      lang: 'ja', name: '日本語', title: 'スタッフ用クイックガイド',
      head: [['URL', `\`${URL}\``], ['スタッフパネル', '画面左上の **スタッフ** ボタンを **約 1.5 秒長押し** → PIN（初期値 `0000`。すぐに変更し、このカードには書かないでください）。体験中に開くと、その体験は終了します。']],
      sections: [
        { h: '起動（約 5 分）', steps: [
          'PC を電源につなぎ、**スリープ・スクリーンセーバー・通知をオフ**にします（macOS のターミナル：`caffeinate -dis &`）。',
          'サウンド出力を**ノイズキャンセリングイヤホン**に設定。Chrome で上記 URL を開き、全画面にします（macOS `⌃⌘F`、Windows `F11`）。',
          'MoHeat Evo を接続 → パネルの Device で **+ Add** からデバイスを選び **Connect**。右上の小さな丸が緑になれば OK。一度許可すれば、次回から自動で接続します。',
          '2 画面目：ディスプレイを「拡張」に設定 → パネルの **Open queue screen** → ウィンドウを 2 画面目へドラッグ → `F` キーで全画面。通常はプロモ動画と QR コードを表示し、動画がないときは温冷のライブ画面を表示します。',
          '待機列スイッチを確認し、スタッフ自身で一度、最初から最後まで体験してください。',
        ] },
        { h: 'お客様ごとの流れ', steps: [
          'お客様が Start、または並んでいる間にスマホで選んだ**番号**をタップ。**ノイズキャンセリングイヤホン**（L が左、R が右）を着けて、左右と音量のテストをご自身で行います。',
          '「音は大丈夫ですか？」と表示されたら、お客様に確認して **続ける（スタッフ）** をタップ。',
          '装着の前に、**髪を耳にかけて耳を出してもらう**（髪の上からだと温冷を感じません）。',
          '**イヤホンの上から、大きな MoHeat Evo をお客様に装着** → **続ける** → 左温・右温・左冷・右冷を各 2 秒出力します。',
          '「左右で温かさと冷たさを感じましたか？」と表示されたら、お客様に確認して **続ける** をタップ。',
          'ここからはお客様ご自身で：温・冷の強さ調整（少しつらいと感じたら STOP）→ 焰と小雪の試聴（弱すぎる／ちょうどいい／強すぎる）→ **デモを 1 本、最後まで**。',
          '終了時：温冷は自動で停止 →「まず MoHeat Evo を外してください」→ **外すのを手伝い、続けるをタップ** → お客様がイヤホンを外す → アンケート → お礼と QR コード → 自動で最初の画面に戻ります。',
        ] },
        { h: '待機列・スタッフ在席スイッチ', items: [
          '**画面左下の小さな丸を約 1 秒長押し**、またはキーボードの `Q`（最初の画面やデモ選択の画面で使えます。案内の途中とデモ再生中は切り替えられません）。PIN は不要で、次に切り替えるまで保持されます。',
          '**オレンジ＝待ちの列あり**：お一人様 1 デモ（展示会の初期設定）。**グレー＝列なし**：案内なしで別のデモも続けて体験できます。',
          '**ブースを離れるとき**：左下の **2 つ目の小さな丸**を長押し、または `S` → 赤＝無人：全画面に「お手を触れないでください」、温冷は停止、タップは無効、待機列画面も連動。戻ったらもう一度（緑＝スタッフあり、最初の画面へ）。立て札：パネルの **Print signs**。',
        ] },
        { h: 'よくあるトラブル', faq: [
          ['音が出ない', 'サウンド出力がイヤホンになっているか → PC の音量 → 画面右下の音量スライダー'],
          ['出力チェックで何も感じない', 'MoHeat Evo が両耳にしっかり掛かっているか → 右上の丸が緑か → パネルで Connect →「うまくいかない」→「もう一度」'],
          ['熱い／冷たい、すぐ止めたい', '右上の **■ STOP**。強さ調整中は画面のどこをタップしても止まります。その後、パネルで上限（Warm cap / Cool cap）を下げてください'],
          ['「接続が切れました」と大きく表示', '接続し直すと数秒で自動的につながります。つながらないときはパネルで Connect'],
          ['画面が固まった', '`⌘R` / `F5` で再読み込み。直らなければブラウザを閉じて URL を開き直す'],
          ['お客様が途中で帰った', '案内中は「スキップ」、60 秒後に最初の画面へ戻ります。デモ中は「✕ 終わる」'],
          ['ネットがつながらない', '事前にパネルの **Save all demos for offline** を済ませていれば、そのまま使えます'],
        ] },
        { h: '撤収', items: [ 'パネルの **Daily report**（当日のまとめ）と **Export CSV / JSON** を USB メモリに保存。データはこの PC のブラウザ内にしかなく、外部には送信されません。ブラウザのデータを消す前に必ず書き出してください。最終日は **Exit kiosk mode**。衛生面：お客様ごとにイヤホンと MoHeat Evo を拭いてください。' ] },
      ],
    },
    en: {
      lang: 'en', name: 'English', title: 'Staff quick guide',
      head: [['URL', `\`${URL}\``], ['Staff panel', '**Press and hold** the **Staff** button (top left) for about 1.5 s → PIN (first `0000`: change it at once and do not write it on this card). Opening it during a demo ends that visit.']],
      sections: [
        { h: 'Start-up (about 5 min)', steps: [
          'Plug in the computer; **turn off sleep, screen saver and notifications** (macOS Terminal: `caffeinate -dis &`).',
          'Set the sound output to the **noise-cancelling earbuds**. Open the URL above in Chrome and go fullscreen (macOS `⌃⌘F`, Windows `F11`).',
          'Connect MoHeat Evo → panel, Device: **+ Add**, pick the device, **Connect**; the small dot top right turns green. After this first time it connects by itself.',
          'Screen 2: set the displays to “extend” → panel **Open queue screen** → drag the window to screen 2 → press `F` for fullscreen. It plays the promo video + QR, or the live warm / cool view when there is no video.',
          'Check the queue switch, then run through a whole visit yourself.',
        ] },
        { h: 'Each visitor', steps: [
          'The visitor taps Start, or the **number** they picked on their phone in the queue, puts in the **noise-cancelling earbuds** (L left, R right) and does the left / right and volume test.',
          '“Sound OK?” appears → check with the visitor → tap **Continue (staff)**.',
          'Before it goes on, **ask the visitor to tuck their hair behind their ears** (warmth and coolness can’t be felt through hair).',
          '**Place the big MoHeat Evo headset over the earbuds** → **Continue** → left warm, right warm, left cool, right cool, 2 s each.',
          '“Felt warm and cool on both sides?” appears → check with the visitor → tap **Continue**.',
          'The visitor does the rest: warm and cool calibration (STOP when almost uncomfortable) → Homura and Koyuki samples (too weak / just right / too strong) → **one complete demo**, start to end.',
          'At the end: warm / cool stops by itself → “Please take off the MoHeat Evo headset first” → **help remove it, tap Continue** → the visitor removes the earbuds → experience card → thank-you + QR → back to the welcome screen by itself.',
        ] },
        { h: 'Queue switch · staff switch', items: [
          '**Long-press the tiny dot bottom left for about 1 s**, or press `Q` (on the welcome, menu and end screens; not during the intro or while a demo plays). No PIN; it stays until changed.',
          '**Orange = people are queuing**: one demo each (the show default). **Grey = nobody queuing**: the visitor may try another demo without repeating the intro.',
          '**Leaving the booth**: long-press the **second tiny dot** bottom left, or press `S` → red = unattended: a full “please do not touch” screen, warm / cool off, taps ignored, the queue screen follows. Back: the same again (green = staff here, back to the welcome screen). Stand-up signs: panel **Print signs**.',
        ] },
        { h: 'Troubleshooting', faq: [
          ['No sound', 'Is the output the earbuds? → system volume → the volume slider bottom right'],
          ['Nothing felt in the output check', 'Hair behind the ears (skin showing)? → MoHeat Evo sitting squarely over both ears? → dot green? → panel Connect → “Something’s wrong” → “Check again”'],
          ['Too hot / cold, stop now', 'Tap **■ STOP** top right; during calibration tap anywhere. Then lower Warm cap / Cool cap in the panel'],
          ['Big “MoHeat Evo disconnected” alert', 'Plug it back in: it reconnects in a few seconds; otherwise panel Connect'],
          ['Frozen picture', 'Reload (`⌘R` / `F5`); if that fails, close the browser and open the URL again'],
          ['Visitor walks away', 'In the intro tap Skip: the welcome screen returns after 60 s. In a demo tap “✕ End”'],
          ['No internet', 'Works if **Save all demos for offline** was run in the panel beforehand'],
        ] },
        { h: 'Closing', items: [ 'Panel **Daily report** (the day’s summary) + **Export CSV / JSON** to a USB stick. The data exists only in this browser and is never uploaded: export before clearing browser data. Last day: **Exit kiosk mode**. Hygiene: wipe the earbuds and the MoHeat Evo headset after each visitor.' ] },
      ],
    },
  };
  if (typeof window !== 'undefined') window.MOHEAT_STAFF_CARD = CARD; else module.exports = CARD;
})();
