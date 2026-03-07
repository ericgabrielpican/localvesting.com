import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";

import Card from "../../../src/components/ui/Card";
import TextField from "../../../src/components/ui/TextField";
import Button from "../../../src/components/ui/Button";
import { Theme } from "../../../src/styles/Theme";

const uid = () => Math.random().toString(36).slice(2, 10);

export type AttachmentItem = {
  id: string;
  name: string;
  url: string;
};

type Props = {
  additionalInfoText: string;
  setAdditionalInfoText: React.Dispatch<React.SetStateAction<string>>;
  attachments: AttachmentItem[];
  setAttachments: React.Dispatch<React.SetStateAction<AttachmentItem[]>>;
};

export default function AdditionalInformationSection({
  additionalInfoText,
  setAdditionalInfoText,
  attachments,
  setAttachments,
}: Props) {
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");

  const nameRef = useRef<TextInput>(null);
  const urlRef = useRef<TextInput>(null);

  const addAttachment = () => {
    const cleanName = attachmentName.trim();
    const cleanUrl = attachmentUrl.trim();

    if (!cleanName || !cleanUrl) return;

    setAttachments((prev) => [
      ...prev,
      {
        id: uid(),
        name: cleanName,
        url: cleanUrl,
      },
    ]);

    setAttachmentName("");
    setAttachmentUrl("");

    setTimeout(() => {
      nameRef.current?.focus();
    }, 0);
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <View style={styles.wrapper}>
      <Card>
        <Text style={styles.heading}>Additional Information</Text>
        <Text style={styles.subheading}>
          Add optional extra details and supporting links or files for investors.
        </Text>

        <TextField
          label="Additional Information"
          placeholder="Add extra details, notes, bullet points, useful links, or context here..."
          value={additionalInfoText}
          onChangeText={setAdditionalInfoText}
          multiline
          returnKeyType="default"
          blurOnSubmit={false}
          style={{ height: 180, textAlignVertical: "top" }}
        />

        <View style={styles.attachmentsSection}>
          <Text style={styles.sectionTitle}>Attachments</Text>

          <TextField
            ref={nameRef}
            label="Attachment Name"
            placeholder="e.g., Business Plan PDF"
            value={attachmentName}
            onChangeText={setAttachmentName}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => urlRef.current?.focus()}
          />

          <TextField
            ref={urlRef}
            label="Attachment URL"
            placeholder="https://..."
            value={attachmentUrl}
            onChangeText={setAttachmentUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="done"
            onSubmitEditing={addAttachment}
          />

          <Button
            label="Add Attachment"
            variant="secondary"
            onPress={addAttachment}
          />

          {attachments.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No attachments added yet.</Text>
            </View>
          ) : (
            <View style={styles.attachmentList}>
              {attachments.map((item, index) => (
                <View key={item.id} style={styles.attachmentCard}>
                  <View style={styles.attachmentTextWrap}>
                    <Text style={styles.attachmentTitle}>
                      {index + 1}. {item.name}
                    </Text>
                    <Text style={styles.attachmentUrl}>{item.url}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => removeAttachment(item.id)}
                  >
                    <Text style={styles.removeBtnText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: Theme.spacing.lg,
  },
  heading: {
    ...Theme.typography.title,
    color: "#000",
    marginBottom: Theme.spacing.xs,
  },
  subheading: {
    ...Theme.typography.subtitle,
    color: "#555",
    marginBottom: Theme.spacing.md,
  },
  attachmentsSection: {
    marginTop: Theme.spacing.lg,
    gap: Theme.spacing.sm,
  },
  sectionTitle: {
    ...Theme.typography.label,
    color: "#000",
  },
  emptyBox: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: Theme.colors.border,
    borderRadius: Theme.radii.md,
    padding: Theme.spacing.md,
    backgroundColor: Theme.colors.surface,
  },
  emptyText: {
    ...Theme.typography.body,
    color: "#666",
  },
  attachmentList: {
    gap: Theme.spacing.sm,
  },
  attachmentCard: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.radii.md,
    backgroundColor: "#fff",
    padding: Theme.spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: Theme.spacing.sm,
  },
  attachmentTextWrap: {
    flex: 1,
  },
  attachmentTitle: {
    ...Theme.typography.label,
    color: "#000",
    marginBottom: 4,
  },
  attachmentUrl: {
    ...Theme.typography.body,
    color: "#444",
  },
  removeBtn: {
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fff1f2",
    borderRadius: Theme.radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  removeBtnText: {
    ...Theme.typography.body,
    color: "#b91c1c",
  },
});