import * as SQLite from 'expo-sqlite';
import { DB_NAME, SCHEMA_VERSION, ALL_TABLES, ALL_INDEXES, CREATE_TABLES, CREATE_INDEXES } from './schema';
import { logger } from '../utils';

// Type alias for SQLite parameter values
type SqliteParams = (string | number | null | boolean | Uint8Array)[];

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;
  private dbOpenPromise: Promise<SQLite.SQLiteDatabase> | null = null;

  /**
   * Get the database instance, initializing if needed
   * Uses promise-based locking to prevent concurrent initialization
   */
  async getDatabase(): Promise<SQLite.SQLiteDatabase> {
    // Use promise-based lock for opening database
    if (!this.db) {
      if (!this.dbOpenPromise) {
        this.dbOpenPromise = SQLite.openDatabaseAsync(DB_NAME);
      }
      this.db = await this.dbOpenPromise;
    }

    // Use promise-based lock for initialization
    if (!this.initialized) {
      if (!this.initPromise) {
        this.initPromise = this.initialize();
      }
      await this.initPromise;
    }

    return this.db;
  }

  /**
   * Initialize the database with schema
   */
  private async initialize(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not opened');
    }

    try {
      // Enable foreign keys
      await this.db.execAsync('PRAGMA foreign_keys = ON;');

      // Create tables
      for (const sql of ALL_TABLES) {
        await this.db.execAsync(sql);
      }

      // Create indexes
      for (const sql of ALL_INDEXES) {
        await this.db.execAsync(sql);
      }

      // Check/update schema version
      const versionResult = await this.db.getFirstAsync<{ version: number }>(
        'SELECT version FROM schema_version LIMIT 1'
      );

      if (!versionResult) {
        await this.db.runAsync(
          'INSERT INTO schema_version (version) VALUES (?)',
          [SCHEMA_VERSION]
        );
      } else if (versionResult.version < SCHEMA_VERSION) {
        // Run migrations if needed
        await this.runMigrations(versionResult.version, SCHEMA_VERSION);
      }

      this.initialized = true;
      logger.info('database', 'Database initialized successfully');
    } catch (error) {
      logger.error('database', 'Database initialization failed', error);
      throw error;
    }
  }

  /**
   * Run database migrations
   */
  private async runMigrations(fromVersion: number, toVersion: number): Promise<void> {
    logger.info('database', `Migrating database from v${fromVersion} to v${toVersion}`);

    if (!this.db) {
      throw new Error('Database not opened');
    }

    // Migration from v1 to v2: Add POI tables
    if (fromVersion < 2) {
      logger.info('database', 'Running migration v1 -> v2: Adding POI tables');

      // Create POI tables
      await this.db.execAsync(CREATE_TABLES.pois);
      await this.db.execAsync(CREATE_TABLES.poiFavorites);
      await this.db.execAsync(CREATE_TABLES.poiCacheTiles);

      // Create POI indexes
      await this.db.execAsync(CREATE_INDEXES.poisCategory);
      await this.db.execAsync(CREATE_INDEXES.poisLocation);
      await this.db.execAsync(CREATE_INDEXES.poisExpiry);
      await this.db.execAsync(CREATE_INDEXES.poiFavoritesDate);
    }

    // Migration from v2 to v3: Add EuroVelo route cache tables
    if (fromVersion < 3) {
      logger.info('database', 'Running migration v2 -> v3: Adding EuroVelo cache tables');

      // Create EuroVelo cache tables
      await this.db.execAsync(CREATE_TABLES.euroveloCacheRoutes);
      await this.db.execAsync(CREATE_TABLES.euroveloCacheSegments);

      // Create EuroVelo cache indexes
      await this.db.execAsync(CREATE_INDEXES.euroveloCacheRouteId);
      await this.db.execAsync(CREATE_INDEXES.euroveloCacheSegmentOrder);
    }

    // Migration from v3 to v4: Add weather cache table
    if (fromVersion < 4) {
      logger.info('database', 'Running migration v3 -> v4: Adding weather cache table');

      // Create weather cache table and index
      await this.db.execAsync(CREATE_TABLES.weatherCache);
      await this.db.execAsync(CREATE_INDEXES.weatherCacheExpiry);
    }

    // Migration from v4 to v5: Add elevation cache table
    if (fromVersion < 5) {
      logger.info('database', 'Running migration v4 -> v5: Adding elevation cache table');

      // Create elevation cache table and index
      await this.db.execAsync(CREATE_TABLES.elevationCache);
      await this.db.execAsync(CREATE_INDEXES.elevationCacheExpiry);
    }

    // Update version after migrations
    await this.db.runAsync(
      'UPDATE schema_version SET version = ?',
      [toVersion]
    );
  }

  /**
   * Execute a query that returns rows
   */
  async query<T>(sql: string, params: SqliteParams = []): Promise<T[]> {
    const db = await this.getDatabase();
    return db.getAllAsync<T>(sql, params);
  }

  /**
   * Execute a query that returns a single row
   */
  async queryFirst<T>(sql: string, params: SqliteParams = []): Promise<T | null> {
    const db = await this.getDatabase();
    return db.getFirstAsync<T>(sql, params);
  }

  /**
   * Execute an insert/update/delete statement
   */
  async execute(sql: string, params: SqliteParams = []): Promise<SQLite.SQLiteRunResult> {
    const db = await this.getDatabase();
    return db.runAsync(sql, params);
  }

  /**
   * Execute multiple statements in a transaction
   * Note: expo-sqlite's withTransactionAsync returns void, so we capture the result separately
   */
  async transaction<T>(
    callback: (db: SQLite.SQLiteDatabase) => Promise<T>
  ): Promise<T> {
    const db = await this.getDatabase();
    let result: T;
    await db.withTransactionAsync(async () => {
      result = await callback(db);
    });
    return result!;
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      this.initialized = false;
    }
  }

  /**
   * Delete all data (for testing/reset)
   */
  async deleteAllData(): Promise<void> {
    const db = await this.getDatabase();
    await db.execAsync(`
      DELETE FROM route_geometry;
      DELETE FROM route_waypoints;
      DELETE FROM custom_routes;
      DELETE FROM search_history;
    `);
  }
}

// Singleton instance
export const databaseService = new DatabaseService();
