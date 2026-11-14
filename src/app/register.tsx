import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { registerUser } from '@/services/auth';

export default function RegisterScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert('Missing details', 'Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Both passwords must match.');
      return;
    }

    try {
      setLoading(true);
      await registerUser(name, email, password);
      Alert.alert('Success!', 'Your account has been created.');
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Registration failed', error.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>SafeLink.</Text>
      <Text style={styles.heading}>Create Account</Text>
      <Text style={styles.subtitle}>Join SafeLink and stay connected.</Text>

      <TextInput
        style={styles.input}
        placeholder="Full name"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="Email address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TextInput
        style={styles.input}
        placeholder="Confirm password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <Pressable
        style={styles.button}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Create Account</Text>
        )}
      </Pressable>

      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>← Go back</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
    justifyContent: 'center',
    padding: 25,
  },
  logo: {
    fontSize: 32,
    fontWeight: '900',
    color: '#315B85',
    textAlign: 'center',
    marginBottom: 25,
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: '#14243A',
    textAlign: 'center',
  },
  subtitle: {
    color: '#78869A',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 25,
  },
  input: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: '#E7ECF2',
  },
  button: {
    backgroundColor: '#315B85',
    padding: 17,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  back: {
    textAlign: 'center',
    color: '#78869A',
    marginTop: 25,
  },
});