import React from "react";
import {
  TextInput,
  View,
  Text,
  TextInputProps,
} from "react-native";

type TextFieldProps = TextInputProps & {
  label?: string;
  className?: string;
};

const TextField: React.FC<TextFieldProps> = ({
  label,
  className,
  ...props
}) => {
  return (
    <View className="mb-4">
      {label && (
        <Text className="text-gray-700 mb-1 text-sm">
          {label}
        </Text>
      )}
      <TextInput
        {...props}
        className={`border border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-900 ${
          className ?? ""
        }`}
        placeholderTextColor={props.placeholderTextColor ?? "#9ca3af"}
      />
    </View>
  );
};

export default TextField;