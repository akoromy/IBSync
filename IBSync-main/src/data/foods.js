// Food catalogue with Singapore hawker + home staples.
// `tags` are trigger components the analytics engine correlates against.
// `fodmap` is the general Monash-style guidance level (low / moderate / high)
// for a typical serving — individual tolerance varies, which is the point of tracking.

export const TRIGGER_TAGS = {
  dairy: 'Dairy (lactose)',
  caffeine: 'Caffeine',
  garlic_onion: 'Garlic & onion',
  wheat: 'Wheat',
  spicy: 'Chilli / spicy',
  fatty: 'Fried / fatty',
  coconut: 'Coconut milk',
  beans: 'Beans & lentils',
  fruit_high: 'High-FODMAP fruit',
  sweetener: 'Sugar alcohols',
  alcohol: 'Alcohol',
  fizzy: 'Fizzy drinks',
}

export const FOODS = [
  { id: 'kopi', name: 'Kopi (with condensed milk)', emoji: '☕', tags: ['caffeine', 'dairy'], fodmap: 'moderate', group: 'Drinks' },
  { id: 'kopi_o', name: 'Kopi O (black)', emoji: '☕', tags: ['caffeine'], fodmap: 'low', group: 'Drinks' },
  { id: 'teh_tarik', name: 'Teh tarik', emoji: '🍵', tags: ['caffeine', 'dairy'], fodmap: 'moderate', group: 'Drinks' },
  { id: 'bubble_tea', name: 'Bubble milk tea', emoji: '🧋', tags: ['dairy', 'caffeine'], fodmap: 'high', group: 'Drinks' },
  { id: 'latte', name: 'Latte', emoji: '☕', tags: ['caffeine', 'dairy'], fodmap: 'high', group: 'Drinks' },
  { id: 'ginger_tea', name: 'Ginger tea', emoji: '🫖', tags: [], fodmap: 'low', group: 'Drinks' },
  { id: 'peppermint_tea', name: 'Peppermint tea', emoji: '🌿', tags: [], fodmap: 'low', group: 'Drinks' },
  { id: 'beer', name: 'Beer', emoji: '🍺', tags: ['alcohol', 'fizzy', 'wheat'], fodmap: 'moderate', group: 'Drinks' },
  { id: 'soda', name: 'Soft drink', emoji: '🥤', tags: ['fizzy'], fodmap: 'moderate', group: 'Drinks' },

  { id: 'chicken_rice', name: 'Chicken rice', emoji: '🍗', tags: ['garlic_onion'], fodmap: 'moderate', group: 'Hawker' },
  { id: 'laksa', name: 'Laksa', emoji: '🍜', tags: ['coconut', 'spicy', 'fatty', 'garlic_onion'], fodmap: 'high', group: 'Hawker' },
  { id: 'nasi_lemak', name: 'Nasi lemak', emoji: '🍛', tags: ['coconut', 'fatty', 'spicy'], fodmap: 'moderate', group: 'Hawker' },
  { id: 'roti_prata', name: 'Roti prata', emoji: '🫓', tags: ['wheat', 'fatty'], fodmap: 'high', group: 'Hawker' },
  { id: 'char_kway_teow', name: 'Char kway teow', emoji: '🥘', tags: ['fatty', 'garlic_onion'], fodmap: 'moderate', group: 'Hawker' },
  { id: 'fish_soup', name: 'Sliced fish soup + rice', emoji: '🐟', tags: [], fodmap: 'low', group: 'Hawker' },
  { id: 'yong_tau_foo', name: 'Yong tau foo (clear soup)', emoji: '🥬', tags: [], fodmap: 'low', group: 'Hawker' },
  { id: 'mee_goreng', name: 'Mee goreng', emoji: '🍝', tags: ['wheat', 'spicy', 'garlic_onion'], fodmap: 'high', group: 'Hawker' },
  { id: 'dal_curry', name: 'Dal curry', emoji: '🍲', tags: ['beans', 'garlic_onion', 'spicy'], fodmap: 'high', group: 'Hawker' },

  { id: 'congee', name: 'Plain congee', emoji: '🥣', tags: [], fodmap: 'low', group: 'Home' },
  { id: 'oats', name: 'Oats', emoji: '🥣', tags: [], fodmap: 'low', group: 'Home' },
  { id: 'eggs', name: 'Eggs', emoji: '🍳', tags: [], fodmap: 'low', group: 'Home' },
  { id: 'toast', name: 'Wholemeal toast', emoji: '🍞', tags: ['wheat'], fodmap: 'moderate', group: 'Home' },
  { id: 'kaya_toast', name: 'Kaya toast set', emoji: '🍞', tags: ['wheat', 'coconut', 'dairy'], fodmap: 'moderate', group: 'Home' },
  { id: 'rice_veg', name: 'Rice, tofu & bok choy', emoji: '🍚', tags: [], fodmap: 'low', group: 'Home' },
  { id: 'pasta_cream', name: 'Creamy pasta', emoji: '🍝', tags: ['wheat', 'dairy', 'garlic_onion'], fodmap: 'high', group: 'Home' },
  { id: 'yogurt', name: 'Yogurt', emoji: '🥛', tags: ['dairy'], fodmap: 'moderate', group: 'Home' },
  { id: 'banana', name: 'Banana (firm)', emoji: '🍌', tags: [], fodmap: 'low', group: 'Snacks' },
  { id: 'apple', name: 'Apple', emoji: '🍎', tags: ['fruit_high'], fodmap: 'high', group: 'Snacks' },
  { id: 'mango', name: 'Mango', emoji: '🥭', tags: ['fruit_high'], fodmap: 'high', group: 'Snacks' },
  { id: 'papaya', name: 'Papaya', emoji: '🍈', tags: [], fodmap: 'low', group: 'Snacks' },
  { id: 'sugarfree_gum', name: 'Sugar-free gum', emoji: '🍬', tags: ['sweetener'], fodmap: 'high', group: 'Snacks' },
  { id: 'crackers', name: 'Rice crackers', emoji: '🍘', tags: [], fodmap: 'low', group: 'Snacks' },
]

export const foodById = Object.fromEntries(FOODS.map(f => [f.id, f]))

export const LOW_FODMAP_SWAPS = [
  { from: 'Kopi / teh with milk', to: 'Kopi O or teh O, or with lactose-free milk' },
  { from: 'Laksa, curry with coconut milk', to: 'Sliced fish soup, yong tau foo clear soup' },
  { from: 'Garlic & onion', to: 'Garlic-infused oil, spring onion greens, ginger' },
  { from: 'Roti prata, white bread', to: 'Rice, congee, sourdough spelt, rice noodles' },
  { from: 'Apple, mango, watermelon', to: 'Papaya, firm banana, orange, pineapple' },
  { from: 'Bubble milk tea', to: 'Peppermint or ginger tea' },
]
