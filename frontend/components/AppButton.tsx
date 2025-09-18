import { Colors } from "@/constants/Colors";
import * as React from "react";
import { StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle, View } from "react-native";

type AppButtonProps = {
  title: string;
  onPress: () => void;
  color?: string;
  textColor?: string;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  children?: React.ReactNode;
};

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  color,
  textColor,
  disabled = false,
  style,
  textStyle,
  children,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        { backgroundColor: color || Colors.light.primary, opacity: disabled ? 0.6 : 1 },
        style,
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
        {children}
        {title ? (
          <Text style={[styles.text, { color: textColor || "#fff" }, textStyle]}>
            {title}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 16,
    fontWeight: "600",
  },
});
