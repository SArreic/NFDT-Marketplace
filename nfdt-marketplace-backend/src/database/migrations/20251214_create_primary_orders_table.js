// migrations/20251214_create_primary_orders_table.js

exports.up = function (knex) {
  return knex.schema.createTable("primary_orders", (table) => {
    table.uuid("id").primary();
    table.uuid("asset_id").notNullable();
    table.uuid("listing_id").notNullable();

    table.string("buyer_address").notNullable();

    table.decimal("quantity", 30, 6).notNullable();
    table.decimal("price_per_share", 30, 6).notNullable();
    table.decimal("total_price", 30, 6).notNullable();

    table
      .enu("status", [
        "PENDING_PAYMENT",
        "PAID",
        "SETTLING",
        "SETTLED",
        "FAILED",
      ])
      .defaultTo("PENDING_PAYMENT");

    table.string("payment_tx_hash");
    table.string("settlement_tx_hash");

    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("primary_orders");
};
