
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
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
import { createIncident, subscribeToMyIncidents } from '../../services/incidents';
import { createIncidentTracking, updateUserLocation } from '../../services/incidentTracking';
import * as SMS from 'expo-sms';
import { getTrustedContacts } from '../../services/trustedContacts';

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

function showMessage(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

export default function HomeScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const userWatchers = useRef(
    new Map<string, Location.LocationSubscription>()
  );

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};

    const startWatcher = async (incidentId: string) => {
      if (userWatchers.current.has(incidentId)) return;

      try {
        const watcher = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000,
            distanceInterval: 5,
          },
          (position) => {
            void updateUserLocation(incidentId, {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }).catch((error) =>
              console.error('User live GPS update failed:', error)
            );
          }
        );

        if (!active) {
          watcher.remove();
        } else {
          userWatchers.current.set(incidentId, watcher);
        }
      } catch (error) {
        console.error('Unable to start user GPS watcher:', error);
      }
    };

    try {
      unsubscribe = subscribeToMyIncidents((incidents) => {
        const activeIds = new Set(
          incidents
            .filter((incident) =>
              ['pending', 'assigned'].includes(String(incident.status))
            )
            .map((incident) => incident.id)
        );

        for (const [id, watcher] of userWatchers.current) {
          if (!activeIds.has(id)) {
            watcher.remove();
            userWatchers.current.delete(id);
          }
        }

        activeIds.forEach((id) => void startWatcher(id));
      }, (error) => {
        console.error('User incident subscription failed:', error);
      });
    } catch (error) {
      console.error('Unable to subscribe to user incidents:', error);
    }

    return () => {
      active = false;
      unsubscribe();
      userWatchers.current.forEach((watcher) => watcher.remove());
      userWatchers.current.clear();
    };
  }, []);


  const submitIncident = async (category: string) => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setSelected(category);

      // Ask the user for location permission.
      const permission =
        await Location.requestForegroundPermissionsAsync();

      if (permission.status !== 'granted') {
        showMessage(
          'Location permission required',
          'Please allow location access so SafeLink can share your location with responders.'
        );
        return;
      }

      // Get the user's current GPS coordinates.
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      // Create the incident in Firebase Firestore.
      const incidentId = await createIncident({
        category,
        description:
          category === 'High Risk'
            ? 'Emergency SOS request submitted by the user.'
            : `${category} assistance requested by the user.`,
        latitude,
        longitude,
      });

      let trackingCreated = false;

      try {
        await createIncidentTracking(incidentId, {
          latitude,
          longitude,
        });
        trackingCreated = true;
      } catch (trackingError) {
        console.error('Tracking initialization error:', trackingError);
      }

      let smsStatus = '';

      try {
        const contacts = await getTrustedContacts();

        if (contacts.length === 0) {
          smsStatus = 'No trusted contacts are saved yet.';
        } else if (Platform.OS === 'web') {
          smsStatus = 'SMS requires the SafeLink mobile app.';
        } else if (!(await SMS.isAvailableAsync())) {
          smsStatus = 'SMS is not available on this device.';
        } else {
          const phoneNumbers = contacts
            .map((contact: any) => String(contact.phone).trim())
            .filter(Boolean);

          if (phoneNumbers.length === 0) {
            smsStatus = 'No valid trusted contact phone numbers found.';
          } else {
            const smsMessage =
              `SAFELINK EMERGENCY ALERT\n` +
              `I need help.\n` +
              `Emergency type: ${category}\n` +
              `My location: https://maps.google.com/?q=${latitude},${longitude}\n` +
              `Incident ID: ${incidentId}`;

            const result = await SMS.sendSMSAsync(phoneNumbers, smsMessage);
            smsStatus = result.result === 'cancelled'
              ? 'SMS composer closed without sending.'
              : 'SMS composer opened. Review the message and tap Send.';
          }
        }
      } catch (smsError) {
        console.error('SMS integration error:', smsError);
        smsStatus = 'Could not open SMS. Your SOS is still saved.';
      }

      showMessage(
        trackingCreated ? 'Request submitted!' : 'SOS submitted with a tracking warning',
        trackingCreated
          ? `Your ${category} request has been saved successfully.\n\nIncident ID: ${incidentId}\n\nYour GPS location is attached and tracking has been initialized.`
          : `Your SOS was saved successfully.\n\nIncident ID: ${incidentId}\n\nLive tracking could not be initialized. Please check the tracking security rules.`
      );
      showMessage('Trusted contact SMS', smsStatus || 'SMS step completed.');
    } catch (error: any) {
      console.error('Incident submission error:', error);

      showMessage(
        'Unable to submit request',
        error?.message ||
          'Something went wrong. Please check your internet connection and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmRequest = (category: string) => {
    const message =
      `Do you want to submit a ${category} assistance request? Your current location will be shared with the SafeLink system.`;

    if (Platform.OS === 'web') {
      if (window.confirm(message)) {
        void submitIncident(category);
      }
      return;
    }

    Alert.alert(
      `Request ${category}?`,
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            void submitIncident(category);
          },
        },
      ]
    );
  };

  const handleSOS = () => {
    confirmRequest('High Risk');
  };

  const handleCategory = (title: string) => {
    confirmRequest(title);
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>
              Safe<Text style={styles.brandAccent}>Link.</Text>
            </Text>
            <Text style={styles.tagline}>
              YOUR SAFETY, CONNECTED.
            </Text>
          </View>

          <View style={styles.profile}>
            <Text style={styles.profileText}>SL</Text>
          </View>
        </View>

        <View style={styles.welcome}>
          <Text style={styles.eyebrow}>WELCOME BACK</Text>
          <Text style={styles.heading}>
            Your safety{'\n'}comes first.
          </Text>
          <Text style={styles.description}>
            Support is just a tap away. We're here when you need us.
          </Text>
        </View>

        <View style={styles.sosCard}>
          <View style={styles.sosTop}>
            <View>
              <Text style={styles.sosLabel}>
                EMERGENCY ASSISTANCE
              </Text>
              <Text style={styles.sosTitle}>
                Need help right now?
              </Text>
            </View>

            <Text style={styles.sosIcon}>!</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={handleSOS}
            style={({ pressed }) => [
              styles.sosButton,
              pressed && styles.pressed,
              isSubmitting && styles.disabled,
            ]}
          >
            <Text style={styles.sosButtonText}>
              {isSubmitting ? 'SENDING...' : 'SOS'}
            </Text>
            <Text style={styles.sosButtonSub}>
              {isSubmitting
                ? 'PLEASE WAIT'
                : 'REQUEST EMERGENCY HELP'}
            </Text>
          </Pressable>

          <Text style={styles.sosFoot}>
            Use only when you need urgent assistance.
          </Text>

          <Text style={styles.demoNote}>
            DEMO PROTOTYPE · Location-based incident reporting
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              How can we help?
            </Text>
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
              disabled={isSubmitting}
              onPress={() => handleCategory(item.title)}
              style={({ pressed }) => [
                styles.category,
                selected === item.title && styles.categorySelected,
                pressed && styles.pressed,
                isSubmitting && styles.disabled,
              ]}
            >
              <View
                style={[
                  styles.categoryIcon,
                  { backgroundColor: item.color },
                ]}
              >
                <Text style={styles.categoryIconText}>
                  {item.icon}
                </Text>
              </View>

              <Text style={styles.categoryTitle}>
                {item.title}
              </Text>
              <Text style={styles.categoryDetail}>
                {item.detail}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Your safety network
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/safety-profile' as any)}
          style={({ pressed }) => [
            styles.infoCard,
            pressed && styles.pressed,
          ]}
        >
          <View style={[styles.infoIcon, { backgroundColor: '#EAF2FB' }]}>
            <Text style={styles.infoIconText}>✚</Text>
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Safety Profile</Text>
            <Text style={styles.infoDescription}>
              Save important medical and emergency information.
            </Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/trusted-contacts')}
          style={({ pressed }) => [
            styles.infoCard,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.infoIcon}>
            <Text style={styles.infoIconText}>♡</Text>
          </View>

          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>
              Trusted contacts
            </Text>
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
              'Location permission is requested when you submit an emergency request.'
            )
          }
          style={({ pressed }) => [
            styles.infoCard,
            pressed && styles.pressed,
          ]}
        >
          <View
            style={[
              styles.infoIcon,
              { backgroundColor: '#E9F3FF' },
            ]}
          >
            <Text
              style={[
                styles.infoIconText,
                { color: COLORS.blue },
              ]}
            >
              ⌖
            </Text>
          </View>

          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>
              Location services
            </Text>
            <Text style={styles.infoDescription}>
              Your GPS location is attached when you submit an emergency request.
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
  disabled: {
    opacity: 0.6,
  },
});
