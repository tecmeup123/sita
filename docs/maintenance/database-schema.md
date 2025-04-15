# SiTa Minter Database Schema Guide

This guide explains the database structure of the SiTa Minter application and provides instructions for maintaining and updating it.

## Table of Contents

1. [Introduction](#introduction)
2. [Database Overview](#database-overview)
3. [Schema Definition](#schema-definition)
4. [Core Tables](#core-tables)
5. [Relationships](#relationships)
6. [Migrations](#migrations)
7. [Maintaining the Database](#maintaining-the-database)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

## Introduction

SiTa Minter uses a PostgreSQL database with the Drizzle ORM for data management. This guide provides a comprehensive overview of the database structure, relationships, and maintenance procedures.

## Database Overview

The database is organized around these core entities:

1. **Users**: Wallet holders who create and manage tokens
2. **Tokens**: RGB++ tokens created in the application
3. **Transactions**: Records of token-related blockchain transactions
4. **SecurityEvents**: Audit trail of security-related events
5. **Settings**: Application configuration settings

## Schema Definition

The database schema is defined in `shared/schema.ts` using Drizzle ORM's schema definition language.

### Schema Structure

```typescript
// shared/schema.ts
import { pgTable, serial, text, timestamp, integer, boolean, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// User table definition
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  walletAddress: text('wallet_address').notNull().unique(),
  username: text('username'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Token table definition
export const tokens = pgTable('tokens', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  symbol: text('symbol').notNull(),
  supply: text('supply').notNull(),
  creatorId: integer('creator_id').references(() => users.id).notNull(),
  description: text('description'),
  iconUrl: text('icon_url'),
  contractAddress: text('contract_address'),
  networkId: text('network_id').notNull(),
  txHash: text('tx_hash'),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Transaction table definition
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  tokenId: integer('token_id').references(() => tokens.id),
  txHash: text('tx_hash').notNull(),
  txType: text('tx_type').notNull(),
  status: text('status').notNull().default('pending'),
  amount: text('amount'),
  networkId: text('network_id').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Security events table for audit trail
export const securityEvents = pgTable('security_events', {
  id: serial('id').primaryKey(),
  eventType: text('event_type').notNull(),
  description: text('description').notNull(),
  ipAddress: text('ip_address'),
  userId: integer('user_id').references(() => users.id),
  walletAddress: text('wallet_address'),
  metadata: jsonb('metadata'),
  severity: text('severity').default('info'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Settings table for application configuration
export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  description: text('description'),
  isPublic: boolean('is_public').default(false),
  lastUpdated: timestamp('last_updated').defaultNow().notNull()
});

// Define insert schemas using drizzle-zod
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertTokenSchema = createInsertSchema(tokens).omit({ id: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true });
export const insertSecurityEventSchema = createInsertSchema(securityEvents).omit({ id: true });
export const insertSettingSchema = createInsertSchema(settings).omit({ id: true });

// Define types using the schemas
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertToken = z.infer<typeof insertTokenSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertSecurityEvent = z.infer<typeof insertSecurityEventSchema>;
export type InsertSetting = z.infer<typeof insertSettingSchema>;

// Define select types
export type User = typeof users.$inferSelect;
export type Token = typeof tokens.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type SecurityEvent = typeof securityEvents.$inferSelect;
export type Setting = typeof settings.$inferSelect;
```

## Core Tables

### Users Table

The `users` table stores information about user wallets:

| Column         | Type      | Description                         |
|----------------|-----------|-------------------------------------|
| id             | serial    | Primary key                         |
| wallet_address | text      | Blockchain wallet address           |
| username       | text      | Optional display name               |
| created_at     | timestamp | When the user record was created    |
| updated_at     | timestamp | When the user record was last updated |

### Tokens Table

The `tokens` table stores information about RGB++ tokens created in the application:

| Column            | Type      | Description                          |
|-------------------|-----------|--------------------------------------|
| id                | serial    | Primary key                          |
| name              | text      | Token name                           |
| symbol            | text      | Token symbol (typically 3-4 chars)   |
| supply            | text      | Total token supply                   |
| creator_id        | integer   | Foreign key to users.id              |
| description       | text      | Token description                    |
| icon_url          | text      | URL to token icon                    |
| contract_address  | text      | Token contract address (if applicable) |
| network_id        | text      | Network identifier (mainnet/testnet) |
| tx_hash           | text      | Transaction hash of creation         |
| status            | text      | Token status (pending/confirmed/failed) |
| created_at        | timestamp | When the token was created           |
| updated_at        | timestamp | When the token was last updated      |

### Transactions Table

The `transactions` table records blockchain transactions related to tokens:

| Column       | Type      | Description                          |
|--------------|-----------|--------------------------------------|
| id           | serial    | Primary key                          |
| user_id      | integer   | Foreign key to users.id              |
| token_id     | integer   | Foreign key to tokens.id (if applicable) |
| tx_hash      | text      | Transaction hash                     |
| tx_type      | text      | Transaction type (create/transfer/etc) |
| status       | text      | Transaction status (pending/confirmed/failed) |
| amount       | text      | Transaction amount (if applicable)   |
| network_id   | text      | Network identifier                   |
| metadata     | jsonb     | Additional transaction data          |
| created_at   | timestamp | When the transaction was created     |
| updated_at   | timestamp | When the transaction was last updated |

### SecurityEvents Table

The `security_events` table provides an audit trail of security-related events:

| Column         | Type      | Description                          |
|----------------|-----------|--------------------------------------|
| id             | serial    | Primary key                          |
| event_type     | text      | Type of security event               |
| description    | text      | Description of the event             |
| ip_address     | text      | IP address associated with the event |
| user_id        | integer   | Foreign key to users.id (if applicable) |
| wallet_address | text      | Wallet address (if applicable)       |
| metadata       | jsonb     | Additional event data                |
| severity       | text      | Event severity (info/warning/error/critical) |
| created_at     | timestamp | When the event was logged            |

### Settings Table

The `settings` table stores application configuration settings:

| Column       | Type      | Description                          |
|--------------|-----------|--------------------------------------|
| id           | serial    | Primary key                          |
| key          | text      | Setting identifier (unique)          |
| value        | text      | Setting value                        |
| description  | text      | Setting description                  |
| is_public    | boolean   | Whether visible to frontend          |
| last_updated | timestamp | When the setting was last updated    |

## Relationships

The database has several important relationships:

1. **User-to-Tokens**: One-to-many relationship where a user can create multiple tokens
   - Foreign key: `tokens.creator_id` references `users.id`

2. **User-to-Transactions**: One-to-many relationship where a user can have multiple transactions
   - Foreign key: `transactions.user_id` references `users.id`

3. **Token-to-Transactions**: One-to-many relationship where a token can have multiple transactions
   - Foreign key: `transactions.token_id` references `tokens.id`

4. **User-to-SecurityEvents**: One-to-many relationship where security events can be associated with a user
   - Foreign key: `security_events.user_id` references `users.id`

## Migrations

SiTa Minter uses Drizzle Kit for managing database migrations.

### Running Migrations

To push schema changes to the database:

```bash
npm run db:push
```

This command uses Drizzle Kit's `push` feature to sync the schema defined in `shared/schema.ts` with the database.

### Migration Warnings

When running migrations, you might see warnings about potential data loss. These warnings occur when:

1. Dropping a column
2. Changing a column type
3. Making a nullable column non-nullable
4. Removing a default value

Always carefully review these warnings before proceeding.

### Safe Migration Process

For critical schema changes:

1. **Backup the database**:
   ```bash
   pg_dump -U [username] -d sitaminter > backup_before_migration.sql
   ```

2. **Run migration in dry-run mode**:
   ```bash
   npm run db:push -- --dry-run
   ```

3. **Review changes and warnings**

4. **Apply changes**:
   ```bash
   npm run db:push
   ```

5. **Verify data integrity**

## Maintaining the Database

### Regular Maintenance

Perform these maintenance tasks regularly:

1. **Vacuum and Analyze**:
   ```sql
   VACUUM ANALYZE;
   ```

2. **Check index usage**:
   ```sql
   SELECT
     relname AS table_name,
     indexrelname AS index_name,
     idx_scan,
     idx_tup_read,
     idx_tup_fetch
   FROM
     pg_stat_user_indexes
   ORDER BY
     idx_scan DESC;
   ```

3. **Identify slow queries**:
   Enable query logging in PostgreSQL to identify performance issues.

### Backup Strategy

Implement a robust backup strategy:

1. **Regular backups**:
   ```bash
   # Create a full database backup
   pg_dump -U [username] -d sitaminter > sitaminter_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Automated backup script**:
   ```bash
   #!/bin/bash
   BACKUP_DIR="/path/to/backups"
   TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
   pg_dump -U [username] -d sitaminter > $BACKUP_DIR/sitaminter_$TIMESTAMP.sql
   gzip $BACKUP_DIR/sitaminter_$TIMESTAMP.sql
   
   # Remove backups older than 30 days
   find $BACKUP_DIR -name "sitaminter_*.sql.gz" -type f -mtime +30 -delete
   ```

3. **Test backup restoration**:
   Regularly verify that backups can be restored:
   ```bash
   createdb sitaminter_test
   psql -d sitaminter_test < backup_file.sql
   ```

## Best Practices

### Schema Updates

When updating the database schema:

1. **Document all changes**: Maintain a changelog of schema modifications
2. **Use nullable columns** for new additions to existing tables
3. **Add default values** where appropriate
4. **Create indexes** for frequently queried columns
5. **Use transactions** for complex migrations

### Query Optimization

Optimize database queries by:

1. **Using indexes properly**:
   ```sql
   -- Add indexes for frequently queried columns
   CREATE INDEX idx_tokens_creator_id ON tokens(creator_id);
   CREATE INDEX idx_transactions_user_id ON transactions(user_id);
   CREATE INDEX idx_security_events_created_at ON security_events(created_at);
   ```

2. **Limiting result sets**:
   ```typescript
   // In server code
   const getRecentTransactions = async (userId: number, limit = 10) => {
     return db.query.transactions.findMany({
       where: eq(transactions.userId, userId),
       orderBy: desc(transactions.createdAt),
       limit
     });
   };
   ```

3. **Using joins efficiently**:
   ```typescript
   // Get tokens with creator information
   const getTokensWithCreators = async () => {
     return db.query.tokens.findMany({
       with: {
         creator: true
       }
     });
   };
   ```

### Security Considerations

Protect your database with:

1. **Parameterized queries**:
   ```typescript
   // GOOD: Using parameterized queries
   const getUserTokens = async (userId: number) => {
     return db.query.tokens.findMany({
       where: eq(tokens.creatorId, userId)
     });
   };
   
   // BAD: String concatenation (vulnerable to SQL injection)
   // NEVER DO THIS
   const getUserTokens = async (userId: number) => {
     return db.execute(`SELECT * FROM tokens WHERE creator_id = ${userId}`);
   };
   ```

2. **Least privilege principle**:
   - Use a database user with only the permissions it needs
   - Avoid using the database owner account in application code

3. **Data validation**:
   - Always validate data before inserting or updating

## Troubleshooting

### Common Issues

1. **Migration Failures**:
   - Check for data integrity issues
   - Review migration logs for specific errors
   - Consider running migrations in smaller chunks

2. **Connection Issues**:
   - Verify database credentials and connection string
   - Check network connectivity
   - Review connection pool settings

3. **Performance Problems**:
   - Analyze slow queries
   - Check for missing indexes
   - Consider query optimization

### Diagnostic Queries

Useful queries for diagnosing database issues:

```sql
-- Check table sizes
SELECT
  table_name,
  pg_size_pretty(pg_total_relation_size(table_name)) as total_size
FROM
  information_schema.tables
WHERE
  table_schema = 'public'
ORDER BY
  pg_total_relation_size(table_name) DESC;

-- Find missing indexes
SELECT
  relname as table_name,
  seq_scan - idx_scan as too_much_seq,
  CASE
    WHEN seq_scan - idx_scan > 0 THEN 'Missing Index?'
    ELSE 'OK'
  END as index_use_status,
  pg_size_pretty(pg_relation_size(relname::regclass)) as table_size
FROM
  pg_stat_user_tables
WHERE
  schemaname = 'public'
ORDER BY
  too_much_seq DESC;

-- Check for long-running queries
SELECT
  pid,
  now() - pg_stat_activity.query_start as duration,
  query
FROM
  pg_stat_activity
WHERE
  state = 'active' AND
  now() - pg_stat_activity.query_start > interval '1 minute'
ORDER BY
  duration DESC;
```

## Conclusion

This guide provides a comprehensive overview of the SiTa Minter database structure and maintenance procedures. Following these guidelines will help ensure data integrity, performance, and security for your application.

When making changes to the database schema, always consider the impact on existing data and application functionality. Test thoroughly in a development environment before applying changes to production.