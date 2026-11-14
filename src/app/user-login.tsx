
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

import { loginUser } from '@/services/auth';

export default function UserLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing details', 'Please enter email and password.');
      return;
    }

    try {
      setLoading(true);
      await loginUser(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Login failed', error.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>SafeLink.</Text>
      <Text style={styles.heading}>Welcome back!</Text>
      <Text style={styles.subtitle}>Log in to your user account</Text>

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

      <Pressable style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </Pressable>

      <Pressable onPress={() => router.push('/register')}>
        <Text style={styles.link}>New here? Create an account</Text>
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
    marginBottom: 35,
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
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E7ECF2',
  },
  button: {
    backgroundColor: '#315B85',
    padding: 17,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  link: {
    textAlign: 'center',
    color: '#315B85',
    marginTop: 25,
    fontWeight: '700',
  },
  back: {
    textAlign: 'center',
    color: '#78869A',
    marginTop: 25,
  },
});
