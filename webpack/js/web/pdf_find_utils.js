
;// CONCATENATED MODULE: ./web/pdf_find_utils.js
const CharacterType = {
    SPACE: 0,
    ALPHA_LETTER: 1,
    PUNCT: 2,
    HAN_LETTER: 3,
    KATAKANA_LETTER: 4,
    HIRAGANA_LETTER: 5,
    HALFWIDTH_KATAKANA_LETTER: 6,
    THAI_LETTER: 7
  };
  function isAlphabeticalScript(charCode) {
    return charCode < 0x2e80;
  }
  function isAscii(charCode) {
    return (charCode & 0xff80) === 0;
  }
  function isAsciiAlpha(charCode) {
    return charCode >= 0x61 && charCode <= 0x7a || charCode >= 0x41 && charCode <= 0x5a;
  }
  function isAsciiDigit(charCode) {
    return charCode >= 0x30 && charCode <= 0x39;
  }
  function isAsciiSpace(charCode) {
    return charCode === 0x20 || charCode === 0x09 || charCode === 0x0d || charCode === 0x0a;
  }
  function isHan(charCode) {
    return charCode >= 0x3400 && charCode <= 0x9fff || charCode >= 0xf900 && charCode <= 0xfaff;
  }
  function isKatakana(charCode) {
    return charCode >= 0x30a0 && charCode <= 0x30ff;
  }
  function isHiragana(charCode) {
    return charCode >= 0x3040 && charCode <= 0x309f;
  }
  function isHalfwidthKatakana(charCode) {
    return charCode >= 0xff60 && charCode <= 0xff9f;
  }
  function isThai(charCode) {
    return (charCode & 0xff80) === 0x0e00;
  }
  function getCharacterType(charCode) {
    if (isAlphabeticalScript(charCode)) {
      if (isAscii(charCode)) {
        if (isAsciiSpace(charCode)) {
          return CharacterType.SPACE;
        } else if (isAsciiAlpha(charCode) || isAsciiDigit(charCode) || charCode === 0x5f) {
          return CharacterType.ALPHA_LETTER;
        }
        return CharacterType.PUNCT;
      } else if (isThai(charCode)) {
        return CharacterType.THAI_LETTER;
      } else if (charCode === 0xa0) {
        return CharacterType.SPACE;
      }
      return CharacterType.ALPHA_LETTER;
    }
    if (isHan(charCode)) {
      return CharacterType.HAN_LETTER;
    } else if (isKatakana(charCode)) {
      return CharacterType.KATAKANA_LETTER;
    } else if (isHiragana(charCode)) {
      return CharacterType.HIRAGANA_LETTER;
    } else if (isHalfwidthKatakana(charCode)) {
      return CharacterType.HALFWIDTH_KATAKANA_LETTER;
    }
    return CharacterType.ALPHA_LETTER;
  }
  let NormalizeWithNFKC;
  function getNormalizeWithNFKC() {
    NormalizeWithNFKC ||= ` ¨ª¯²-µ¸-º¼-¾Ĳ-ĳĿ-ŀŉſǄ-ǌǱ-ǳʰ-ʸ˘-˝ˠ-ˤʹͺ;΄-΅·ϐ-ϖϰ-ϲϴ-ϵϹևٵ-ٸक़-य़ড়-ঢ়য়ਲ਼ਸ਼ਖ਼-ਜ਼ਫ਼ଡ଼-ଢ଼ำຳໜ-ໝ༌གྷཌྷདྷབྷཛྷཀྵჼᴬ-ᴮᴰ-ᴺᴼ-ᵍᵏ-ᵪᵸᶛ-ᶿẚ-ẛάέήίόύώΆ᾽-῁ΈΉ῍-῏ΐΊ῝-῟ΰΎ῭-`ΌΏ´-῾ - ‑‗․-… ″-‴‶-‷‼‾⁇-⁉⁗ ⁰-ⁱ⁴-₎ₐ-ₜ₨℀-℃℅-ℇ℉-ℓℕ-№ℙ-ℝ℠-™ℤΩℨK-ℭℯ-ℱℳ-ℹ℻-⅀ⅅ-ⅉ⅐-ⅿ↉∬-∭∯-∰〈-〉①-⓪⨌⩴-⩶⫝̸ⱼ-ⱽⵯ⺟⻳⼀-⿕　〶〸-〺゛-゜ゟヿㄱ-ㆎ㆒-㆟㈀-㈞㈠-㉇㉐-㉾㊀-㏿ꚜ-ꚝꝰꟲ-ꟴꟸ-ꟹꭜ-ꭟꭩ豈-嗀塚晴凞-羽蘒諸逸-都飯-舘並-龎ﬀ-ﬆﬓ-ﬗיִײַ-זּטּ-לּמּנּ-סּףּ-פּצּ-ﮱﯓ-ﴽﵐ-ﶏﶒ-ﷇﷰ-﷼︐-︙︰-﹄﹇-﹒﹔-﹦﹨-﹫ﹰ-ﹲﹴﹶ-ﻼ！-ﾾￂ-ￇￊ-ￏￒ-ￗￚ-ￜ￠-￦`;
    return NormalizeWithNFKC;
  }
  