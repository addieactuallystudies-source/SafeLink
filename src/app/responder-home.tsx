import * as Location from 'expo-location';

import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  IncidentRecord,
  subscribeToMyAssignedIncidents,
  subscribeToPendingIncidents,
} from '../services/incidents';

import {
  acceptIncident,
  resolveIncident,
} from '../services/responderRequests';
import { updateResponderLocation } from '../services/incidentTracking';

type IncidentLocation = {
  latitude?: number;
  longitude?: number;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

export default function ResponderHome() {
  const [pendingIncidents, setPendingIncidents] = useState<IncidentRecord[]>([]);
  const [assignedIncidents, setAssignedIncidents] = useState<IncidentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const responderWatchers = useRef(
    new Map<string, Location.LocationSubscription>()
  );

  const assignedIncidentIds = assignedIncidents
    .map((incident) => incident.id)
    .sort()
    .join(',');

  useEffect(() => {
    let active = true;

    const startResponderWatcher = async (incidentId: string) => {
      if (responderWatchers.current.has(incidentId)) return;

      try {
        const permission =
          await Location.requestForegroundPermissionsAsync();

        if (permission.status !== 'granted') {
          console.warn('Responder location permission was not granted.');
          return;
        }

        const watcher = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000,
            distanceInterval: 5,
          },
          (position) => {
            void updateResponderLocation(incidentId, {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }).catch((updateError) =>
              console.error('Responder GPS update failed:', updateError)
            );
          }
        );

        if (!active) {
          watcher.remove();
        } else {
          responderWatchers.current.set(incidentId, watcher);
        }
      } catch (watchError) {
        console.error('Unable to start responder GPS watcher:', watchError);
      }
    };

    const currentIds = new Set(
      assignedIncidentIds ? assignedIncidentIds.split(',') : []
    );

    for (const [id, watcher] of responderWatchers.current) {
      if (!currentIds.has(id)) {
        watcher.remove();
        responderWatchers.current.delete(id);
      }
    }

    currentIds.forEach((id) => void startResponderWatcher(id));

    return () => {
      active = false;
      responderWatchers.current.forEach((watcher) => watcher.remove());
      responderWatchers.current.clear();
    };
  }, [assignedIncidentIds]);


  useEffect(() => {
    let pendingUnsubscribe: (() => void) | undefined;
    let assignedUnsubscribe: (() => void) | undefined;

    try {
      pendingUnsubscribe = subscribeToPendingIncidents(
        (items) => {
          setPendingIncidents(items);
          setLoading(false);
        },
        (subscriptionError) => {
          setError(subscriptionError.message);
          setLoading(false);
        }
      );

      assignedUnsubscribe = subscribeToMyAssignedIncidents(
        (items) => {
          setAssignedIncidents(items);
          setLoading(false);
        },
        (subscriptionError) => {
          setError(subscriptionError.message);
          setLoading(false);
        }
      );
    } catch (subscriptionError) {
      setError(getErrorMessage(subscriptionError));
      setLoading(false);
    }

    return () => {
      pendingUnsubscribe?.();
      assignedUnsubscribe?.();
    };
  }, []);

  const openGoogleMaps = async (incident: IncidentRecord) => {
    const location = incident.location as IncidentLocation | undefined;
    const latitude = location?.latitude;
    const longitude = location?.longitude;

    if (
      typeof latitude !== 'number' ||
      typeof longitude !== 'number' ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      Alert.alert('Location unavailable', 'This SOS does not contain valid GPS coordinates.');
      return;
    }

    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;

    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to open Maps', 'Please try opening Google Maps manually.');
    }
  };

  const handleAccept = async (incidentId: string) => {
    setBusyId(incidentId);

    try {
      await acceptIncident(incidentId);
      Alert.alert('SOS accepted', 'This emergency has been assigned to you.');
    } catch (acceptError) {
      Alert.alert('Unable to accept SOS', getErrorMessage(acceptError));
    } finally {
      setBusyId(null);
    }
  };

  const handleResolve = (incidentId: string) => {
    Alert.alert(
      'Resolve emergency?',
      'Only mark this SOS as resolved after assistance has been provided.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resolve',
          onPress: async () => {
            setBusyId(incidentId);

            try {
              await resolveIncident(incidentId);
              Alert.alert('Emergency resolved', 'The SOS has been marked as resolved.');
            } catch (resolveError) {
              Alert.alert('Unable to resolve SOS', getErrorMessage(resolveError));
            } finally {
              setBusyId(null);
            }
          },
        },
      ]
    );
  };

  const renderIncidentCard = (
    incident: IncidentRecord,
    isAssigned: boolean
  ) => {
    const isBusy = busyId === incident.id;

    return (
      <View key={incident.id} style={styles.card}>
        <Text style={styles.category}>
          {String(incident.category || 'Emergency')}
        </Text>

        <Text style={styles.description}>
          {String(incident.description || 'No description provided.')}
        </Text>

        <View style={styles.locationBox}>
          <Text style={styles.locationIcon}>📍</Text>
          <View style={styles.locationTextBox}>
            <Text style={styles.locationTitle}>Emergency location</Text>
            <Text style={styles.locationSubtitle}>Open the reported GPS location in Maps</Text>
          </View>
        </View>

        <Pressable
          style={styles.mapsButton}
          onPress={() => openGoogleMaps(incident)}
        >
          <Text style={styles.mapsButtonText}>Open in Google Maps</Text>
        </Pressable>

        <Text style={isAssigned ? styles.assignedStatus : styles.status}>
          Status: {isAssigned ? 'ASSIGNED TO YOU' : 'PENDING'}
        </Text>

        <Pressable
          style={[
            styles.actionButton,
            isAssigned && styles.resolveButton,
            busyId !== null && styles.disabledButton,
          ]}
          disabled={busyId !== null}
          onPress={() =>
            isAssigned
              ? handleResolve(incident.id)
              : handleAccept(incident.id)
          }
        >
          {isBusy ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.actionButtonText}>
              {isAssigned ? 'Resolve Emergency' : 'Accept Emergency'}
            </Text>
          )}
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>SafeLink.</Text>
      <Text style={styles.heading}>Responder Dashboard</Text>
      <Text style={styles.subtitle}>Manage live emergency requests</Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#315B85" />
          <Text style={styles.loadingText}>Loading emergency requests...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Text style={styles.sectionHeading}>
            My Active SOS ({assignedIncidents.length})
          </Text>

          {assignedIncidents.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.emptyTitle}>No active emergency assigned.</Text>
              <Text style={styles.hint}>
                SOS requests you accept will appear here.
              </Text>
            </View>
          ) : (
            assignedIncidents.map((incident) =>
              renderIncidentCard(incident, true)
            )
          )}

          <Text style={styles.sectionHeading}>
            Pending SOS ({pendingIncidents.length})
          </Text>

          {pendingIncidents.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.emptyTitle}>No pending emergency requests.</Text>
              <Text style={styles.hint}>
                New SOS requests will appear here automatically.
              </Text>
            </View>
          ) : (
            pendingIncidents.map((incident) =>
              renderIncidentCard(incident, false)
            )
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
    paddingHorizontal: 22,
    paddingTop: 65,
  },
  logo: {
    fontSize: 30,
    fontWeight: '900',
    color: '#315B85',
    marginBottom: 20,
  },
  heading: {
    fontSize: 25,
    fontWeight: '800',
    color: '#14243A',
  },
  subtitle: {
    color: '#78869A',
    marginTop: 8,
    marginBottom: 25,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#78869A',
    marginTop: 12,
  },
  sectionHeading: {
    fontSize: 19,
    fontWeight: '800',
    color: '#14243A',
    marginBottom: 14,
    marginTop: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 15,
    marginBottom: 18,
  },
  category: {
    fontSize: 20,
    fontWeight: '800',
    color: '#315B85',
  },
  description: {
    fontSize: 15,
    color: '#14243A',
    marginTop: 12,
  },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F7FB',
    padding: 13,
    borderRadius: 12,
    marginTop: 18,
  },
  locationIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  locationTextBox: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#14243A',
  },
  locationSubtitle: {
    fontSize: 12,
    color: '#78869A',
    marginTop: 4,
  },
  mapsButton: {
    backgroundColor: '#E8F1FC',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#C9DDF5',
  },
  mapsButtonText: {
    color: '#315B85',
    fontWeight: '800',
    fontSize: 14,
  },
  status: {
    color: '#D97706',
    fontWeight: '800',
    marginTop: 16,
  },
  assignedStatus: {
    color: '#15803D',
    fontWeight: '800',
    marginTop: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#14243A',
  },
  hint: {
    color: '#78869A',
    marginTop: 10,
  },
  errorText: {
    color: '#DC2626',
    marginBottom: 15,
  },
  actionButton: {
    backgroundColor: '#315B85',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  resolveButton: {
    backgroundColor: '#15803D',
  },
  disabledButton: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
