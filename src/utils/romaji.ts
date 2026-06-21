export interface SyllableState {
  kana: string;     // The original Hiragana cluster, e.g. "きょ", "っし", "ん"
  options: string[]; // List of valid Romaji representations, e.g. ["kyo"] or ["shi", "si"]
}

const YOON_MAP: Record<string, string[]> = {
  "きゃ": ["kya"], "きゅ": ["kyu"], "きょ": ["kyo"],
  "ぎゃ": ["gya"], "ぎゅ": ["gyu"], "ぎょ": ["gyo"],
  "しゃ": ["sha", "sya"], "しゅ": ["shu", "syu"], "しょ": ["sho", "syo"],
  "じゃ": ["ja", "zya", "jya"], "じゅ": ["ju", "zyu", "jyu"], "じょ": ["jo", "zyo", "jyo"],
  "ちゃ": ["cha", "tya", "cya"], "ちゅ": ["chu", "tyu", "cyu"], "ちょ": ["cho", "tyo", "cyo"],
  "ぢゃ": ["dya"], "ぢゅ": ["dyu"], "ぢょ": ["dyo"],
  "にゃ": ["nya"], "にゅ": ["nyu"], "にょ": ["nyo"],
  "ひゃ": ["hya"], "ひゅ": ["hyu"], "ひょ": ["hyo"],
  "びゃ": ["bya"], "びゅ": ["byu"], "びょ": ["byo"],
  "ぴゃ": ["pya"], "ぴゅ": ["pyu"], "ぴょ": ["pyo"],
  "みゃ": ["mya"], "みゅ": ["myu"], "みょ": ["myo"],
  "りゃ": ["rya"], "りゅ": ["ryu"], "りょ": ["ryo"],
  "てぃ": ["thi", "tyi"], "でぃ": ["dhi", "dyi"],
  "ふぁ": ["fa"], "ふぃ": ["fi"], "ふぇ": ["fe"], "ふぉ": ["fo"],
  "うぁ": ["wha"], "うぃ": ["wi", "whi"], "うぇ": ["we", "whe"], "うぉ": ["who"],
  "つぁ": ["tsa"], "つぃ": ["tsi"], "つぇ": ["tse"], "つぉ": ["tso"],
  "ヴぁ": ["va"], "ヴぃ": ["vi"], "ヴぇ": ["ve"], "ヴぉ": ["vo"], "ヴゅ": ["vyu"],
};

const GOJUON_MAP: Record<string, string[]> = {
  "あ": ["a"], "い": ["i", "yi"], "う": ["u", "wu"], "え": ["e"], "お": ["o"],
  "か": ["ka", "ca"], "き": ["ki"], "く": ["ku", "cu", "qu"], "け": ["ke"], "こ": ["ko", "co"],
  "さ": ["sa"], "し": ["shi", "si"], "す": ["su"], "せ": ["se"], "そ": ["so"],
  "た": ["ta"], "ち": ["chi", "ti"], "つ": ["tsu", "tu"], "て": ["te"], "と": ["to"],
  "な": ["na"], "に": ["ni"], "ぬ": ["nu"], "ね": ["ne"], "の": ["no"],
  "は": ["ha"], "ひ": ["hi"], "ふ": ["fu", "hu"], "へ": ["he"], "ほ": ["ho"],
  "ま": ["ma"], "み": ["mi"], "む": ["mu"], "め": ["me"], "も": ["mo"],
  "や": ["ya"], "ゆ": ["yu"], "よ": ["yo"],
  "ら": ["ra"], "り": ["ri"], "る": ["ru"], "れ": ["re"], "ろ": ["ro"],
  "わ": ["wa"], "を": ["wo"], 
  "が": ["ga"], "ぎ": ["gi"], "ぐ": ["gu"], "げ": ["ge"], "ご": ["go"],
  "ざ": ["za"], "じ": ["ji", "zi"], "ず": ["zu"], "ぜ": ["ze"], "ぞ": ["zo"],
  "だ": ["da"], "ぢ": ["di", "du"], "づ": ["du"], "で": ["de"], "ど": ["do"],
  "ば": ["ba"], "び": ["bi"], "ぶ": ["bu"], "べ": ["be"], "ぼ": ["bo"],
  "ぱ": ["pa"], "ぴ": ["pi"], "ぷ": ["pu"], "ぺ": ["pe"], "ぽ": ["po"],
  "ぁ": ["la", "xa"], "ぃ": ["li", "xi"], "ぅ": ["lu", "xu"], "ぇ": ["le", "xe"], "ぉ": ["lo", "xo"],
  "ゃ": ["lya", "xya"], "ゅ": ["lyu", "xyu"], "ょ": ["lyo", "xyo"],
  "っ": ["xtsu", "ltu", "xtu", "ltu"],
  "ー": ["-"], "。": ["."], "、": [","], "？": ["?"], "！": ["!"], "・": ["/"],
};

