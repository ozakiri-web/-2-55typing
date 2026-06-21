import React, { useMemo } from "react";
import { Brain, RefreshCw, Sparkles, CheckCircle, AlertTriangle, Keyboard } from "lucide-react";
import { TypingSentence, TypingCategory } from "../types";

// Database of rich target sentences centered around specific romaji keys for weak-key practice
const KEY_WORD_BANK: Record<string, { kanji: string; kana: string; romaji: string }[]> = {
  a: [
    { kanji: "静かな青い空。", kana: "しずかなあおいそら。", romaji: "sizukanaaoisora." },
    { kanji: "明るい朝の挨拶。", kana: "あかるいあさのあいさつ。", romaji: "akaruiasanoaisatsu." },
    { kanji: "新しい明日の始まり。", kana: "あたらしいあしたのはじまり。", romaji: "atarashiiazitahonazimari." }
  ],
  i: [
    { kanji: "命の息吹を感じる。", kana: "いのちのいぶきをかんじる。", romaji: "inochinoibukiwokanziru." },
    { kanji: "急ぎの仕事に取り掛かる。", kana: "いそぎのしごとにとりかかる。", romaji: "isoginoshigotonitorikakaru." },
    { kanji: "美味しいイチゴ大福。", kana: "おいしいいちごだいふく。", romaji: "oishiichigodaifuku." }
  ],
  u: [
    { kanji: "美しい海の波の音。", kana: "うつくしいうみのなみのおと。", romaji: "utsukushiiuminonaminooto." },
    { kanji: "歌うように暮らしたい。", kana: "うたうようにくらしたい。", romaji: "utauyounikurashitai." },
    { kanji: "宇宙の果てを夢見る。", kana: "うちゅうのはてをゆめみる。", romaji: "uchuunohatewoyumemiru." }
  ],
  e: [
    { kanji: "映画のような出来事。", kana: "えい画のようなできごと。", kana_v: "えいがのようなできごと。", romaji: "eiganoyounadekigoto." } as any,
    { kanji: "笑顔の絶えない毎日。", kana: "えがおのたえないまいにち。", romaji: "egaonotaenaimainichi." },
    { kanji: "駅前の古い時計台。", kana: "えきまえのふるいとけいだい。", romaji: "ekimaenofuruitokeidai." }
  ],
  o: [
    { kanji: "穏やかな音楽の時間。", kana: "おだやかなおんがくのじかん。", romaji: "odayakanaongakunozikan." },
    { kanji: "同じ空の下で祈る。", kana: "おなじそらのしたでのる。", romaji: "onazisoranoshitadenoru." },
    { kanji: "大きな声を出す。", kana: "おおきなこえをだす。", romaji: "ookinakoewodasu." }
  ],
  k: [
    { kanji: "柿も栗も美味しい秋。", kana: "かきもくりもおいしいあき。", romaji: "kakimokurimooishiiaki." },
    { kanji: "画期的な企画の発表。", kana: "かっきてきなきかくのはっぴょう。", romaji: "kakkitekinakikakunohappyou." },
    { kanji: "価格の確認を怠らない。", kana: "かかくのかくにんをおこたらない。", romaji: "kakakunokakuninwookotaranai." }
  ],
  s: [
    { kanji: "寿司を美味しく頂く。", kana: "すしをおいしくいただく。", romaji: "sushiooishikitadaaku." } as any,
    { kanji: "清々しい朝の空気を吸う。", kana: "すがすがしいあさのくうきをすう。", romaji: "sugasugashiiasanokuukiwosuu." },
    { kanji: "組織の制作プロセス。", kana: "そしきのせいさくぷろせす。", romaji: "soshikinoseisakurosesu." } as any
  ],
  t: [
    { kanji: "徹底的に戦い抜く。", kana: "てっていてきにたたかいぬく。", romaji: "tetteitekinitatakainuku." },
    { kanji: "秩序ある土地の開発。", kana: "ちつじょあるとちのかいはつ。", romaji: "chitsujoarutochinokaihatsu." },
    { kanji: "月夜に手紙を書く。", kana: "つきよにてがみをかく。", romaji: "tsukiyonitegamiwokaku." }
  ],
  n: [
    { kanji: "謎に満ちた日常を紐解く。", kana: "なぞにみちにちじょうをひもとく。", romaji: "nazonimichitachijouwohimotoku." },
    { kanji: "納得のいく年間計画。", kana: "なっとくのいくねんかんけいかく。", romaji: "nattokunoikunenkankeikaku." },
    { kanji: "七回のチャンスを活かす。", kana: "ななかいのちゃんすをいかす。", romaji: "nanakainochansewoikasu." } as any
  ],
  h: [
    { kanji: "母の笑顔は日々美しい。", kana: "ははのえがおはひびうつくしい。", romaji: "hahanoegaohahibiutsukushii." },
    { kanji: "評判の良い変化を求める。", kana: "ひょうばんのよいへんかをもとめる。", romaji: "hyoubanneronoihenkawomotomer." } as any,
    { kanji: "避難経路をしっかり確認。", kana: "ひなんけいろをしっかりかくにん。", romaji: "hinankeilowoshikkarikakunin." }
  ],
  m: [
    { kanji: "耳に残る懐かしい名前。", kana: "みみにのこるなつかしいなまえ。", romaji: "mimininokorunatsukashiinamae." },
    { kanji: "未来の物語を夢想する。", kana: "みらいのものがたりをむそうする。", romaji: "mirainomonogatariwomusousuru." },
    { kanji: "明白な答えを見つける。", kana: "めいはくなこたえをみつける。", romaji: "meihakunakotaewomitsukeru." }
  ],
  y: [
    { kanji: "山頂からの素晴らしい夜空。", kana: "さんちょうからのすばらしいよぞら。", romaji: "sanchoukaranosubarashiiyozora." },
    { kanji: "夢のような約束を交わす。", kana: "ゆめのようなやくそくをかわす。", romaji: "yumenoyounayakusokuwokawasu." },
    { kanji: "用意周到に進める。", kana: "よういしゅうとうにすすめる。", romaji: "youishuutounisusumeru." }
  ],
  r: [
    { kanji: "歴史の研究を理解する。", kana: "れきしのけんきゅうをりかいする。", romaji: "rekishinokenkyuuworikaisuru." },
    { kanji: "流麗な廊下を走り抜ける。", kana: "りゅうれいなろうかをはしりぬける。", romaji: "ryuureinaroukawahashirinukeru." } as any,
    { kanji: "連絡事項を迅速に伝える。", kana: "れんらくじこうをじんそくにつたえる。", romaji: "renrakujikouwojinsokunitsutaeru." }
  ],
  w: [
    { kanji: "私の話題で盛り上がる。", kana: "わたしのわだいでもりあがる。", romaji: "watashinowadaidemoshiagaru." } as any,
    { kanji: "和音の美しい笑顔。", kana: "わおんのうつくしいえがお。", romaji: "waonnoutsukushiiegao." },
    { kanji: "平和な世界の実現。", kana: "へいわなせかいのじつげん。", romaji: "heiwanasekainojitsugen." }
  ],
  g: [
    { kanji: "学校の美しい銀河鉄道。", kana: "がっこうのうつくしいぎんがてつどう。", romaji: "gakkounoutsukushiigingatetsudou." },
    { kanji: "技術的な外国との協力。", kana: "ぎじゅつてきながいこくとのきょうりょく。", romaji: "gijutsutekinagaikokutonokyouryoku." },
    { kanji: "軍隊の厳しい規則のもとで。", kana: "ぐんたいのきびしいきそくのもとで。", romaji: "guntaitokibishiikisokunomotode." } as any
  ],
  z: [
    { kanji: "座席の確認を全然しない。", kana: "ざせきのかくにんをぜんぜんしない。", romaji: "zasekikokakuninzenzenshinai." } as any,
    { kanji: "雑音を遮断して頭脳を動かす。", kana: "ざつおんをしゃだんしてずのうをうごかす。", romaji: "zatsuonwoshadanshitezunouwogokasu." } as any,
    { kanji: "図形の美しい角度を測定。", kana: "ずけいのうつくしいかくどをそくてい。", romaji: "zukeinoutsukushiikakudosokutei." } as any
  ],
  d: [
    { kanji: "伝統的な道具を愛する。", kana: "でんとうてきなどうぐをあいする。", romaji: "dentoutekinadouguwoaisuru." },
    { kanji: "電話で同意を得る。", kana: "でんわでどういをえる。", romaji: "denwadadouiwoweru." } as any,
    { kanji: "団子をたくさん食べる。", kana: "だんごをたくさんたべる。", romaji: "dangowotakusantaberu." }
  ],
  b: [
    { kanji: "新しい場所の文化を学ぶ。", kana: "あたらしいばしょのぶんかをまなぶ。", romaji: "atarashiibashonobunkawomanabu." },
    { kanji: "微妙な文芸のニュアンス。", kana: "びみょうなぶんげいのにゅあんす。", romaji: "bimyounabungeinonyuansu." },
    { kanji: "武器を使わない世界を作る。", kana: "ぶきをつかわないせかいをつくる。", romaji: "bukiwotsukawanaisekaiwotsukuru." }
  ],
  p: [
    { kanji: "パソコンでパスタを注文する。", kana: "ぱそこんでぱすたをちゅうもんする。", romaji: "pasokondepasutawachuumonsuru." } as any,
    { kanji: "天ぷらのピンチを防ぐ。", kana: "てんぷらのぴんちをふせぐ。", romaji: "tenpuranopinchiwofusegu." },
    { kanji: "郵便ポストに手紙を入れる。", kana: "ゆうびんぽすとにてがみをいれる。", romaji: "yuubinposutonitegamiwoireler." } as any
  ],
  j: [
    { kanji: "充実した時代の準備期間。", kana: "じゅうじつしたじだいのじゅんびきかん。", romaji: "juujitsushitajidainojunbikikan." },
    { kanji: "自由な議論を邪魔しない。", kana: "じゆうなぎろんをじゃましない。", romaji: "jiyuunagironwojamashinai." },
    { kanji: "迅速な除去作業のプロセス。", kana: "じんそくなじょきょさぎょうのぷろせす。", romaji: "jinsokunajokyosagyounoprocess." } as any
  ],
  c: [
    { kanji: "温かいお茶に注意する。", kana: "あたたかいおちゃにちゅういする。", romaji: "atatakaiochanichuuisuru." },
    { kanji: "注文の品を直接届ける。", kana: "ちゅうもんのしなをちょくせつとどける。", romaji: "chuumonnoshinachokusetsutodokeru." } as any,
    { kanji: "地力の違いを見せつける設計。", kana: "ちりょくのちがいをみせつけるせっけい。", romaji: "chiryokunochigaiwomisetsukerusekkei." }
  ],
  f: [
    { kanji: "風船が深い空へ飛んでいく。", kana: "ふうせんがふかいそらへとんでいく。", romaji: "fuusengafukaisorahetondeiku." },
    { kanji: "手の震えによる不満の表明。", kana: "てのふるえによるふまんのひょうめい。", romaji: "tenofuruekiyorufumannohyoumei." } as any,
    { kanji: "予算を増やす決断。", kana: "よさんをふやすけつだん。", romaji: "yosanwofuyasuketsudan." }
  ]
};

