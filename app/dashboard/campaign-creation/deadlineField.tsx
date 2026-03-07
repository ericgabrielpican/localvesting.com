import React from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

type Props = {
    deadlineDate: Date;
    setDeadlineDate: (date: Date) => void;
    showDatePicker: boolean;
    setShowDatePicker: (show: boolean) => void;
    styles: any;
};

export default function DeadlineField({
                                          deadlineDate,
                                          setDeadlineDate,
                                          showDatePicker,
                                          setShowDatePicker,
                                          styles,
                                      }: Props) {
    if (Platform.OS === "web") {
        return (
            <View>
                <Text style={styles.label}>Campaign Deadline *</Text>

                <input
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={deadlineDate.toISOString().split("T")[0]}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const value = e.target.value;
                        if (value) {
                            setDeadlineDate(new Date(`${value}T00:00:00`));
                        }
                    }}
                    style={{
                        width: "100%",
                        padding: 12,
                        borderRadius: 8,
                        border: "1px solid #d1d5db",
                        marginBottom: 16,
                        fontSize: 16,
                        boxSizing: "border-box",
                        backgroundColor: "white",
                    }}
                />
            </View>
        );
    }

    return (
        <View>
            <Text style={styles.label}>Campaign Deadline *</Text>

            <TouchableOpacity
                style={[styles.dropdown, { marginBottom: 16 }]}
                onPress={() => setShowDatePicker(true)}
            >
                <Text style={styles.dropdownText}>
                    {deadlineDate.toLocaleDateString()}
                </Text>
            </TouchableOpacity>

            {showDatePicker && (
                <DateTimePicker
                    value={deadlineDate}
                    mode="date"
                    display="default"
                    minimumDate={new Date()}
                    onChange={(_, selectedDate) => {
                        setShowDatePicker(false);
                        if (selectedDate) {
                            setDeadlineDate(selectedDate);
                        }
                    }}
                />
            )}
        </View>
    );
}