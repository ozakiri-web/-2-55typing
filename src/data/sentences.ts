export interface TypingSentence {
  id: string;
  kanji: string;      // The display text with kanji
  kana: string;       // Hiragana pronunciation guide
  romaji: string;     // The exact romaji characters expected for typing
  meaning?: string;   // Short explanation
}

export const PRACTICE_SENTENCES: TypingSentence[] = [
  {
    id: "p1",
    kanji: "吾輩は猫である。",
    kana: "わがはいはねこである。",
    romaji: "wagahaihanekodearu.",
    meaning: "夏目漱石『吾輩は猫である』"
  },
  {
    id: "p2",
    kanji: "メロスは激怒した。",
    kana: "めろすはげきどした。",
    romaji: "merosuhagekidoshita.",
    meaning: "太宰治『走れメロス』"
  },
  {
    id: "p3",
    kanji: "恥の多い生涯。",
    kana: "はじのおおいしょうがい。",
    romaji: "hajinoooishougai.",
    meaning: "太宰治『人間失格』"
  },
  {
    id: "p4",
    kanji: "雪国であった。",
    kana: "ゆきぐにであった。",
    romaji: "yukigunideatta.",
    meaning: "川端康成『雪国』"
  },
  {
    id: "p5",
    kanji: "雨ニモマケズ。",
    kana: "あめにもまけず。",
    romaji: "amenimomakezu.",
    meaning: "宮沢賢治"
  },
  {
    id: "p6",
    kanji: "一期一会",
    kana: "いちごいちえ",
    romaji: "ichigoichie",
    meaning: "一生に一度の出会い"
  },
  {
    id: "p7",
    kanji: "七転八起",
    kana: "しちてんはっき",
    romaji: "shichitenhakki",
    meaning: "何度倒れても立ち上がる"
  },
  {
    id: "p8",
    kanji: "温故知新",
    kana: "おんこちしん",
    romaji: "onkochishin",
    meaning: "過去から新しい智恵を学ぶ"
  },
  {
    id: "p9",
    kanji: "明鏡止水",
    kana: "めいきょうしすい",
    romaji: "meikyoushisui",
    meaning: "静かに澄み渡った心境"
  },
  {
    id: "p10",
    kanji: "コードが動かない。",
    kana: "こーどがうごかない。",
    romaji: "koodogaugokanai.",
    meaning: "トラブルシューティング時の謎"
  },
  {
    id: "p11",
    kanji: "ローカルでは動く。",
    kana: "ろーかるではうごく。",
    romaji: "rookarudehaugoku.",
    meaning: "開発者の定番のつぶやき"
  },
  {
    id: "p12",
    kanji: "バグを修正する。",
    kana: "ばぐをしゅうせいする。",
    romaji: "baguwoshuuseisuru.",
    meaning: "継続的なコードデトックス"
  },
  {
    id: "p13",
    kanji: "雨上がりの夕暮れ。",
    kana: "あめあがりのゆうぐれ。",
    romaji: "ameagarinoyuugure.",
    meaning: "澄んだ大気と路面の反射"
  },
  {
    id: "p14",
    kanji: "深夜のタイピング。",
    kana: "しんやのたいぴんぐ。",
    romaji: "shinyanotaipingu.",
    meaning: "静かで心地よいキー打鍵音"
  },
  {
    id: "p15",
    kanji: "星空に手を伸ばす。",
    kana: "ほしぞらにてをのばす。",
    romaji: "hoshizoranitewonobasu.",
    meaning: "高く遠い目標への憧れ"
  }
];
