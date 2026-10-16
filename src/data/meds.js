// Curated, patient-friendly medication knowledge base for common IBS treatments.
// This is the ONLY source the app uses to explain a medicine. If a medicine
// isn't here (and the LLM can't ground it), the app says so and points to a pharmacist.
// Content is general education, not dosing instructions — the user's own
// prescription label always wins.

export const MED_KB = [
  {
    id: 'mebeverine',
    name: 'Mebeverine',
    aliases: ['colofac', 'duspatalin', 'mebeverine hydrochloride'],
    kind: 'Antispasmodic',
    forWhat: 'Relaxes the muscles in the wall of your gut so cramps and spasm-type pain ease off.',
    howToTake: 'Usually taken about 20 minutes before a meal, swallowed whole with water. Follow the times on your label.',
    sideEffects: 'Usually well tolerated. Occasionally indigestion, dizziness or a skin rash.',
    tips: 'It works best when taken before meals, not after the pain starts. Pair it with your meal reminders.',
    askIf: 'Pain changes in character, you get a rash, or it has not helped after a few weeks.',
  },
  {
    id: 'hyoscine',
    name: 'Hyoscine butylbromide',
    aliases: ['buscopan', 'hyoscine'],
    kind: 'Antispasmodic',
    forWhat: 'Calms sudden gut cramps by relaxing the gut muscle.',
    howToTake: 'Taken when cramps start or as directed on your label. Do not take more often than the label says.',
    sideEffects: 'Dry mouth, blurred vision, constipation or a faster heartbeat.',
    tips: 'Useful as a "rescue" for cramping episodes. Log when you take it so patterns show up.',
    askIf: 'You have glaucoma, eye pain, or difficulty passing urine.',
  },
  {
    id: 'otilonium',
    name: 'Otilonium bromide',
    aliases: ['spasmomen'],
    kind: 'Antispasmodic',
    forWhat: 'Eases cramping and bloating by relaxing the lower gut muscle.',
    howToTake: 'Usually taken before meals as prescribed.',
    sideEffects: 'Generally mild; occasionally nausea or dizziness.',
    tips: 'Commonly prescribed in Asia. Taking it at regular times helps more than taking it only on bad days.',
    askIf: 'Symptoms do not improve after the trial period your doctor set.',
  },
  {
    id: 'peppermint',
    name: 'Peppermint oil capsules',
    aliases: ['colpermin', 'mintec', 'peppermint oil', 'peppermint'],
    kind: 'Natural antispasmodic',
    forWhat: 'Soothes gut spasm and can reduce overall IBS pain and bloating.',
    howToTake: 'Swallow whole (do not chew or break), usually before meals. Avoid taking at the same time as antacids.',
    sideEffects: 'Heartburn, a minty taste or, rarely, perianal discomfort.',
    tips: 'If you get heartburn, ask about timing changes. Peppermint tea is not a substitute for the capsules.',
    askIf: 'You have reflux or heartburn that gets worse.',
  },
  {
    id: 'loperamide',
    name: 'Loperamide',
    aliases: ['imodium', 'loperamide hydrochloride'],
    kind: 'Anti-diarrhoeal',
    forWhat: 'Slows how fast things move through your gut, so stools are firmer and less urgent.',
    howToTake: 'Taken as directed on the label, often before a trigger situation like a commute or event. Do not exceed the label maximum.',
    sideEffects: 'Constipation, bloating or tummy cramps.',
    tips: 'Some people use it ahead of known triggers. Log it so the app can show whether it is helping.',
    askIf: 'You have blood in your stool, a fever, or diarrhoea lasting more than 2 days despite taking it — do not keep taking it, seek care.',
  },
  {
    id: 'psyllium',
    name: 'Psyllium (ispaghula husk)',
    aliases: ['metamucil', 'fybogel', 'ispaghula', 'psyllium husk', 'psyllium'],
    kind: 'Soluble fibre',
    forWhat: 'Absorbs water to make stools softer and more regular — helps both constipation and loose stools.',
    howToTake: 'Mix into a full glass of water and drink straight away. Start low and build up over 1–2 weeks. Keep it about 2 hours apart from other medicines.',
    sideEffects: 'Gas and bloating at first, which usually settles.',
    tips: 'Drink enough water through the day — fibre without water can make constipation worse.',
    askIf: 'You have trouble swallowing or chest pain after taking it.',
  },
  {
    id: 'macrogol',
    name: 'Macrogol (polyethylene glycol)',
    aliases: ['movicol', 'forlax', 'peg', 'polyethylene glycol', 'miralax', 'macrogol'],
    kind: 'Osmotic laxative',
    forWhat: 'Draws water into the bowel so stools are softer and easier to pass.',
    howToTake: 'Dissolve the sachet in water as the label describes. It can take 1–3 days to work.',
    sideEffects: 'Bloating, nausea or loose stools if the amount is too high.',
    tips: 'Watch your Bristol type in the app — aim for type 3–4.',
    askIf: 'Constipation lasts longer than your doctor expected or you get severe pain.',
  },
  {
    id: 'linaclotide',
    name: 'Linaclotide',
    aliases: ['linzess', 'constella'],
    kind: 'IBS-C treatment',
    forWhat: 'Helps with constipation-predominant IBS by increasing fluid in the gut and easing pain.',
    howToTake: 'Usually once a day on an empty stomach, at least 30 minutes before the first meal.',
    sideEffects: 'Diarrhoea is the most common, usually in the first weeks.',
    tips: 'Timing matters — take it before breakfast, not with it.',
    askIf: 'You get severe or ongoing diarrhoea.',
  },
  {
    id: 'amitriptyline',
    name: 'Amitriptyline (low dose)',
    aliases: ['amitriptyline', 'elavil', 'tryptanol'],
    kind: 'Gut–brain neuromodulator',
    forWhat: 'At low doses it calms the pain signals between your gut and brain. It is used for gut pain, not because your symptoms are "in your head".',
    howToTake: 'Usually taken in the evening because it can make you sleepy. It can take 4–6 weeks to feel the full benefit.',
    sideEffects: 'Drowsiness, dry mouth, constipation.',
    tips: 'Do not stop suddenly without talking to your doctor. Track pain weekly — improvement is gradual.',
    askIf: 'You feel very drowsy in the day, your mood changes, or you want to stop.',
  },
  {
    id: 'rifaximin',
    name: 'Rifaximin',
    aliases: ['xifaxan', 'rifaximin'],
    kind: 'Gut-targeted antibiotic',
    forWhat: 'A short antibiotic course used for IBS with diarrhoea and bloating.',
    howToTake: 'Taken as a fixed course (often around 2 weeks). Finish the course as prescribed.',
    sideEffects: 'Nausea, gas, occasionally dizziness.',
    tips: 'Keep logging after the course ends — the app can show whether bloating stays improved.',
    askIf: 'You get severe diarrhoea during or after the course.',
  },
  {
    id: 'simethicone',
    name: 'Simethicone',
    aliases: ['gas-x', 'simethicone', 'dimethicone', 'gascoal'],
    kind: 'Anti-gas',
    forWhat: 'Breaks up gas bubbles to ease trapped wind and fullness.',
    howToTake: 'Usually after meals or at bedtime, as on the label.',
    sideEffects: 'Rarely any.',
    tips: 'If gas is daily, tracking which foods come before it is more useful long-term.',
    askIf: 'Bloating is constant or comes with weight loss.',
  },
  {
    id: 'probiotic',
    name: 'Probiotic',
    aliases: ['probiotic', 'probiotics', 'yakult', 'lactobacillus', 'bifidobacterium', 'vsl'],
    kind: 'Supplement',
    forWhat: 'Live bacteria that may help some people with bloating and wind. Evidence is mixed.',
    howToTake: 'Daily, as the product label says. Give one product about 4–12 weeks before deciding.',
    sideEffects: 'Mild gas early on.',
    tips: 'Try only one at a time so the app can tell whether it is helping.',
    askIf: 'You have a weakened immune system.',
  },
]

export function findMed(query) {
  if (!query) return null
  const q = query.toLowerCase()
  return MED_KB.find(m =>
    q.includes(m.name.toLowerCase().split(' ')[0]) || m.aliases.some(a => q.includes(a))
  ) || null
}

export const medById = Object.fromEntries(MED_KB.map(m => [m.id, m]))

// Words that look like a medication name was asked about, used to detect
// "unknown medication" questions so the app can abstain honestly.
export const MED_QUESTION_HINTS = ['tablet', 'pill', 'capsule', 'medicine', 'medication', 'drug', 'mg', 'prescribed', 'what is', 'what does', 'side effect']
