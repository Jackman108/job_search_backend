/**
 * Platform DB public API (phase 1′ completion for ideal-gap I7).
 * Domain modules should prefer this over `src/utils` for queries.
 */
export {
    checkTableExists,
    deleteTable,
    executeQuery,
    generateSetClause,
    generateUpdateQuery,
    generateUpdateQueryWithConditions,
} from '../../utils/queryHelpers.js';
