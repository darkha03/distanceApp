/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    background: "#000000", // Black
    text: "#FFFFFF",       // White
    primary: "#c9a4f7",    // Purple (tabs, icons, highlights)
    secondary: "#CCCCCC",  // Light gray
    border: "#333333",     // Dark gray for input borders
    success: "#4CAF50",    // Green (optional)
    danger: "#FF4D4D",     // Red (optional)
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    background: "#000000", // Same as light (your app is dark-first)
    text: "#FFFFFF",
    primary: "#8A2BE2",
    secondary: "#AAAAAA",
    border: "#333333",
    success: "#4CAF50",
    danger: "#FF4D4D",
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};
