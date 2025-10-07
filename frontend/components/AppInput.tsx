import { Colors } from "@/constants/Colors";
import * as React from "react";
import { StyleSheet, TextInput, TextInputProps, View, ViewStyle, Animated, Platform } from "react-native";

type AppInputProps = TextInputProps & {
  containerStyle?: ViewStyle;
};

export const AppInput: React.FC<AppInputProps> = ({
  containerStyle,
  style,
  placeholder,
  value,
  ...props
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const animated = React.useRef(new Animated.Value(value ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(animated, {
      toValue: isFocused || value ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value, animated]);

  const labelStyle = {
    position: "absolute" as const,
    left: 14,
    top: animated.interpolate({
      inputRange: [0, 1],
      outputRange: [16, -8],
    }),
    fontSize: animated.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: Colors.light.text + "99",
    backgroundColor: Colors.light.background,
    paddingHorizontal: 2,
    zIndex: 2,
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {placeholder ? (
        <Animated.Text style={labelStyle}>
          {placeholder}
        </Animated.Text>
      ) : null}
      <TextInput
        style={[styles.input, style]}
        value={value}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChangeText={props.onChangeText}
        {...props}
        placeholder={""}
        underlineColorAndroid="transparent"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    position: "relative",
  },
  input: {
    height: 48,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.text + "33",
    fontSize: 16,
    color: Colors.light.text,
    backgroundColor: Colors.light.background,
  },
});
