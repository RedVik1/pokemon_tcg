/**
 * @typedef {Object} PortfolioStatsResponse
 * @property {number} total_cards
 * @property {number} total_portfolio_value
 * @property {Object} [most_valuable_card]
 * @property {number} most_valuable_card.id
 * @property {string} most_valuable_card.pokemon_tcg_id
 * @property {string} most_valuable_card.name
 * @property {string} [most_valuable_card.set_name]
 * @property {string} [most_valuable_card.image_url]
 * @property {number} [most_valuable_card.price]
 * @property {Object} [most_valuable_card.history]
 */

/**
 * @typedef {Object} PortfolioDistributionEntry
 * @property {string} name
 * @property {number} value
 */

export {};
