// migrations/20251210112547_create_token_listings_table.js
/**
 * @param {import('knex').Knex} knex
 * @returns {Promise<void>}
 */
exports.up = async function(knex) {
  return knex.schema.createTable('token_listings', (table) => {
    // 核心字段
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('asset_id').notNullable();
    // .references('id').inTable('assets'); // 暂时注释，等assets表创建
    
    // 状态管理
    table.string('status', 20).notNullable().defaultTo('DRAFT');
    
    // 代币信息
    table.decimal('total_supply', 36, 18).notNullable();
    table.decimal('tokens_for_sale', 36, 18).notNullable();
    table.decimal('price_per_token', 36, 18).notNullable();
    table.decimal('valuation_usd', 20, 2).notNullable();
    
    // 支付与合约
    table.string('currency_address', 42).notNullable();
    table.string('contract_address', 42).nullable();
    
    // 合规与投资者资格
    table.jsonb('investor_eligibility').defaultTo('{}');
    table.decimal('esg_score', 3, 1).nullable();
    table.jsonb('esg_details').defaultTo('{}');
    
    // 监管披露
    table.specificType('regulatory_disclosures', 'TEXT[]').defaultTo('{}');
    
    // 时间戳
    table.timestamp('listing_date').nullable();
    table.timestamps(true, true);
  });
};

/**
 * @param {import('knex').Knex} knex
 * @returns {Promise<void>}
 */
exports.down = async function(knex) {
  return knex.schema.dropTable('token_listings');
};