// Default fallback list of words when custom keys have no specific bank
const GENERAL_FALLBACK: { kanji: string; kana: string; romaji: string }[] = [
  { kanji: "敏迅速なタイピング。", kana: "じんそくなたいぴんぐ。", romaji: "jinsokunataipingu." },
  { kanji: "一打一打を噛みしめる。", kana: "いちだいちだをかみしめる。", romaji: "ichidaichidawokamishimeru." },
  { kanji: "指先の軽いリズムダンス。", kana: "ゆびさきのかるいりずむだんす。", romaji: "yubisakinokaruirizumudansu." }
];

interface TypingAnalyzerProps {
  keyStats: Record<string, { typed: number; missed: number }>;
  onResetStats: () => void;
  onGenerateWeaknessCourse: (category: TypingCategory) => void;
}

export const TypingAnalyzer: React.FC<TypingAnalyzerProps> = ({
  keyStats,
  onResetStats,
  onGenerateWeaknessCourse
}) => {
  // Extract stats list
  const alphabetStats = useMemo(() => {
    const arr = "abcdefghijklmnopqrstuvwxyz".split("");
    return arr.map((char) => {
      const record = keyStats[char] || { typed: 0, missed: 0 };
      const total = record.typed + record.missed;
      const accuracy = total > 0 ? Math.round((record.typed / total) * 100) : 100;
      return {
        key: char,
        typed: record.typed,
        missed: record.missed,
        total,
        accuracy
      };
    });
  }, [keyStats]);

  // Identify top weak characters (accuracy < 92% and total typed/missed > 0, sorted by worst accuracy)
  const weakKeys = useMemo(() => {
    return alphabetStats
      .filter((item) => item.total > 0 && item.accuracy < 95)
      .sort((a, b) => {
        // Sort by accuracy (worst first), then by miss count (highest first)
        if (a.accuracy !== b.accuracy) {
          return a.accuracy - b.accuracy;
        }
        return b.missed - a.missed;
      });
  }, [alphabetStats]);

  // Handle generating specialized Weakness training course
  const triggerWeaknessCourse = () => {
    if (weakKeys.length === 0) {
      // If no weak keys found (everything typed perfectly or no logs), pick any 3 common difficult keys
      const mockWeakList = ["k", "s", "t"];
      generateAndDeliver(mockWeakList, "総合バランス基礎");
      return;
    }

    const targetLetters = weakKeys.slice(0, 4).map((k) => k.key);
    generateAndDeliver(targetLetters, `弱点克服 [${targetLetters.join(", ").toUpperCase()}]`);
  };

  const generateAndDeliver = (letters: string[], title: string) => {
    const sentencesList: TypingSentence[] = [];
    const usedIds = new Set<string>();

    letters.forEach((letter) => {
      const bank = KEY_WORD_BANK[letter] || GENERAL_FALLBACK;
      bank.forEach((item, index) => {
        const id = `weak_${letter}_${index}`;
        if (!usedIds.has(id)) {
          usedIds.add(id);
          sentencesList.push({
            id,
            kanji: item.kanji,
            kana: item.kana,
            romaji: item.romaji,
            meaning: `苦手キー「${letter.toUpperCase()}」を過密配列した特訓文`
          });
        }
      });
    });

    // If we gathered too few, pad with FALLBACK sentences
    if (sentencesList.length < 5) {
      GENERAL_FALLBACK.forEach((item, index) => {
        const id = `weak_fallback_${index}`;
        if (!usedIds.has(id)) {
          usedIds.add(id);
          sentencesList.push({
            id,
            kanji: item.kanji,
            kana: item.kana,
            romaji: item.romaji,
            meaning: "快適なタッチ感回復トレーニング文"
          });
        }
      });
    }

    // Slice to maximum 8 sentences to avoid fatigue
    const finalSentences = sentencesList.slice(0, 8);

    const weaknessCat: TypingCategory = {
      id: `custom_weakness_${Date.now()}`,
      name: `${title}`,
      emoji: "🛡️",
      description: `入力のズレやミスの多い【${letters.join(", ").toUpperCase()}】キーを自動抽出し、狙い撃ちで訓練する即興AIトレーニング。`,
      sentences: finalSentences
    };

    onGenerateWeaknessCourse(weaknessCat);
  };

  // Check some helpful advice
  const adviceMessage = useMemo(() => {
    if (weakKeys.length === 0) {
      return "大変素晴らしい打鍵履歴です！苦手なキーは検知されていません。その調子で安定したホームポジションを維持しましょう。";
    }
    const worst = weakKeys[0];
    const uppercaseWorst = worst.key.toUpperCase();
    let specifics = "";
    if (["a", "i", "u", "e", "o"].includes(worst.key)) {
      specifics = "母音キーが不安定な場合、全体の指の移動速度が低下しがちです。ホームポジションのあいうえおを繰り返し意識しましょう。";
    } else if (["k", "s", "t"].includes(worst.key)) {
      specifics = "「か行・さ行・た行」は日本語タイピングで驚異的な頻度を誇ります。ここをスムーズに叩けるとスピードが跳ね上がります！";
    } else {
      specifics = `「${uppercaseWorst}」キーは打鍵時の指の伸びが不十分になりやすい位置にあります。手首を固定して、指先だけを伸ばすように意識してください。`;
    }
    return `最も苦手と分析されたのは【${uppercaseWorst}】キー (正確度 ${worst.accuracy}%) です。${specifics}`;
  }, [weakKeys]);

  return (
    <div id="analytics-section" className="bg-[#090909] border border-[#1e1e1e] p-4.5 rounded-xl flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1f1f1f] pb-3.5">
        <div className="flex items-center gap-2">
          <Brain size={15} className="text-[#00ff88]" />
          <div>
            <h3 className="text-white text-xs font-bold leading-none">打鍵精密アナライザー</h3>
            <p className="text-[9px] text-[#555] font-mono mt-1 uppercase">Advanced keystroke deviation analyzer & error map</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onResetStats}
            title="統計データをリセット"
            className="p-1 px-2 bg-transparent text-[#555] hover:text-[#bbb] border border-[#1e1e1e] hover:border-[#333] rounded text-[9px] font-mono transition-colors flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw size={10} />
            <span>RESET</span>
          </button>
          
          <button
            onClick={triggerWeaknessCourse}
            className="px-3 py-1 bg-[#00ff88]/10 hover:bg-[#00ff88]/20 border border-[#00ff88]/30 hover:border-[#00ff88]/60 text-[#00ff88] text-[9.5px] font-bold rounded flex items-center gap-1.5 transition-all duration-150 cursor-pointer shadow-sm shadow-emerald-950/15"
          >
            <Sparkles size={11} className="animate-pulse" />
            <span>弱点克服コースを生成して練習</span>
          </button>
        </div>
      </div>

      {/* Advice banner */}
      <div className="p-3 bg-neutral-950 border border-[#1a1a1a] rounded-lg flex items-start gap-2 text-[10px] leading-relaxed text-neutral-400">
        {weakKeys.length > 0 ? (
          <AlertTriangle size={12} className="text-amber-500 shrink-0 mt-0.5 animate-pulse" />
        ) : (
          <CheckCircle size={12} className="text-[#00ff88] shrink-0 mt-0.5" />
        )}
        <div>
          <span className="font-bold text-white block mb-0.5">💡 個人向け最適化診断フィードバック</span>
          <p>{adviceMessage}</p>
        </div>
      </div>

      {/* Visual Keyboard Flame Heatmap of deviation */}
      <div>
        <h4 className="text-[9px] uppercase tracking-wider text-[#555] font-mono mb-2">アルファベット打鍵マップ・入力精度</h4>
        
        <div className="grid grid-cols-4 sm:grid-cols-7 md:grid-cols-13 gap-1.5">
          {alphabetStats.map((item) => {
            const hasData = item.total > 0;
            const isWeak = hasData && item.accuracy < 92;
            const isExcellent = hasData && item.accuracy >= 97;

            // Compute background and border colors based on accuracy state
            let borderStyle = "border-[#141414]";
            let bgStyle = "bg-[#0b0b0b]/40 text-[#444]";
            let subtext = "-";

            if (hasData) {
              subtext = `${item.accuracy}%`;
              if (isWeak) {
                borderStyle = "border-red-950/60";
                bgStyle = "bg-red-950/10 text-red-400";
              } else if (isExcellent) {
                borderStyle = "border-[#00ff88]/20";
                bgStyle = "bg-[#00ff88]/5 text-[#00ff88]";
              } else {
                borderStyle = "border-neutral-800";
                bgStyle = "bg-neutral-900/60 text-white";
              }
            }

            return (
              <div
                key={item.key}
                title={`Key ${item.key.toUpperCase()}: ${item.typed}回成功 / ${item.missed}回誤打 (成功率 ${item.accuracy}%)`}
                className={`py-1.5 px-1 rounded border ${borderStyle} ${bgStyle} flex flex-col items-center justify-between transition-all duration-150 relative group`}
              >
                <div className="text-[11px] font-bold font-mono tracking-tight">{item.key.toUpperCase()}</div>
                <div className="text-[7.5px] font-mono opacity-80 mt-0.5">{subtext}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
