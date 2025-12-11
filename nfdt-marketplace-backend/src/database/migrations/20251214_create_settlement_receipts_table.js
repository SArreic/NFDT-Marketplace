// migrations/20251214_create_settlement_receipts_table.js

exports.up = function (knex) {
  return knex.schema.createTable("settlement_receipts", (table) => {
    table.uuid("id").primary();

    table.uuid("trade_id").notNullable();

    table.string("event_type").notNullable(); // MINT / TRANSFER / ATOMIC_SWAP
    table.string("tx_hash");
    table.integer("block_number");

    table
      .enu("status", ["PENDING", "SUCCESS", "FAILED"])
      .defaultTo("PENDING");

    table.timestamp("timestamp").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("settlement_receipts");
};
