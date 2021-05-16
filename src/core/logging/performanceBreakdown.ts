/*
 * Represents a time measurement within an API operation
 */
export interface PerformanceBreakdown {
    createChild(name: string): PerformanceBreakdown
}
