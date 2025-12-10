// migrations/20251210130906_create_assets_table.js
/**
 * @param {import('knex').Knex} knex
 * @returns {Promise<void>}
 */
exports.up = async function(knex) {
  return knex.schema.createTable('assets', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name').notNullable();
    table.string('type').notNullable();
    table.string('description', 1000);
    table.timestamps(true, true);
  });
};

/**
 * @param {import('knex').Knex} knex
 * @returns {Promise<void>}
 */
exports.down = async function(knex) {
  return knex.schema.dropTable('assets');
};