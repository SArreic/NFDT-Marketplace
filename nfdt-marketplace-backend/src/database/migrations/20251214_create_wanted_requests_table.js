// migrations/20251214_create_wanted_requests_table.js

exports.up = function (knex) {
  return knex.schema.createTable("wanted_requests", (table) => {
    table.uuid("id").primary();

    table.uuid("asset_id").notNullable();
    table.string("buyer_address").notNullable();

    table.decimal("desired_quantity", 30, 6);
    table.decimal("max_price_per_share", 30, 6);

    table
      .enu("status", ["OPEN", "MATCHED", "CANCELLED"])
      .defaultTo("OPEN");

    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("wanted_requests");
};
