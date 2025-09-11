import { Colors } from "@/constants/Colors";
import * as React from "react";
import { StyleSheet, TextInput, TextInputProps, View, ViewStyle } from "react-native";

type AppInputProps = TextInputProps & {
  containerStyle?: ViewStyle;
};

export const AppInput: React.FC<AppInputProps> = ({ containerStyle, style, ...props }) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={Colors.light.text + "99"} // slightly transparent
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  input: {
    height: 48,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.text + "33", // light gray border
    fontSize: 16,
    color: Colors.light.text,
  },
});
