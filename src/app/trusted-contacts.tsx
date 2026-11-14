import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  addTrustedContact,
  deleteTrustedContact,
  getTrustedContacts,
  updateTrustedContact,
  TrustedContactInput,
} from "../services/trustedContacts";

type TrustedContact = TrustedContactInput & {
  id: string;
};

export default function TrustedContactsScreen() {
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadContacts = useCallback(async () => {
    try {
      const result = await getTrustedContacts();
      setContacts(result as TrustedContact[]);
    } catch (error) {
      Alert.alert(
        "Unable to load contacts",
        error instanceof Error ? error.message : "Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  function resetForm() {
    setName("");
    setPhone("");
    setRelationship("");
    setEditingId(null);
  }

  async function handleSave() {
    const input: TrustedContactInput = {
      name: name.trim(),
      phone: phone.trim(),
      relationship: relationship.trim(),
    };

    if (!input.name || !input.phone || !input.relationship) {
      Alert.alert("Missing details", "Please fill in all three fields.");
      return;
    }

    setSaving(true);

    try {
      if (editingId) {
        await updateTrustedContact(editingId, input);
        Alert.alert("Updated!", "Your trusted contact has been updated.");
      } else {
        await addTrustedContact(input);
        Alert.alert("Contact added!", "Your trusted contact has been saved.");
      }

      resetForm();
      await loadContacts();
    } catch (error) {
      Alert.alert(
        "Could not save contact",
        error instanceof Error ? error.message : "Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  function startEditing(contact: TrustedContact) {
    setName(contact.name);
    setPhone(contact.phone);
    setRelationship(contact.relationship);
    setEditingId(contact.id);
  }

  function confirmDelete(contact: TrustedContact) {
    Alert.alert(
      "Delete contact?",
      `Remove ${contact.name} from your trusted contacts?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTrustedContact(contact.id);
              setContacts((current) =>
                current.filter((item) => item.id !== contact.id)
              );
              if (editingId === contact.id) resetForm();
            } catch (error) {
              Alert.alert(
                "Delete failed",
                error instanceof Error ? error.message : "Please try again."
              );
            }
          },
        },
      ]
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>SAFELINK / YOUR SAFETY CIRCLE</Text>
        <Text style={styles.heading}>Trusted Contacts</Text>
        <Text style={styles.subtitle}>
          Add people you trust so their details are ready when you need help.
        </Text>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>
            {editingId ? "Edit contact" : "Add a contact"}
          </Text>

          <Text style={styles.label}>FULL NAME</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Ananya Sharma"
            placeholderTextColor="#94A3B8"
            autoCapitalize="words"
          />

          <Text style={styles.label}>PHONE NUMBER</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="e.g. +91 9876543210"
            placeholderTextColor="#94A3B8"
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>RELATIONSHIP</Text>
          <TextInput
            style={styles.input}
            value={relationship}
            onChangeText={setRelationship}
            placeholder="e.g. Parent, Friend, Sibling"
            placeholderTextColor="#94A3B8"
            autoCapitalize="words"
          />

          <Pressable
            style={({ pressed }) => [
              styles.saveButton,
              pressed && styles.pressed,
              saving && styles.disabled,
            ]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>
                {editingId ? "Save changes" : "Add trusted contact"}
              </Text>
            )}
          </Pressable>

          {editingId && (
            <Pressable onPress={resetForm} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel editing</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Your contacts</Text>
          <Pressable onPress={loadContacts}>
            <Text style={styles.refreshText}>Refresh</Text>
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#315B85" />
        ) : contacts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>♡</Text>
            <Text style={styles.emptyTitle}>No contacts yet</Text>
            <Text style={styles.emptyText}>
              Add someone you trust using the form above.
            </Text>
          </View>
        ) : (
          contacts.map((contact) => (
            <View key={contact.id} style={styles.contactCard}>
              <View style={styles.contactAvatar}>
                <Text style={styles.avatarText}>
                  {contact.name.charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactRelationship}>
                  {contact.relationship}
                </Text>
                <Text style={styles.contactPhone}>{contact.phone}</Text>
              </View>

              <View style={styles.actions}>
                <Pressable
                  onPress={() => startEditing(contact)}
                  style={styles.actionButton}
                >
                  <Text style={styles.editText}>Edit</Text>
                </Pressable>
                <Pressable
                  onPress={() => confirmDelete(contact)}
                  style={styles.actionButton}
                >
                  <Text style={styles.deleteText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}

        <Text style={styles.footer}>
          Your contacts are saved securely in your SafeLink account.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F5F8FC",
  },
  container: {
    padding: 22,
    paddingTop: 32,
    paddingBottom: 50,
  },
  eyebrow: {
    color: "#52769B",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  heading: {
    color: "#183653",
    fontSize: 30,
    fontWeight: "900",
    marginTop: 10,
  },
  subtitle: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 24,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2EAF2",
  },
  formTitle: {
    color: "#183653",
    fontSize: 19,
    fontWeight: "800",
    marginBottom: 18,
  },
  label: {
    color: "#52708D",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 7,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#F7FAFD",
    borderWidth: 1,
    borderColor: "#DCE6F0",
    borderRadius: 11,
    paddingHorizontal: 13,
    paddingVertical: 13,
    color: "#183653",
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: "#315B85",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    marginTop: 22,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  cancelButton: {
    alignItems: "center",
    padding: 12,
    marginTop: 5,
  },
  cancelText: {
    color: "#64748B",
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.6,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 30,
    marginBottom: 14,
  },
  listTitle: {
    color: "#183653",
    fontSize: 20,
    fontWeight: "900",
  },
  refreshText: {
    color: "#315B85",
    fontWeight: "800",
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 25,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2EAF2",
  },
  emptyIcon: {
    color: "#52769B",
    fontSize: 34,
  },
  emptyTitle: {
    color: "#183653",
    fontWeight: "800",
    fontSize: 17,
    marginTop: 8,
  },
  emptyText: {
    color: "#64748B",
    textAlign: "center",
    marginTop: 6,
  },
  contactCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2EAF2",
    flexDirection: "row",
    alignItems: "center",
  },
  contactAvatar: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: "#E5EEF7",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#315B85",
    fontWeight: "900",
    fontSize: 18,
  },
  contactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  contactName: {
    color: "#183653",
    fontWeight: "800",
    fontSize: 15,
  },
  contactRelationship: {
    color: "#52708D",
    fontSize: 12,
    marginTop: 2,
  },
  contactPhone: {
    color: "#64748B",
    fontSize: 13,
    marginTop: 3,
  },
  actions: {
    alignItems: "flex-end",
    gap: 9,
    marginLeft: 6,
  },
  actionButton: {
    paddingVertical: 3,
    paddingHorizontal: 5,
  },
  editText: {
    color: "#315B85",
    fontSize: 12,
    fontWeight: "800",
  },
  deleteText: {
    color: "#DC5555",
    fontSize: 12,
    fontWeight: "800",
  },
  footer: {
    color: "#8293A5",
    textAlign: "center",
    fontSize: 12,
    marginTop: 25,
  },
});
