import { Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "../../theme";

export function OptionGroup({
  onChange,
  options,
  selectedValue
}: {
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  selectedValue: string;
}) {
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const selected = option.value === selectedValue;

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.option,
              selected && styles.optionSelected,
              pressed && styles.optionPressed
            ]}
          >
            <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm
  },
  option: {
    backgroundColor: "rgba(20, 34, 48, 0.88)",
    borderColor: "rgba(133, 169, 195, 0.52)",
    borderRadius: 999,
    borderWidth: 2,
    minWidth: 0,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm
  },
  optionSelected: {
    backgroundColor: "#6fa8d8",
    borderColor: "#d7ecfb",
    shadowColor: "#6fa8d8",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 5
  },
  optionPressed: {
    opacity: 0.85
  },
  optionLabel: {
    color: theme.colors.text,
    flexShrink: 1,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
    textAlign: "center"
  },
  optionLabelSelected: {
    color: "#f8fbff"
  }
});
