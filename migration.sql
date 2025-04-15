-- Create security_events table for audit trail
CREATE TABLE IF NOT EXISTS "security_events" (
  "id" SERIAL PRIMARY KEY,
  "event_type" VARCHAR(50) NOT NULL,
  "message" TEXT NOT NULL,
  "user_id" INT REFERENCES "users"("id") ON DELETE SET NULL,
  "wallet_address" VARCHAR(255),
  "ip_address" VARCHAR(45),
  "user_agent" TEXT,
  "resource_type" VARCHAR(50),
  "resource_id" TEXT,
  "request_data" JSONB,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "severity" VARCHAR(20) NOT NULL DEFAULT 'info',
  "network" VARCHAR(10) NOT NULL DEFAULT 'testnet'
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS "security_events_event_type_idx" ON "security_events" ("event_type");
CREATE INDEX IF NOT EXISTS "security_events_wallet_address_idx" ON "security_events" ("wallet_address");
CREATE INDEX IF NOT EXISTS "security_events_created_at_idx" ON "security_events" ("created_at");
CREATE INDEX IF NOT EXISTS "security_events_severity_idx" ON "security_events" ("severity");