export function isInappropriateName(name: string): boolean {
  if (!name) return false;

  // 1. Convert Katakana to Hiragana and make lowercase
  let normalized = name
    .replace(/[\u30a1-\u30f6]/g, (match) => {
      return String.fromCharCode(match.charCodeAt(0) - 0x60);
    })
    .toLowerCase();

  // 2. Clear spacing, digits, and standard delimiters, but keep mask symbols (○, ◯, ●, *, ×, etc.)
  normalized = normalized.replace(/[\s\d_\-~！@#￥%……&*（）——+=\\`\\[\]{};':",./<>?|～！？＠＃＄％＾＆＊（）——＋＝]/g, "");

  // 3. Define flexible matching patterns with support for common character masks
  const patterns = [
    // うんこ、う○こ、うこ、ウンコ、ウンこ
    /う[ん○◯●\*×☆★◆◇]?こ/i,
    // うんち、う○ち、ウンチ
    /う[ん○◯●\*×☆★◆◇]?ち/i,
    // しね、死ね、し○、死ね
    /し[ね○◯●\*×☆★◆◇]/i,
    /死[ね○◯●\*×☆★◆◇]/i,
    // ころす、殺す、ころ○
    /ころす/i,
    /殺す/i,
    /こ[ろ○◯●\*×☆★◆◇]?す/i,
    /殺[す○◯●\*×☆★◆◇]/i,
    // くそ、クソ、く○
    /く[そ○◯●\*×☆★◆◇]/i,
    // ばか、バカ、ば○、馬鹿
    /ば[か○◯●\*×☆★◆◇]/i,
    /馬鹿/i,
    /ばか/i,
    // あほ、アホ、あ○
    /あ[ほ○◯●\*×☆★◆◇]/i,
    // かす、カス、か○
    /か[す○◯●\*×☆★◆◇]/i,
    // ちんこ、チンコ、ち○こ
    /ち[ん○◯●\*×☆★◆◇]?こ/i,
    // まんこ、マンコ、ま○こ
    /ま[ん○◯●\*×☆★◆◇]?こ/i,
    // おめこ、お○こ、おめ○
    /お[め○◯●\*×☆★◆◇]?こ/i,
    // せっくす、セックス、せ○くす
    /せっくす/i,
    /せ[○◯●\*×☆★◆◇]?くす/i,
    // きちがい、キチガイ
    /きちがい/i,

    // English bad words (still standard check)
    /fuck/i,
    /shit/i,
    /bitch/i,
    /asshole/i,
    /cunt/i,
    /dick/i,
    /pussy/i,
    /rape/i,
    /sex/i,
    /cock/i
  ];

  return patterns.some(pattern => pattern.test(normalized));
}
