// Guardrails run BEFORE and AFTER every model call.
// Pre: route emergencies, crisis language, dose-change questions and
//      unidentifiable medicines to fixed, safe responses (no model involved).
// Post: strip any dosing instruction the model produced that isn't on the label.

import { findMed } from '../data/meds.js'

const EMERGENCY = [
  /blood (in|on) (my )?(stool|poo|poop|toilet|tissue)/i, /bloody (stool|diarrh)/i, /black,? (tarry )?(stool|poo)/i,
  /vomit(ing)? blood/i, /chest pain/i, /faint(ed|ing)?/i, /can'?t stop vomiting/i, /worst pain/i,
  /severe (abdominal |stomach |tummy )?pain/i, /high fever/i, /fever/i, /便血/, /吐血/, /剧痛/, /darah/i,
]
const CRISIS = [/suicid/i, /kill myself/i, /end (it|my life)/i, /self[- ]?harm/i, /want to die/i, /不想活/, /自杀/]
const DOSE_CHANGE = [
  /\b(double|extra|more than|increase|decrease|reduce|lower|higher|stop taking|quit|come off|overdose|skip (my|the) )\b/i,
  /\bhow (many|much) (should|can) i take\b/i, /\bcan i take .+ (with|and|together)\b/i, /\b(with|and) alcohol\b/i,
  /\binstead of\b/i, /加量|减量|停药|一起吃/,
]
const MED_WORDS = /\b(tablet|tablets|pill|pills|capsule|capsules|medicine|medication|meds|drug|syrup|sachet|\d+\s?mg)\b|药/i

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
