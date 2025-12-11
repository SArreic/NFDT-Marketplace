// migrations/20251214_create_trade_history_table.js

exports.up = function (knex) {
  return knex.schema.createTable("trade_history", (table) => {
    table.uuid("id").primary();

    table.uuid("asset_id").notNullable();
    table.string("buyer_address");
    table.string("seller_address");

    table.decimal("quantity", 30, 6);
    table.decimal("price", 30, 6);

    table.enu("trade_type", ["PRIMARY", "OTC"]).notNullable();

    table.string("tx_hash");

    table.timestamp("timestamp").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("trade_history");
};
