// The plans of the most popular services, with their official prices in the Philippines (PHP)
// and the US (USD), so picking "Spotify · Duo" fills in what Duo costs. Other services, and
// people paying in other currencies, type the price themselves.
//
// Prices change. They were checked on the services' own pricing pages (or reliable news where
// a service doesn't publish one) in the month below; a price that couldn't be confirmed is left
// out rather than guessed. The form always says where a filled-in price comes from, and it can
// be changed to match the receipt.
export const PRICES_CHECKED = 'November 2026'

// The currencies plan prices are known in, most likely first.
export const PLAN_CURRENCIES = ['PHP', 'USD']

const COUNTRY = { PHP: 'the Philippines', USD: 'the US' }

// Shorthands for the price tables below.
const monthly = (amount) => ({ monthly: amount })
const both = (perMonth, perYear) => ({ monthly: perMonth, yearly: perYear })

// { [serviceId]: [{ id, name, prices: { PHP: { monthly, yearly }, USD: { ... } } }] }
// A cycle or currency left out means the plan isn't sold that way there, or its price couldn't
// be confirmed. Yearly amounts are the total charged for the year.
export const PLANS = {
  // help.netflix.com/en/node/24926 (PH and US pages). PH prices may exclude tax.
  netflix: [
    { id: 'mobile', name: 'Mobile', prices: { PHP: monthly(169) } },
    { id: 'basic', name: 'Basic', prices: { PHP: monthly(279) } },
    { id: 'standard-ads', name: 'Standard with ads', prices: { USD: monthly(8.99) } },
    { id: 'standard', name: 'Standard', prices: { PHP: monthly(449), USD: monthly(19.99) } },
    { id: 'premium', name: 'Premium', prices: { PHP: monthly(619), USD: monthly(26.99) } },
  ],
  // spotify.com/ph-en/premium and spotify.com/us/premium. Neither sells a yearly plan.
  spotify: [
    { id: 'individual', name: 'Individual', prices: { PHP: monthly(169), USD: monthly(12.99) } },
    { id: 'student', name: 'Student', prices: { PHP: monthly(85), USD: monthly(6.99) } },
    { id: 'duo', name: 'Duo', prices: { PHP: monthly(229), USD: monthly(18.99) } },
    { id: 'family', name: 'Family', prices: { PHP: monthly(279), USD: monthly(21.99) } },
  ],
  // YouTube loads its prices by script, so these are from news: GIZGUIDE (PH, August 2026) and
  // TechCrunch and 9to5Google (US, April 2026). The US yearly and Student prices weren't confirmed.
  'youtube-premium': [
    { id: 'individual', name: 'Individual', prices: { PHP: monthly(189), USD: monthly(15.99) } },
    { id: 'family', name: 'Family', prices: { PHP: monthly(379), USD: monthly(26.99) } },
    { id: 'student', name: 'Student', prices: { PHP: monthly(115) } },
    { id: 'lite', name: 'Premium Lite', prices: { PHP: monthly(109), USD: monthly(8.99) } },
  ],
  // US: TechCrunch, April 2026. The only PH prices found were from before the 2026 increase.
  'youtube-music': [
    { id: 'individual', name: 'Individual', prices: { USD: monthly(11.99) } },
    { id: 'family', name: 'Family', prices: { USD: monthly(18.99) } },
  ],
  // support.apple.com/en-us/108047, September 2026.
  icloud: [
    { id: '50gb', name: '50 GB', prices: { PHP: monthly(59), USD: monthly(0.99) } },
    { id: '200gb', name: '200 GB', prices: { PHP: monthly(199), USD: monthly(2.99) } },
    { id: '2tb', name: '2 TB', prices: { PHP: monthly(699), USD: monthly(9.99) } },
    { id: '6tb', name: '6 TB', prices: { PHP: monthly(1990), USD: monthly(29.99) } },
    { id: '12tb', name: '12 TB', prices: { PHP: monthly(3990), USD: monthly(59.99) } },
  ],
  // PH yearly: hbomax.com/ph. PH monthly isn't on that page; it's from 2025 news, matched by a
  // 2026 tracker. US: after the October 2025 increase (TV Guide, 2026).
  'hbo-max': [
    { id: 'mobile', name: 'Mobile', prices: { PHP: both(149, 1040) } },
    { id: 'basic-ads', name: 'Basic with Ads', prices: { USD: both(10.99, 109.99) } },
    { id: 'standard', name: 'Standard', prices: { PHP: both(269, 1890), USD: both(18.49, 184.99) } },
    { id: 'premium', name: 'Premium', prices: { PHP: both(399, 2790), USD: both(22.99, 229.99) } },
  ],
  // one.google.com/about/plans. Google's other storage plans are now its AI plans, which are a
  // separate service here (Google Gemini). It doesn't show yearly amounts.
  'google-drive': [
    { id: 'basic', name: 'Basic 100 GB', prices: { PHP: monthly(119), USD: monthly(1.99) } },
  ],
  // apple.com/ph/apple-music and apple.com/apple-music, after the July 2026 US increase.
  'apple-music': [
    { id: 'individual', name: 'Individual', prices: { PHP: monthly(169), USD: monthly(11.99) } },
    { id: 'student', name: 'Student', prices: { PHP: monthly(85), USD: monthly(6.99) } },
    { id: 'family', name: 'Family', prices: { PHP: monthly(279), USD: monthly(19.99) } },
  ],
  // apple.com/ph/apple-tv and apple.com/apple-tv; US yearly from MacRumors, August 2026.
  'apple-tv': [{ id: 'apple-tv', name: 'Apple TV', prices: { PHP: monthly(369), USD: both(14.99, 119) } }],
  // After the February 2026 increase: Technobaboy (PH) and Anime News Network (US).
  crunchyroll: [
    { id: 'fan', name: 'Fan', prices: { PHP: monthly(99), USD: monthly(9.99) } },
    { id: 'mega-fan', name: 'Mega Fan', prices: { PHP: monthly(119), USD: monthly(13.99) } },
    { id: 'ultimate-fan', name: 'Ultimate Fan', prices: { USD: monthly(17.99) } },
  ],
  // claude.com/pricing. Anthropic bills the Philippines in US dollars, so there are no peso prices.
  claude: [
    { id: 'pro', name: 'Pro', prices: { USD: both(20, 200) } },
    { id: 'max', name: 'Max', prices: { USD: monthly(100) } },
    { id: 'ultra', name: 'Ultra', prices: { USD: monthly(200) } },
  ],
  // discord.com/nitro. Discord has peso prices, but its pricing page couldn't be read to confirm them.
  'discord-nitro': [
    { id: 'basic', name: 'Nitro Basic', prices: { USD: both(2.99, 29.99) } },
    { id: 'nitro', name: 'Nitro', prices: { USD: both(9.99, 99.99) } },
  ],
}

