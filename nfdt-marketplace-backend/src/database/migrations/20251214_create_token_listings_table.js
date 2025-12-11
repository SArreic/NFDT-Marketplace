// migrations/20251214_create_token_listings_table.js

exports.up = function (knex) {
  return knex.schema.createTable("token_listings", (table) => {
    table.uuid("id").primary();
    table.uuid("asset_id").notNullable();

    table
      .foreign("asset_id")
      .references("id")
      .inTable("assets")
      .onDelete("CASCADE");

    // Listing types
    table
      .enu("listing_type", ["ENTITY", "SHARES"])
      .notNullable()
      .defaultTo("ENTITY");

    // Marketplace lifecycle statuses
    table
      .enu("status", [
        "DRAFT",
        "PENDING_REVIEW",
        "APPROVED",
        "LISTED",
        "SUSPENDED",
        "DELISTED",
      ])
      .defaultTo("DRAFT");

    table.string("seller_address");

    // Supply & pricing
    table.decimal("total_supply", 30, 6);
    table.decimal("tokens_for_sale", 30, 6);
    table.decimal("remaining_shares", 30, 6);

    table.decimal("price_per_token", 30, 6);
    table.decimal("min_price_per_share", 30, 6);
    table.decimal("valuation_usd", 30, 6);

    // Settlement currency
    table.string("settlement_token").defaultTo("USDT");

    // Smart contract address
    table.string("currency_address");
    table.string("contract_address");

    // Compliance
    table.jsonb("investor_eligibility").defaultTo({});
    table.integer("esg_score");
    table.jsonb("esg_details").defaultTo({});
    table.specificType("regulatory_disclosures", "text[]");

    table.timestamp("listing_date");

    table.boolean("is_active").defaultTo(true);

    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("token_listings");
};
