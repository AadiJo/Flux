/**
 * Utility functions for calculating score colors with smooth gradients
 */

/**
 * Interpolates between two RGB color values
 * @param {Array} color1 - RGB array for first color [r, g, b]
 * @param {Array} color2 - RGB array for second color [r, g, b]
 * @param {number} factor - Interpolation factor (0-1)
 * @returns {Array} Interpolated RGB color
 */
const interpolateColor = (color1, color2, factor) => {
  const r = Math.round(color1[0] + factor * (color2[0] - color1[0]));
  const g = Math.round(color1[1] + factor * (color2[1] - color1[1]));
  const b = Math.round(color1[2] + factor * (color2[2] - color1[2]));
  return [r, g, b];
};

/**
 * Converts RGB array to hex color string
 * @param {Array} rgb - RGB array [r, g, b]
 * @returns {string} Hex color string
 */
const rgbToHex = (rgb) => {
  const [r, g, b] = rgb;
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

/**
 * Gets a smooth gradient color for scores from 70-100
 * Uses red → orange → yellow → green gradient
 * @param {number} score - Score value (should be 70-100 for gradient, but handles all values)
 * @returns {string} Hex color string
 */
export const getScoreGradientColor = (score) => {
  // Handle edge cases
  if (typeof score !== "number" || isNaN(score)) {
    return "#9E9E9E"; // Gray for invalid scores
  }

  // For scores below 70, use a fixed red color
  if (score < 70) {
    return "#F44336"; // Red
  }

  // For scores 100 and above, use a fixed green color
  if (score >= 100) {
    return "#4CAF50"; // Green
  }

  // Define gradient colors (RGB values)
  const red = [244, 67, 54]; // #F44336
  const orange = [255, 152, 0]; // #FF9800
  const yellow = [255, 235, 59]; // #FFEB3B
  const green = [76, 175, 80]; // #4CAF50

  // Normalize score to 0-1 range within 70-100
  const normalizedScore = (score - 70) / 30;

  let resultColor;

  if (normalizedScore <= 0.33) {
    // Red to Orange (70-80)
    const factor = normalizedScore / 0.33;
    resultColor = interpolateColor(red, orange, factor);
  } else if (normalizedScore <= 0.67) {
    // Orange to Yellow (80-90)
    const factor = (normalizedScore - 0.33) / 0.34;
    resultColor = interpolateColor(orange, yellow, factor);
  } else {
    // Yellow to Green (90-100)
    const factor = (normalizedScore - 0.67) / 0.33;
    resultColor = interpolateColor(yellow, green, factor);
  }

  return rgbToHex(resultColor);
};

/**
 * Legacy function for backward compatibility
 * @deprecated Use getScoreGradientColor instead
 */
export const getScoreColor = (score) => {
  return getScoreGradientColor(score);
};
