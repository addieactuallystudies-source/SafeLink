
import { useRouter } from 'expo-router';
import {
    Pressable,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <Text style={styles.logo}>
        Safe<Text style={styles.blue}>Link.</Text>
      </Text>

      <Text style={styles.tagline}>
        ONE TAP. TRUSTED HELP. FASTER RESPONSE.
      </Text>

      <View style={styles.content}>
        <Text style={styles.heading}>
          Your safety,{'\n'}our priority.
        </Text>

        <Text style={styles.description}>
          Choose how you want to continue.
        </Text>

        <Pressable
          style={styles.userButton}
          onPress={() => router.push('/user-login')}
        >
          <Text style={styles.buttonText}>Continue as User</Text>
        </Pressable>

        <Pressable
          style={styles.responderButton}
          onPress={() => router.push('/responder-login')}
        >
          <Text style={styles.responderText}>Continue as Responder</Text>
        </Pressable>
      </View>

      <Text style={styles.footer}>SAFE. CONNECTED. SUPPORTED.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
    justifyContent: 'center',
    padding: 28,
  },
  logo: {
    fontSize: 38,
    fontWeight: '900',
    color: '#14243A',
    textAlign: 'center',
  },
  blue: {
    color: '#315B85',
  },
  tagline: {
    fontSize: 9,
    letterSpacing: 2,
    color: '#78869A',
    textAlign: 'center',
    marginTop: 8,
  },
  content: {
    marginTop: 85,
  },
  heading: {
    fontSize: 36,
    fontWeight: '800',
    color: '#14243A',
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#78869A',
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 35,
  },
  userButton: {
    backgroundColor: '#315B85',
    padding: 19,
    borderRadius: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  responderButton: {
    borderWidth: 1.5,
    borderColor: '#315B85',
    padding: 19,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 15,
  },
  responderText: {
    color: '#315B85',
    fontWeight: '800',
    fontSize: 15,
  },
  footer: {
    position: 'absolute',
    bottom: 35,
    alignSelf: 'center',
    fontSize: 9,
    letterSpacing: 2,
    color: '#78869A',
  },
});
