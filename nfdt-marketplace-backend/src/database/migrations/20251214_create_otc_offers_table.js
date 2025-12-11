// migrations/20251214_create_otc_offers_table.js

exports.up = function (knex) {
  return knex.schema.createTable("otc_offers", (table) => {
    table.uuid("id").primary();

    table.uuid("asset_id").notNullable();
    table.uuid("listing_id").notNullable();

    table.string("seller_address").notNullable();

    table.decimal("quantity", 30, 6).notNullable();
    table.decimal("min_price_per_share", 30, 6).notNullable();

    table.string("settlement_token").defaultTo("USDT");

    table
      .enu("status", ["ACTIVE", "FILLED", "CANCELLED"])
      .notNullable()
      .defaultTo("ACTIVE");

    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("otc_offers");
};