export function plansFor(serviceId) {
  return PLANS[serviceId] ?? []
}

export function findPlan(serviceId, planId) {
  return plansFor(serviceId).find((plan) => plan.id === planId) ?? null
}

// The plan's price for this currency and cycle, or null when it isn't sold that way.
export function planPrice(plan, currency, cycle) {
  return plan?.prices[currency]?.[cycle] ?? null
}

// Every cycle the plan is sold in, in any currency.
export function planCycles(plan) {
  return [...new Set(Object.values(plan.prices).flatMap((byCycle) => Object.keys(byCycle)))]
}

// The plans worth showing for a currency: the ones sold in it, such as Netflix's Mobile plan
// only in pesos. For a currency no plan is priced in, all of them, as labels without prices.
export function plansShownFor(serviceId, currency) {
  const plans = plansFor(serviceId)
  const priced = plans.filter((plan) => plan.prices[currency])
  return priced.length > 0 ? priced : plans
}

// What picking a plan fills in. The currency stays unless the plan has no price in it (it then
// moves to the first currency the plan is priced in), and the cycle stays unless the plan isn't
// sold that way (it then moves to the plan's first cycle). A cycle fixed by a recorded payment
// never moves. price is null when the plan has no price for the result.
export function fillFromPlan(plan, { currency, cycle, cycleLocked = false }) {
  const nextCurrency = plan.prices[currency]
    ? currency
    : (PLAN_CURRENCIES.find((code) => plan.prices[code]) ?? currency)
  const cycles = Object.keys(plan.prices[nextCurrency] ?? {})
  const nextCycle = cycleLocked || cycles.length === 0 || cycles.includes(cycle) ? cycle : cycles[0]
  return { currency: nextCurrency, cycle: nextCycle, price: planPrice(plan, nextCurrency, nextCycle) }
}

// Where a filled-in price comes from, shown under the price.
export function priceSource(currency) {
  return `Official price in ${COUNTRY[currency]}, checked ${PRICES_CHECKED}. Use the amount on your receipt if it's different.`
}
