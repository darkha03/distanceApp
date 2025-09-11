import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import * as React from "react";
import { Text, TextProps } from "react-native";


export const AppText: React.FC<TextProps> = ({ style, ...props }) => {
  const colorScheme = useColorScheme();
  const color = colorScheme === "dark" ? Colors.dark.text : Colors.light.text;
  return <Text style={[{ color }, style]} {...props} />;
};
