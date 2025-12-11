// migrations/20251214_create_otc_trades_table.js

exports.up = function (knex) {
  return knex.schema.createTable("otc_trades", (table) => {
    table.uuid("id").primary();
    table.uuid("offer_id").notNullable();

    table.string("buyer_address").notNullable();
    table.string("seller_address").notNullable();

    table.decimal("quantity", 30, 6);
    table.decimal("price_per_share", 30, 6);
    table.decimal("total_price", 30, 6);

    table.string("payment_tx_hash");
    table.string("token_tx_hash");

    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("otc_trades");
};
