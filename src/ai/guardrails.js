// Guardrails run BEFORE and AFTER every model call.
// Pre: route emergencies, crisis language, dose-change questions and
//      unidentifiable medicines to fixed, safe responses (no model involved).
// Post: strip any dosing instruction the model produced that isn't on the label.

import { findMed } from '../data/meds.js'

const EMERGENCY = [
  // ── English ──────────────────────────────────────────────
  /blood (in|on) (my )?(stool|poo|poop|toilet|tissue|paper)/i, /bloody (stool|diarrh)/i, /black,? (tarry )?(stool|poo)/i,
  /vomit(ing)? blood/i, /chest pain/i, /\b(i|just|nearly|almost|keep|kept) (faint(ed|ing)?|fainted)\b/i, /\bfaint(ed|ing)\b/i, /can'?t stop vomiting/i, /worst pain/i,
  /severe (abdominal |stomach |tummy )?pain/i, /high fever/i, /\bfever\b.{0,25}\b(days?|won'?t (go|break)|not (going|breaking)|persist|chills|shaking|39|40)/i,
  /unexplained weight loss/i, /losing weight (fast|quickly|without trying)/i,
  /wake(s|ing)?? up at night (to go|with pain|vomiting)/i, /nocturnal (pain|diarrh|symptoms)/i,
  /difficulty (breathing|swallowing)/i, /shortness of breath/i,
  /sudden(ly)? (severe|sharp|intense) pain/i, /unbearable pain/i, /can'?t (bear|stand|tolerate) (the|this)? ?pain/i,
  /pass out|passing out/i, /collaps(e|ed|ing)/i,
  // ── Singlish / colloquial English ───────────────────────
  /blood in (my )?(poo|poop|motion|pass motion|shit)/i, /see blood (when|after) (i )?(poo|poop|pass motion)/i,
  /vomit(ting)? (blood|red|dark|coffee ground)/i, /throw up blood/i, /puk(e|ing) blood/i,
  /pass(ing)? out/i, /feeling giddy/i, /giddy (until|that|and) (i|feels? like) (faint|pass|fall)/i,
  /can'?t (stop|help) (vomit|throw|puk)ing/i, /non-stop vomiting/i, /keep vomiting/i,
  /very high (fever|temperature)/i, /burning up/i, /shaking (and|with) (chills|fever|cold)/i,
  /pain so bad (i|that|until) (i|can'?t|want to) (cry|scream|die|faint)/i,
  /stomach (cramp|pain|ache) until (i|want to|cannot) (stand|walk|sleep|breathe)/i,
  /hard to breathe/i, /breathless/i, /suffocating/i,
  // ── Chinese (Simplified + Traditional) ──────────────────
  /便血/, /吐血/, /剧痛/, /黑便/, /血便/, /呕血/,
  /大便有血/, /拉血/, /肚子痛到不行/, /肚子痛到受不了/, /痛到受不了/,
  /呼吸困难/, /喘不过气/, /胸闷/, /晕倒/, /昏迷/, /不省人事/,
  /持续高烧/, /发高烧/, /发烧不退/, /吐个不停/, /吐不停/,
  /体重下降/, /突然消瘦/, /半夜痛醒/, /夜间腹泻/,
  // ── Malay / Bahasa Melayu ────────────────────────────────
  /\b(berak|buang air besar|najis|kencing|batuk|muntah) (ada )?darah\b/i, /berak darah/i, /muntah darah/i, /najis berdarah/i,
  /sakit (dada|jantung|perut) (teruk|sangat|amat)/i, /sakit (perut|dada)? ?sangat/i, /tak tahan sakit/i,
  /demam (panas|tinggi|teruk)/i, /demam (sangat|amat)/i, /panas (badan|teruk)/i,
  /sesak (nafas|dada)/i, /pengsan/i, /lumpuh/i,
  /muntah teruk/i, /muntah berterusan/i, /tak (boleh|bisa) berhenti muntah/i,
  /susah (nafas|bernafas|menelan)/i,
  // ── Tamil ───────────────────────────────────────────────
  /ரத்த(ம்|ம)? (வரு|வந்த|பேரிசு|மலம்)/, /இரத்த (வாந்தி|மலம்|வருதல்)/, /ரத்தம் வாந்த/,
  /மார்பு (வலி|வலிப்பு)/, /மூச்சு (திணற|திணறு|விடாது)/, /மூச்சுத் திணற/,
  /தீராத (வலி|வயிற்று வலி)/, /தாங்க (முடியாத|முடிய) (வலி|வலிப்பு)/,
  /மயக்க(ம்|ம)? (வர|வந்த)/, /மயங்க (விழ|விழுந்த)/, /உடைந்த (விழ|விழுந்த)/,
  /அதிக (காய்ச்சி|வெப்பம்)/, /காய்ச்சி (அதிக|மிக)/, /உடல் (சூடு|வெப்பம்) (அதிக|மிக)/,
  /வாந்தி (நிற்க|நிற்கவில்லை|தொடர)/, /வாந்தி வர வர (நிற்க|நிக்க)/,
  /இரும்பு (காய்ச்சி|வெப்பம்)/,
  // ── Cross-lingual catches ───────────────────────────────
  /A&E|emergency (department|room)/i, /\b(999|995)\b/,
]
const CRISIS = [
  // ── English ──────────────────────────────────────────────
  /suicid/i, /kill myself/i, /end (it|my life)/i, /self[- ]?harm/i, /want to die/i,
  /don'?t want to (live|be here|exist|be alive)/i, /better off (dead|gone)/i,
  /no (point|reason) (in|to) (living|going on|staying)/i, /give up on life/i,
  /hurt myself/i, /end (it|everything|the pain) all/i,
  /can'?t (take it|go on|cope|do this) (anymore|any more|any longer)/i,
  /nobody (would|will) (miss|care)/i, /everyone (would|will) be better off (without me)/i,
  // ── Singlish ─────────────────────────────────────────────
  /want to (die|end my life|kill myself) liao/i, /better (off|just) (die|not here)/i,
  /don'?t want to live (anymore|already|liao)/i, /no point living (anymore|already)/i,
  /sian until want to die/i, /cannot take it anymore/i,
  /life (not worth|got no point) (living|anymore)/i,
  // ── Chinese (Simplified + Traditional) ──────────────────
  /不想活/, /自杀/, /不想活了/, /想死/, /不想活了/,
  /活不下去/, /想结束一切/, /想不开/,
  /不想存在/, /死了算了/, /了结自己/, /伤害自己/,
  // ── Malay / Bahasa Melayu ────────────────────────────────
  /nak bunuh diri/i, /mahu bunuh diri/i, /bunuh diri/i,
  /tak nak hidup/i, /tak nak (hidup|live) lagi/i, /tak (mahu|mau) (hidup|live) (lagi|pun)/i,
  /hidup tak bermakna/i, /nak mati/i, /mahu mati/i, /mati (saja|lebih baik|lagi baik)/i,
  // ── Tamil ───────────────────────────────────────────────
  /தற்கொலை/, /தற்கொலை (செய்ய|செய்|நினை)/, /உயிர (பலி|விட)/, /உயிர் விட/,
  /வாழ (வேண்டாம்|வேண்டுவதில்லை)/, /வாழ்ந்து (பயனில்லை|புரியவில்லை)/,
  /சாக (வேண்டும்|நினை)/, /இறக்க (வேண்டும்|நினை)/,
  /தீங்கு (விளைவி|விளைய)/, /தீங்கு (விளைவிக்க|செய்)/, /தன்னை (தீங்கு|காயப்படுத்த)/,
]
const DOSE_CHANGE = [
  // ── English ──────────────────────────────────────────────
  /\b(double|extra|more than|increase|decrease|reduce|lower|higher|stop taking|quit|come off|overdose|skip (my|the) )\b/i,
  /\bhow (many|much) (should|can) i take\b/i, /\bcan i take .+ (with|and|together)\b/i, /\b(with|and) alcohol\b/i,
  /\binstead of\b/i,
  /\b(up|down) the dose\b/i, /\b(change|adjust|tweak|modify) (my|the) dose\b/i,
  /\b(two|three|four|2|3|4) (instead|rather than) (one|1)\b/i,
  /\b(take|use) (two|three|2|3) (instead|rather than) (one|1)\b/i,
  /\b(take|popping|pop) (an? extra|extra|more) (pill|tablet|dose)\b/i,
  /\bstop (the|my) (medicine|medication|tablets?|pills?)\b/i,
  /\b(wean|taper|wind down) off\b/i, /\bgo off (my|the) (meds|medicine|tablets?)\b/i,
  /\bis it (ok|okay|safe|fine) to (take|combine|mix)\b/i,
  /\b(what happens|what will happen) if i (take|double|skip|miss)\b/i,
  /\b(missed|forgot) (my )?(dose|tablet|pill) (yesterday|earlier|this morning)\b.{0,30}(take|double|extra|now)\b/i,
  /\b(should i|can i|is it ok to) (take|have) .+ (and|with|plus) .+ (medic|tablet|pill|capsule)\b/i,
  /\b(before|after) (food|meals?)\b.{0,20}(change|switch|adjust|instead)\b/i,
  // ── Singlish ─────────────────────────────────────────────
  /\bcan (i|can) (take|eat|pop) (extra|more|two|2)\b/i, /\b(take|eat) (extra|more) (pill|tablet|panadol)\b/i,
  /\bdouble (the|my) (dose|tablet|pill)\b/i, /\bskip (today|one|yesterday) (dose|tablet|pill)\b/i,
  /\bstop (eat|taking|the) (medicine|tablet|pill)\b/i,
  /\b(can|should) i (take|eat) .+ (together with|plus|and) .+ (medicine|tablet|pill|panadol)\b/i,
  /\b(take|eat) (two|2|three|3) (instead of|rather than) (one|1)\b/i,
  /\bchange (to|the) dose\b/i, /\bup the dose\b/i, /\bdown the dose\b/i,
  // ── Chinese (Simplified + Traditional) ──────────────────
  /加量|减量|停药|一起吃/,
  /加药|减药|多吃|少吃|不吃药|停药|断药/,
  /可以一起吃吗/, /能不能一起吃/, /可以同时吃/,
  /多吃一片|多吃两片|少吃一片/, /加倍/, /减半/,
  /可以多吃吗/, /可以停药吗/, /可以加量吗/, /可以减量吗/,
  /能不能多服/, /可以停服/, /能否同服/,
  /改剂量|调整剂量|换剂量/,
  // ── Malay / Bahasa Melayu ────────────────────────────────
  /makan (lebih|tambah|extra) (ubat|tablet|pill|kapsul)/i,
  /(tambah|kurang|ubah) (dos|dos ubat)/i, /henti (makan )?ubat/i, /berhenti (makan )?ubat/i,
  /makan (dua|2|tiga|3) (sebalik|ganti) (satu|1)/i,
  /boleh (kah|tak|ke) (makan|ambil) (ubat|tablet|pill) (ni|ini) (sama|serentak) (dengan|dan)/i,
  /(boleh|tak|ke) (saya) (makan|ambil) (lebih|tambah|extra) (ubat|tablet|pill)/i,
  /tukar dos/i, /naik dos/i, /turun dos/i, /henti ubat/i,
  // ── Tamil ───────────────────────────────────────────────
  /மருந்து (அதிக|மேல்|கூடுதல்) (எடுத்து|சாப்பிட)/, /அதிக (மருந்து|மாத்திரை) (எடுத்து|சாப்பிட)/,
  /மருந்து (நிறுத்து|நிறுத்த|விடு|விட)/, /மருந்தை (நிறுத்து|விட)/,
  /மருந்து (குறை|குறைத்து|குறைக்க)/, /மாத்திரை (குறை|குறைத்து)/,
  /இரண்டு (மருந்து|மாத்திரை) (ஒன்றாக|சேர்த்து) (சாப்பிட|எடுத்து)/, /ஒன்னா (சாப்பிட|எடுத்து) (மருந்து|மாத்திரை)/,
  /மாத்திரை (மாற்றி|மாற்று)/, /டோஸ் (மாற்றி|மாற்று|அதிக|குறை)/,
]
const MED_WORDS = /\b(tablet|tablets|pill|pills|capsule|capsules|medicine|medication|meds|drug|syrup|sachet|\d+\s?mg)\b|药|ubat|kapsul|மருந்து|மாத்திரை/i

export function classifyInput(text) {
  if (CRISIS.some(r => r.test(text))) return { type: 'crisis' }
  if (EMERGENCY.some(r => r.test(text))) return { type: 'emergency' }
  const med = findMed(text)
  if (DOSE_CHANGE.some(r => r.test(text)) && (med || MED_WORDS.test(text))) return { type: 'dose_change', med }
  if (med) return { type: 'med_info', med }
  if (MED_WORDS.test(text)) return { type: 'unknown_med' }
  return { type: 'general' }
}

export const FIXED = {
  crisis: 'I\'m really glad you told me. You deserve support right now from a person, not an app.\n\n**Samaritans of Singapore (SOS): call or text 1767** — 24 hours.\n**If you are in immediate danger, call 995.**\n\nIf you can, let someone near you know how you\'re feeling. I\'m here to keep you company while you reach out.',
  emergency: 'What you\'ve described can need prompt medical attention, so I won\'t try to manage it here.\n\n**If it\'s severe or sudden — heavy bleeding, fainting, chest pain, or pain you can\'t bear — call 995 or go to the nearest A&E now.**\n\nOtherwise, please see a doctor today (GP or polyclinic). I\'ve added this to your doctor summary so it\'s ready to show them.',
  dose_change: med => `Changing how much or how often you take ${med ? med.name : 'a medicine'}, combining it with something else, or stopping it is a decision for your doctor or pharmacist — I can't advise on that safely.\n\nWhat I can do: ${med ? `explain what ${med.name} is for, ` : ''}add this question to your appointment list, and show them your recent symptoms so the conversation is quicker. Your pharmacist can also answer this over the counter today.`,
  unknown_med: 'I\'m not able to identify that medication, so I won\'t guess. Please check with your pharmacist — you can show them the box or the label. If you tell me the exact name on the pack, I\'ll check again.',
}

const DOSE_INSTRUCTION = /([^.\n]*\b(take|use|increase|double|reduce)\b[^.\n]*\b\d+\s?(mg|tablets?|capsules?|sachets?|ml)\b[^.\n]*[.\n]?)/gi

export function postFilter(text) {
  let flagged = false
  const out = text.replace(DOSE_INSTRUCTION, () => { flagged = true; return ' Please follow the dose on your own label or ask your pharmacist. ' })
  return { text: out, flagged }
}
