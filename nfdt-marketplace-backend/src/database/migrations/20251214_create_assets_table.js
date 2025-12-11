// migrations/20251214_create_assets_table.js

exports.up = function (knex) {
  return knex.schema.createTable("assets", (table) => {
    table.uuid("id").primary();
    table.string("name").notNullable();
    table.string("type").notNullable(); // real_estate / company / vehicle / etc
    table.text("description");

    // NFDT metadata + NeoContract
    table.string("metadata_uri");
    table.string("neo_contract_address");
    table.string("owner_address"); // chain owner

    table.timestamps(true, true); // created_at, updated_at
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("assets");
};
