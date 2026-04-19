/**
 * @typedef {Object} Card
 * @property {number} id
 * @property {string} pokemon_tcg_id
 * @property {string} name
 * @property {string} [set_name]
 * @property {string} [image_url]
 * @property {number} [price]
 * @property {string} [rarity]
 * @property {Array<PriceHistoryEntry>} [price_history]
 * @property {Object} [history] - Generated price history: { "1W": number[], "1M": number[], "1Y": number[] }
 */

/**
 * @typedef {Object} PriceHistoryEntry
 * @property {number} id
 * @property {number} card_id
 * @property {number} price
 * @property {string} date_recorded
 */

/**
 * @typedef {Object} CollectionItem
 * @property {number} id
 * @property {number} user_id
 * @property {number} card_id
 * @property {Card} card
 * @property {string} [acquired_date]
 * @property {string} [condition]
 * @property {number} [quantity]
 */

/**
 * @typedef {Object} PortfolioStats
 * @property {number} total_cards
 * @property {number} total_portfolio_value
 * @property {Card} [most_valuable_card]
 */

export {};
