import { useEffect, useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const COLORS = {
  navy: '#14243A',
  blue: '#315B85',
  muted: '#718096',
  border: '#DCE5EF',
  background: '#F5F8FC',
  white: '#FFFFFF',
};

type Profile = {
  fullName: string;
  age: string;
  bloodGroup: string;
  allergies: string;
  medicalConditions: string;
  medications: string;
  assistanceNeeds: string;
  emergencyInstructions: string;
};

const EMPTY_PROFILE: Profile = {
  fullName: '',
  age: '',
  bloodGroup: '',
  allergies: '',
  medicalConditions: '',
  medications: '',
  assistanceNeeds: '',
  emergencyInstructions: '',
};

export default function SafetyProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error('Please log in first.');

        const snapshot = await getDoc(doc(db, 'safetyProfiles', user.uid));

        if (active && snapshot.exists()) {
          const data = snapshot.data();
          setProfile({
            fullName: data.fullName || '',
            age: data.age || '',
            bloodGroup: data.bloodGroup || '',
            allergies: data.allergies || '',
            medicalConditions: data.medicalConditions || '',
            medications: data.medications || '',
            assistanceNeeds: data.assistanceNeeds || '',
            emergencyInstructions: data.emergencyInstructions || '',
          });
        }
      } catch (error) {
        console.error('Safety profile load failed:', error);
        if (active) Alert.alert('Unable to load profile', 'Please check your connection and try again.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProfile();
    return () => { active = false; };
  }, []);

  function updateField(field: keyof Profile, value: string) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  async function saveProfile() {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Login required', 'Please log in to save your safety profile.');
      return;
    }

    if (profile.age.trim() && (!/^\d{1,3}$/.test(profile.age.trim()) ||
      Number(profile.age) < 1 || Number(profile.age) > 120)) {
      Alert.alert('Check age', 'Please enter a valid age between 1 and 120.');
      return;
    }

    setSaving(true);
    try {
      await setDoc(doc(db, 'safetyProfiles', user.uid), {
        userId: user.uid,
        ...profile,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      Alert.alert('Profile saved', 'Your Safety Profile has been updated.');
    } catch (error) {
      console.error('Safety profile save failed:', error);
      Alert.alert('Could not save profile', 'Please check your Firestore security rules and try again.');
    } finally {
      setSaving(false);
    }
  }

  function Field({
    label,
    field,
    placeholder,
    multiline = false,
    keyboardType = 'default',
  }: {
    label: string;
    field: keyof Profile;
    placeholder: string;
    multiline?: boolean;
    keyboardType?: 'default' | 'numeric';
  }) {
    return (
      <View style={styles.field}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          value={profile[field]}
          onChangeText={(value) => updateField(field, value)}
          placeholder={placeholder}
          placeholderTextColor="#9AA8B8"
          style={[styles.input, multiline && styles.multiline]}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          keyboardType={keyboardType}
          maxLength={multiline ? 500 : 100}
        />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.blue} />
        <Text style={styles.loadingText}>Loading your safety profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>‹  Back</Text>
        </Pressable>

        <Text style={styles.eyebrow}>YOUR PERSONAL SAFETY</Text>
        <Text style={styles.title}>Safety Profile</Text>
        <Text style={styles.subtitle}>
          Keep important information ready in case you ever need assistance.
        </Text>

        <View style={styles.privacyCard}>
          <Text style={styles.privacyTitle}>🔒 Your information stays private</Text>
          <Text style={styles.privacyText}>
            Only your signed-in account can currently view and edit this profile.
            Sharing with an assigned responder is not enabled yet.
          </Text>
        </View>

        <Text style={styles.section}>Personal details</Text>
        <Field label="Full name" field="fullName" placeholder="Enter your name" />
        <Field label="Age (optional)" field="age" placeholder="Enter your age" keyboardType="numeric" />
        <Field label="Blood group (optional)" field="bloodGroup" placeholder="e.g. O+, A-, B+" />

        <Text style={styles.section}>Medical information</Text>
        <Field label="Allergies" field="allergies" placeholder="List any known allergies, or leave blank" multiline />
        <Field label="Medical conditions" field="medicalConditions" placeholder="Any important medical conditions" multiline />
        <Field label="Current medications" field="medications" placeholder="Medicines responders should know about" multiline />

        <Text style={styles.section}>Assistance preferences</Text>
        <Field label="Accessibility or assistance needs" field="assistanceNeeds" placeholder="Mobility, hearing, communication or other needs" multiline />
        <Field label="Emergency instructions" field="emergencyInstructions" placeholder="Anything important someone helping you should know" multiline />

        <Pressable
          accessibilityRole="button"
          disabled={saving}
          onPress={saveProfile}
          style={({ pressed }) => [styles.saveButton, pressed && !saving && styles.pressed, saving && styles.disabled]}
        >
          {saving
            ? <ActivityIndicator color={COLORS.white} />
            : <Text style={styles.saveText}>Save Safety Profile</Text>}
        </Pressable>

        <Text style={styles.footer}>
          You can update this information whenever you need.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 22, paddingBottom: 48 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  loadingText: { marginTop: 12, color: COLORS.muted },
  back: { alignSelf: 'flex-start', paddingVertical: 10, paddingRight: 18 },
  backText: { color: COLORS.blue, fontSize: 16, fontWeight: '700' },
  eyebrow: { color: COLORS.blue, fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginTop: 18 },
  title: { color: COLORS.navy, fontSize: 30, fontWeight: '800', marginTop: 7 },
  subtitle: { color: COLORS.muted, fontSize: 14, lineHeight: 21, marginTop: 8, marginBottom: 20 },
  privacyCard: { backgroundColor: '#EAF2FB', borderRadius: 15, padding: 16, marginBottom: 24 },
  privacyTitle: { color: COLORS.navy, fontWeight: '800', fontSize: 14 },
  privacyText: { color: '#52677F', fontSize: 13, lineHeight: 19, marginTop: 7 },
  section: { color: COLORS.navy, fontSize: 18, fontWeight: '800', marginTop: 16, marginBottom: 12 },
  field: { marginBottom: 15 },
  label: { color: COLORS.navy, fontSize: 13, fontWeight: '700', marginBottom: 7 },
  input: { minHeight: 49, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 14, backgroundColor: COLORS.white, color: COLORS.navy, fontSize: 14 },
  multiline: { minHeight: 92, paddingTop: 13, paddingBottom: 13 },
  saveButton: { minHeight: 54, borderRadius: 14, backgroundColor: COLORS.navy, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  saveText: { color: COLORS.white, fontWeight: '800', fontSize: 15 },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.6 },
  footer: { textAlign: 'center', color: COLORS.muted, fontSize: 12, marginTop: 15 },
});
