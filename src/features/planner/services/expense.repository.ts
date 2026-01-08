/**
 * Expense Repository using WatermelonDB
 * Handles persistence and queries for trip expenses
 */
import { Q } from '@nozbe/watermelondb';
import {
  database,
  expensesCollection,
} from '../../../shared/database/watermelon/database';
import ExpenseModel from '../../../shared/database/watermelon/models/ExpenseModel';
import { Expense, ExpenseCategory, ExpenseSummary } from '../types';

/**
 * Convert WatermelonDB Expense model to Expense type
 */
function modelToExpense(model: ExpenseModel): Expense {
  return {
    id: model.id,
    tripPlanId: model.tripPlanId,
    dayPlanId: model.dayPlanId || undefined,
    date: model.date,
    amount: model.amount,
    currency: model.currency,
    category: model.category as ExpenseCategory,
    description: model.description || '',
    country: model.country || undefined,
    createdAt: new Date(model.createdAt).toISOString(),
    updatedAt: new Date(model.updatedAt).toISOString(),
  };
}

/**
 * WatermelonDB Expense Repository
 */
export const expenseRepository = {
  /**
   * Create a new expense
   */
  async createExpense(
    expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Expense> {
    const now = Date.now();

    let created: ExpenseModel | null = null;

    await database.write(async () => {
      created = await expensesCollection.create((record) => {
        record.tripPlanId = expense.tripPlanId;
        record.dayPlanId = expense.dayPlanId || null;
        record.date = expense.date;
        record.amount = expense.amount;
        record.currency = expense.currency;
        record.category = expense.category;
        record.description = expense.description || null;
        record.country = expense.country || null;
        record.createdAt = now;
        record.updatedAt = now;
      });
    });

    if (!created) {
      throw new Error('Failed to create expense');
    }

    return modelToExpense(created);
  },

  /**
   * Update an existing expense
   */
  async updateExpense(
    id: string,
    updates: Partial<Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Expense | null> {
    const now = Date.now();

    const expenses = await expensesCollection.query(Q.where('id', id)).fetch();

    if (expenses.length === 0) {
      return null;
    }

    const expense = expenses[0];

    await database.write(async () => {
      await expense.update((record) => {
        if (updates.tripPlanId !== undefined) record.tripPlanId = updates.tripPlanId;
        if (updates.dayPlanId !== undefined) record.dayPlanId = updates.dayPlanId || null;
        if (updates.date !== undefined) record.date = updates.date;
        if (updates.amount !== undefined) record.amount = updates.amount;
        if (updates.currency !== undefined) record.currency = updates.currency;
        if (updates.category !== undefined) record.category = updates.category;
        if (updates.description !== undefined) record.description = updates.description || null;
        if (updates.country !== undefined) record.country = updates.country || null;
        record.updatedAt = now;
      });
    });

    return modelToExpense(expense);
  },

  /**
   * Delete an expense
   */
  async deleteExpense(id: string): Promise<boolean> {
    const expenses = await expensesCollection.query(Q.where('id', id)).fetch();

    if (expenses.length === 0) {
      return false;
    }

    await database.write(async () => {
      await expenses[0].destroyPermanently();
    });

    return true;
  },

  /**
   * Get all expenses for a trip plan
   */
  async getExpensesByTripPlan(tripPlanId: string): Promise<Expense[]> {
    const expenses = await expensesCollection
      .query(Q.where('trip_plan_id', tripPlanId))
      .fetch();

    return expenses.map(modelToExpense);
  },

  /**
   * Get all expenses for a specific day plan
   */
  async getExpensesByDayPlan(dayPlanId: string): Promise<Expense[]> {
    const expenses = await expensesCollection
      .query(Q.where('day_plan_id', dayPlanId))
      .fetch();

    return expenses.map(modelToExpense);
  },

  /**
   * Get expenses for a date range
   */
  async getExpensesByDateRange(
    tripPlanId: string,
    startDate: string,
    endDate: string
  ): Promise<Expense[]> {
    const expenses = await expensesCollection
      .query(
        Q.and(
          Q.where('trip_plan_id', tripPlanId),
          Q.where('date', Q.gte(startDate)),
          Q.where('date', Q.lte(endDate))
        )
      )
      .fetch();

    return expenses.map(modelToExpense);
  },

  /**
   * Get expenses by category
   */
  async getExpensesByCategory(
    tripPlanId: string,
    category: ExpenseCategory
  ): Promise<Expense[]> {
    const expenses = await expensesCollection
      .query(
        Q.and(
          Q.where('trip_plan_id', tripPlanId),
          Q.where('category', category)
        )
      )
      .fetch();

    return expenses.map(modelToExpense);
  },

  /**
   * Calculate expense summary for a trip
   */
  async getExpenseSummary(tripPlanId: string): Promise<ExpenseSummary> {
    const expenses = await this.getExpensesByTripPlan(tripPlanId);

    if (expenses.length === 0) {
      return {
        totalAmount: 0,
        currency: 'EUR',
        byCategory: {
          accommodation: 0,
          food: 0,
          transport: 0,
          repairs: 0,
          other: 0,
        },
        byDay: {},
        byCountry: {},
        averagePerDay: 0,
      };
    }

    // Assuming all expenses are in the same currency (first expense's currency)
    const currency = expenses[0].currency;

    const byCategory: Record<ExpenseCategory, number> = {
      accommodation: 0,
      food: 0,
      transport: 0,
      repairs: 0,
      other: 0,
    };

    const byDay: Record<string, number> = {};
    const byCountry: Record<string, number> = {};
    let totalAmount = 0;

    for (const expense of expenses) {
      totalAmount += expense.amount;
      byCategory[expense.category] += expense.amount;

      // Aggregate by day
      byDay[expense.date] = (byDay[expense.date] || 0) + expense.amount;

      // Aggregate by country
      if (expense.country) {
        byCountry[expense.country] = (byCountry[expense.country] || 0) + expense.amount;
      }
    }

    const uniqueDays = Object.keys(byDay).length;
    const averagePerDay = uniqueDays > 0 ? totalAmount / uniqueDays : 0;

    return {
      totalAmount,
      currency,
      byCategory,
      byDay,
      byCountry,
      averagePerDay,
    };
  },

  /**
   * Get total expenses for a specific date
   */
  async getDailyTotal(tripPlanId: string, date: string): Promise<number> {
    const expenses = await expensesCollection
      .query(
        Q.and(
          Q.where('trip_plan_id', tripPlanId),
          Q.where('date', date)
        )
      )
      .fetch();

    return expenses.reduce((sum, exp) => sum + exp.amount, 0);
  },

  /**
   * Delete all expenses for a trip plan
   */
  async deleteAllExpensesForTrip(tripPlanId: string): Promise<number> {
    const expenses = await expensesCollection
      .query(Q.where('trip_plan_id', tripPlanId))
      .fetch();

    if (expenses.length === 0) {
      return 0;
    }

    await database.write(async () => {
      const deleteOps = expenses.map((exp) => exp.prepareDestroyPermanently());
      await database.batch(deleteOps);
    });

    return expenses.length;
  },
};
