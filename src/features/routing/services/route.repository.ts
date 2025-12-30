import { databaseService } from '../../../shared/database/database.service';
import {
  CustomRoute,
  CustomRouteSummary,
  Waypoint,
  Coordinate,
  RoutePlanningMode,
} from '../types';

interface RouteRow {
  id: string;
  name: string;
  description: string | null;
  mode: string;
  distance: number;
  duration: number | null;
  elevation_gain: number | null;
  elevation_loss: number | null;
  base_route_id: string | null;
  created_at: string;
  updated_at: string;
}

interface WaypointRow {
  id: string;
  route_id: string;
  latitude: number;
  longitude: number;
  name: string | null;
  type: string;
  order_index: number;
}

interface GeometryRow {
  route_id: string;
  geometry_json: string;
}

/**
 * Route repository for CRUD operations
 */
export const routeRepository = {
  /**
   * Save a new custom route
   */
  async saveRoute(route: CustomRoute): Promise<void> {
    await databaseService.transaction(async (db) => {
      // Insert route
      await db.runAsync(
        `INSERT INTO custom_routes (
          id, name, description, mode, distance, duration,
          elevation_gain, elevation_loss, base_route_id,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          route.id,
          route.name,
          route.description || null,
          route.mode,
          route.distance,
          route.duration || null,
          route.elevationGain || null,
          route.elevationLoss || null,
          route.baseRouteId || null,
          route.createdAt,
          route.updatedAt,
        ]
      );

      // Insert waypoints
      for (const waypoint of route.waypoints) {
        await db.runAsync(
          `INSERT INTO route_waypoints (
            id, route_id, latitude, longitude, name, type, order_index
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            waypoint.id,
            route.id,
            waypoint.latitude,
            waypoint.longitude,
            waypoint.name || null,
            waypoint.type,
            waypoint.order,
          ]
        );
      }

      // Insert geometry
      await db.runAsync(
        `INSERT INTO route_geometry (route_id, geometry_json) VALUES (?, ?)`,
        [route.id, JSON.stringify(route.geometry)]
      );
    });
  },

  /**
   * Get all saved routes (summaries only)
   */
  async getAllRoutes(): Promise<CustomRouteSummary[]> {
    const rows = await databaseService.query<RouteRow>(
      `SELECT * FROM custom_routes ORDER BY updated_at DESC`
    );

    const summaries: CustomRouteSummary[] = [];

    for (const row of rows) {
      // Get waypoint count
      const countResult = await databaseService.queryFirst<{ count: number }>(
        `SELECT COUNT(*) as count FROM route_waypoints WHERE route_id = ?`,
        [row.id]
      );

      summaries.push({
        id: row.id,
        name: row.name,
        description: row.description || undefined,
        mode: row.mode as RoutePlanningMode,
        distance: row.distance,
        elevationGain: row.elevation_gain || undefined,
        waypointCount: countResult?.count || 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      });
    }

    return summaries;
  },

  /**
   * Get a route by ID with full details
   */
  async getRouteById(id: string): Promise<CustomRoute | null> {
    const row = await databaseService.queryFirst<RouteRow>(
      `SELECT * FROM custom_routes WHERE id = ?`,
      [id]
    );

    if (!row) {
      return null;
    }

    // Get waypoints
    const waypointRows = await databaseService.query<WaypointRow>(
      `SELECT * FROM route_waypoints WHERE route_id = ? ORDER BY order_index`,
      [id]
    );

    const waypoints: Waypoint[] = waypointRows.map((wp) => ({
      id: wp.id,
      latitude: wp.latitude,
      longitude: wp.longitude,
      name: wp.name || undefined,
      type: wp.type as 'start' | 'via' | 'end',
      order: wp.order_index,
    }));

    // Get geometry
    const geometryRow = await databaseService.queryFirst<GeometryRow>(
      `SELECT geometry_json FROM route_geometry WHERE route_id = ?`,
      [id]
    );

    const geometry: Coordinate[] = geometryRow
      ? JSON.parse(geometryRow.geometry_json)
      : [];

    return {
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      mode: row.mode as RoutePlanningMode,
      waypoints,
      geometry,
      distance: row.distance,
      duration: row.duration || undefined,
      elevationGain: row.elevation_gain || undefined,
      elevationLoss: row.elevation_loss || undefined,
      baseRouteId: row.base_route_id || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  /**
   * Update an existing route
   */
  async updateRoute(
    id: string,
    updates: Partial<Omit<CustomRoute, 'id' | 'createdAt'>>
  ): Promise<void> {
    const now = new Date().toISOString();

    await databaseService.transaction(async (db) => {
      // Update route metadata
      if (updates.name !== undefined || updates.description !== undefined) {
        await db.runAsync(
          `UPDATE custom_routes SET
            name = COALESCE(?, name),
            description = COALESCE(?, description),
            updated_at = ?
          WHERE id = ?`,
          [
            updates.name || null,
            updates.description || null,
            now,
            id,
          ]
        );
      }

      // Update waypoints if provided
      if (updates.waypoints) {
        // Delete existing waypoints
        await db.runAsync(
          `DELETE FROM route_waypoints WHERE route_id = ?`,
          [id]
        );

        // Insert new waypoints
        for (const waypoint of updates.waypoints) {
          await db.runAsync(
            `INSERT INTO route_waypoints (
              id, route_id, latitude, longitude, name, type, order_index
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              waypoint.id,
              id,
              waypoint.latitude,
              waypoint.longitude,
              waypoint.name || null,
              waypoint.type,
              waypoint.order,
            ]
          );
        }
      }

      // Update geometry if provided
      if (updates.geometry) {
        await db.runAsync(
          `UPDATE route_geometry SET geometry_json = ? WHERE route_id = ?`,
          [JSON.stringify(updates.geometry), id]
        );
      }

      // Update distance/elevation if provided
      if (updates.distance !== undefined || updates.elevationGain !== undefined) {
        await db.runAsync(
          `UPDATE custom_routes SET
            distance = COALESCE(?, distance),
            elevation_gain = COALESCE(?, elevation_gain),
            elevation_loss = COALESCE(?, elevation_loss),
            updated_at = ?
          WHERE id = ?`,
          [
            updates.distance || null,
            updates.elevationGain || null,
            updates.elevationLoss || null,
            now,
            id,
          ]
        );
      }
    });
  },

  /**
   * Delete a route
   */
  async deleteRoute(id: string): Promise<void> {
    await databaseService.transaction(async (db) => {
      // Delete in order due to foreign keys
      await db.runAsync(`DELETE FROM route_geometry WHERE route_id = ?`, [id]);
      await db.runAsync(`DELETE FROM route_waypoints WHERE route_id = ?`, [id]);
      await db.runAsync(`DELETE FROM custom_routes WHERE id = ?`, [id]);
    });
  },

  /**
   * Duplicate a route with a new name
   */
  async duplicateRoute(id: string, newName: string): Promise<CustomRoute> {
    const original = await this.getRouteById(id);

    if (!original) {
      throw new Error('Route not found');
    }

    const now = new Date().toISOString();
    const newId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const duplicated: CustomRoute = {
      ...original,
      id: newId,
      name: newName,
      waypoints: original.waypoints.map((wp, index) => ({
        ...wp,
        id: `${newId}-wp-${index}`,
      })),
      createdAt: now,
      updatedAt: now,
    };

    await this.saveRoute(duplicated);

    return duplicated;
  },

  /**
   * Search routes by name
   */
  async searchRoutes(query: string): Promise<CustomRouteSummary[]> {
    const rows = await databaseService.query<RouteRow>(
      `SELECT * FROM custom_routes
       WHERE name LIKE ? OR description LIKE ?
       ORDER BY updated_at DESC`,
      [`%${query}%`, `%${query}%`]
    );

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      mode: row.mode as RoutePlanningMode,
      distance: row.distance,
      elevationGain: row.elevation_gain || undefined,
      waypointCount: 0, // Could add a join for this
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },
};