export function tokenizeKana(kana: string): SyllableState[] {
  const result: SyllableState[] = [];
  let i = 0;
  
  while (i < kana.length) {
    const char = kana[i];
    // Skip full-width and half-width periods so they don't have to be typed
    if (char === "。" || char === ".") {
      i++;
      continue;
    }
    const nextChar = kana[i + 1] || "";
    const twoChars = char + nextChar;

    // 1. Double Consonant 'っ'
    if (char === "っ") {
      if (nextChar === "") {
        result.push({
          kana: "っ",
          options: ["xtsu", "ltu", "xtu"]
        });
        i++;
        continue;
      }

      // Check if next is YOON block
      const thirdChar = kana[i + 2] || "";
      const nextTwoChars = nextChar + thirdChar;
      
      if (YOON_MAP[nextTwoChars]) {
        const baseOptions = YOON_MAP[nextTwoChars];
        const options = baseOptions.map(opt => opt[0] + opt);
        result.push({
          kana: "っ" + nextTwoChars,
          options
        });
        i += 3;
        continue;
      }
      
      // Check if next is GOJUON block
      if (GOJUON_MAP[nextChar]) {
        const baseOptions = GOJUON_MAP[nextChar];
        const options = baseOptions.map(opt => opt[0] + opt);
        result.push({
          kana: "っ" + nextChar,
          options
        });
        i += 2;
        continue;
      }

      // Standalone/Fallback
      result.push({
        kana: "っ",
        options: ["xtsu", "ltu", "xtu"]
      });
      i++;
      continue;
    }

    // 2. Syllable 'ん' (N/NN)
    if (char === "ん") {
      let nextIsVowelOrY = false;
      if (nextChar) {
        const isVowelStr = "あいうえおやゆよぁぃぅぇぉゃゅょ";
        if (isVowelStr.includes(nextChar)) {
          nextIsVowelOrY = true;
        } else {
          const thirdChar = kana[i + 2] || "";
          const nextTwo = nextChar + thirdChar;
          if (YOON_MAP[nextTwo]) {
            nextIsVowelOrY = true;
          }
        }
      }

      result.push({
        kana: "ん",
        options: nextIsVowelOrY ? ["nn"] : ["n", "nn"]
      });
      i++;
      continue;
    }

    // 3. YOON (拗音) Multi-Character Match
    if (YOON_MAP[twoChars]) {
      result.push({
        kana: twoChars,
        options: YOON_MAP[twoChars]
      });
      i += 2;
      continue;
    }

    // 4. GOJUON (直音) Single-Character Match
    if (GOJUON_MAP[char]) {
      result.push({
        kana: char,
        options: GOJUON_MAP[char]
      });
      i++;
      continue;
    }

    // 5. Raw character fallback (English keywords, spaces, full-width / half-width marks)
    result.push({
      kana: char,
      options: [char.toLowerCase()]
    });
    i++;
  }

  return result;
}
