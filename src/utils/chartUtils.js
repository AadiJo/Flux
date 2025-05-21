import { Dimensions } from "react-native";
import { chartConfig } from "../constants/chartConfig";

const screenWidth = Dimensions.get("window").width;

export const createSpeedChartData = (speedHistory) => ({
  labels: [],
  datasets: [
    {
      data: speedHistory.length > 0 ? speedHistory : [0],
      color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
      strokeWidth: 2,
    },
  ],
});

export const getChartDimensions = () => ({
  width: screenWidth * 0.9,
  height: 220,
});

export const getChartConfig = () => ({
  ...chartConfig,
  yAxisSuffix: " mph",
  yLabelsOffset: 5,
  paddingRight: 35,
  paddingLeft: 0,
});
