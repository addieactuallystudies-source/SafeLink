
import { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const COLORS = {
  navy: '#14243A',
  blue: '#315B85',
  background: '#F4F7FB',
  white: '#FFFFFF',
  muted: '#78869A',
  red: '#E34D59',
  border: '#E7ECF2',
  green: '#27866B',
};

const categories = [
  { icon: '!', title: 'High Risk', detail: 'Urgent safety help', color: '#FCEBED' },
  { icon: '+', title: 'Medical', detail: 'Medical assistance', color: '#E9F3FF' },
  { icon: '◇', title: 'Personal Safety', detail: 'Feel unsafe?', color: '#F0EDFF' },
  { icon: '♡', title: 'Other Help', detail: 'Request assistance', color: '#E9F6F0' },
];

// Works in the browser and on native devices.
function showMessage(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

export default function HomeScreen() {
  const [selected, setSelected] = useState('');

  const handleSOS = () => {
    showMessage(
      'SOS Demo',
      'Your demo SOS request has been triggered. No real emergency alert has been sent.'
    );
  };

  const handleCategory = (title: string) => {
    setSelected(title);
    showMessage(
      title,
      `You selected ${title}. This is a demo request. Backend integration will be added separately.`
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>
              Safe<Text style={styles.brandAccent}>Link.</Text>
            </Text>
            <Text style={styles.tagline}>YOUR SAFETY, CONNECTED.</Text>
          </View>
          <View style={styles.profile}>
            <Text style={styles.profileText}>SL</Text>
          </View>
        </View>

        <View style={styles.welcome}>
          <Text style={styles.eyebrow}>WELCOME BACK</Text>
          <Text style={styles.heading}>Your safety{'\n'}comes first.</Text>
          <Text style={styles.description}>
            Support is just a tap away. We're here when you need us.
          </Text>
        </View>

        <View style={styles.sosCard}>
          <View style={styles.sosTop}>
            <View>
              <Text style={styles.sosLabel}>EMERGENCY ASSISTANCE</Text>
              <Text style={styles.sosTitle}>Need help right now?</Text>
            </View>
            <Text style={styles.sosIcon}>!</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={handleSOS}
            style={({ pressed }) => [
              styles.sosButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.sosButtonText}>SOS</Text>
            <Text style={styles.sosButtonSub}>REQUEST EMERGENCY HELP</Text>
          </Pressable>

          <Text style={styles.sosFoot}>
            Use only when you need urgent assistance.
          </Text>
          <Text style={styles.demoNote}>
            DEMO PREVIEW · No real emergency dispatch
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>How can we help?</Text>
            <Text style={styles.sectionSub}>
              Choose the assistance you need
            </Text>
          </View>
        </View>

        <View style={styles.grid}>
          {categories.map((item) => (
            <Pressable
              key={item.title}
              accessibilityRole="button"
              onPress={() => handleCategory(item.title)}
              style={({ pressed }) => [
                styles.category,
                selected === item.title && styles.categorySelected,
                pressed && styles.pressed,
              ]}
            >
              <View
                style={[
                  styles.categoryIcon,
                  { backgroundColor: item.color },
                ]}
              >
                <Text style={styles.categoryIconText}>{item.icon}</Text>
              </View>

              <Text style={styles.categoryTitle}>{item.title}</Text>
              <Text style={styles.categoryDetail}>{item.detail}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your safety network</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() =>
            showMessage(
              'Trusted Contacts',
              'Trusted contacts management will be available after integration.'
            )
          }
          style={({ pressed }) => [
            styles.infoCard,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.infoIcon}>
            <Text style={styles.infoIconText}>♡</Text>
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Trusted contacts</Text>
            <Text style={styles.infoDescription}>
              Add people who can be notified when you need help.
            </Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() =>
            showMessage(
              'Location Services',
              'Location sharing will be available after integration.'
            )
          }
          style={({ pressed }) => [
            styles.infoCard,
            pressed && styles.pressed,
          ]}
        >
          <View style={[styles.infoIcon, { backgroundColor: '#E9F3FF' }]}>
            <Text style={[styles.infoIconText, { color: COLORS.blue }]}>⌖</Text>
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Location services</Text>
            <Text style={styles.infoDescription}>
              Location sharing will be available after integration.
            </Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.footerBrand}>SAFELINK</Text>
          <Text style={styles.footerText}>
            One tap. Trusted help. Faster response.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {
    fontSize: 27,
    fontWeight: '800',
    color: COLORS.navy,
    letterSpacing: -1,
  },
  brandAccent: {
    color: COLORS.blue,
  },
  tagline: {
    fontSize: 9,
    color: COLORS.muted,
    letterSpacing: 2,
    marginTop: 3,
    fontWeight: '700',
  },
  profile: {
    width: 43,
    height: 43,
    borderRadius: 15,
    backgroundColor: COLORS.navy,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  welcome: {
    paddingHorizontal: 24,
    paddingTop: 23,
    paddingBottom: 25,
  },
  eyebrow: {
    color: COLORS.blue,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 12,
  },
  heading: {
    fontSize: 37,
    lineHeight: 43,
    fontWeight: '800',
    color: COLORS.navy,
    letterSpacing: -1.2,
  },
  description: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
    maxWidth: 300,
  },
  sosCard: {
    backgroundColor: COLORS.navy,
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 20,
    marginBottom: 30,
  },
  sosTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sosLabel: {
    color: '#AFC2D8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.7,
  },
  sosTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 7,
  },
  sosIcon: {
    color: '#FFB6BC',
    fontSize: 24,
    fontWeight: '800',
    width: 38,
    height: 38,
    textAlign: 'center',
    textAlignVertical: 'center',
    backgroundColor: '#35465B',
    borderRadius: 13,
    overflow: 'hidden',
  },
  sosButton: {
    backgroundColor: COLORS.red,
    borderRadius: 17,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosButtonText: {
    color: COLORS.white,
    fontSize: 29,
    fontWeight: '900',
    letterSpacing: 2,
  },
  sosButtonSub: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 3,
  },
  sosFoot: {
    color: '#B9C8D8',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 13,
  },
  demoNote: {
    color: '#AFC2D8',
    fontSize: 9,
    textAlign: 'center',
    marginTop: 8,
  },
  sectionHeader: {
    paddingHorizontal: 23,
    marginBottom: 15,
  },
  sectionTitle: {
    color: COLORS.navy,
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  sectionSub: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 27,
  },
  category: {
    width: '46%',
    backgroundColor: COLORS.white,
    borderRadius: 19,
    padding: 16,
    margin: '2%',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categorySelected: {
    borderColor: COLORS.blue,
  },
  categoryIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },
  categoryIconText: {
    fontSize: 23,
    fontWeight: '800',
    color: COLORS.navy,
  },
  categoryTitle: {
    fontSize: 14,
    color: COLORS.navy,
    fontWeight: '800',
  },
  categoryDetail: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 5,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: '#FCEBED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIconText: {
    fontSize: 23,
    color: COLORS.red,
  },
  infoContent: {
    flex: 1,
    marginLeft: 13,
    marginRight: 8,
  },
  infoTitle: {
    color: COLORS.navy,
    fontSize: 13,
    fontWeight: '800',
  },
  infoDescription: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },
  arrow: {
    color: COLORS.muted,
    fontSize: 25,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  footerBrand: {
    color: COLORS.blue,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 3,
  },
  footerText: {
    color: COLORS.muted,
    fontSize: 10,
    marginTop: 6,
  },
  pressed: {
    opacity: 0.75,
  },
});
