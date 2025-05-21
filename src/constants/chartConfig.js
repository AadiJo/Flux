export const chartConfig = {
  backgroundGradientFrom: "#fff",
  backgroundGradientTo: "#fff",
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: "3",
    strokeWidth: "1",
    stroke: "#007aff",
  },
  withInnerLines: false,
  withOuterLines: false,
  xAxisLabel: "",
  yAxisLabel: "",
  formatYLabel: () => "",
  formatXLabel: () => "",
};

export const MAX_SPEED_DATA_POINTS = 30;
