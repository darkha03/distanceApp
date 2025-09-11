import { Colors } from "@/constants/Colors";
import * as React from "react";
import { StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native";

type AppCardProps = {
  title: string;
  description?: string;
  onPress?: () => void;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  descriptionStyle?: TextStyle;
};

export const AppCard: React.FC<AppCardProps> = (props: AppCardProps) => {
  const { title, description, onPress, style, titleStyle, descriptionStyle } = props;
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container onPress={onPress} style={[styles.card, style]}>
      <Text style={[styles.title, titleStyle]}>{title}</Text>
      {description && <Text style={[styles.description, descriptionStyle]}>{description}</Text>}
    </Container>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.background,
    padding: 16,
    borderRadius: 10,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3, // for Android shadow
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: Colors.light.text,
  },
});
