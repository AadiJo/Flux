import { getSafetyScore } from "../services/scoringService";

/**
 * Utility class for managing safety score updates across the app
 */
class ScoreManager {
  constructor() {
    this.listeners = new Set();
  }

  /**
   * Add a listener that will be called when scores are updated
   */
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners that scores have been updated
   */
  notifyListeners(scoreData) {
    this.listeners.forEach((callback) => {
      try {
        callback(scoreData);
      } catch (error) {
        console.error("Error in score listener:", error);
      }
    });
  }

  /**
   * Trigger a score refresh and notify listeners
   */
  async refreshScores(speedingThreshold = 5, forceUpdate = false) {
    try {
      console.log("ScoreManager: Refreshing safety scores");
      const scoreData = await getSafetyScore(speedingThreshold, forceUpdate);
      this.notifyListeners(scoreData);
      return scoreData;
    } catch (error) {
      console.error("ScoreManager: Error refreshing scores:", error);
      throw error;
    }
  }
}

// Export a singleton instance
export const scoreManager = new ScoreManager();

/**
 * Hook for components that want to listen to score updates
 */
export const useScoreUpdates = (callback) => {
  React.useEffect(() => {
    const unsubscribe = scoreManager.addListener(callback);
    return unsubscribe;
  }, [callback]);
};
