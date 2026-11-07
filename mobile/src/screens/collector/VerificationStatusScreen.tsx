import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/colors';

export default function VerificationStatusScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const isApproved = user?.status === 'ACTIVE';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Status Hero Card */}
      <View style={[styles.heroCard, isApproved ? styles.heroApproved : styles.heroPending]}>
        <View style={styles.heroIconCircle}>
          <Text style={{ fontSize: 32 }}>{isApproved ? '🛡️' : '⏳'}</Text>
        </View>
        <Text style={styles.heroStatus}>
          {isApproved ? 'Verified Partner Fleet' : 'Verification Under Review'}
        </Text>
        <Text style={styles.heroSub}>
          {isApproved
            ? 'Your commercial driver documents and vehicle inspections are verified.'
            : 'Our compliance team is auditing your driver credentials. Estimated review time is 24 hours.'}
        </Text>
      </View>

      {/* Required Credentials Checklist */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Required Fleet Documents</Text>

        <View style={styles.docItem}>
          <View style={styles.docIconCircle}>
            <Text style={{ fontSize: 18 }}>🪪</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.docName}>Commercial Driving License</Text>
            <Text style={styles.docMeta}>Heavy vehicle endorsement</Text>
          </View>
          <View style={styles.approvedBadge}>
            <Text style={styles.approvedText}>Approved ✓</Text>
          </View>
        </View>

        <View style={styles.docItem}>
          <View style={styles.docIconCircle}>
            <Text style={{ fontSize: 18 }}>📄</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.docName}>Vehicle Registration & Revenue</Text>
            <Text style={styles.docMeta}>WP-9214 • Ratnapura District</Text>
          </View>
          <View style={styles.approvedBadge}>
            <Text style={styles.approvedText}>Approved ✓</Text>
          </View>
        </View>

        <View style={styles.docItem}>
          <View style={styles.docIconCircle}>
            <Text style={{ fontSize: 18 }}>🛡️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.docName}>Third-Party Commercial Insurance</Text>
            <Text style={styles.docMeta}>Valid through Dec 2027</Text>
          </View>
          <View style={styles.approvedBadge}>
            <Text style={styles.approvedText}>Approved ✓</Text>
          </View>
        </View>
      </View>

      {/* Onboarding Timeline */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Verification Steps</Text>

        <View style={styles.stepRow}>
          <View style={[styles.stepDot, styles.stepDotDone]}>
            <Text style={styles.stepCheck}>✓</Text>
          </View>
          <View style={styles.stepTextContainer}>
            <Text style={styles.stepName}>1. Account Creation & Vehicle Registration</Text>
            <Text style={styles.stepDesc}>Profile and vehicle specs entered</Text>
          </View>
        </View>

        <View style={styles.stepLine} />

        <View style={styles.stepRow}>
          <View style={[styles.stepDot, styles.stepDotDone]}>
            <Text style={styles.stepCheck}>✓</Text>
          </View>
          <View style={styles.stepTextContainer}>
            <Text style={styles.stepName}>2. Government License & Insurance Review</Text>
            <Text style={styles.stepDesc}>Admin verification completed</Text>
          </View>
        </View>

        <View style={styles.stepLine} />

        <View style={styles.stepRow}>
          <View style={[styles.stepDot, isApproved ? styles.stepDotDone : styles.stepDotActive]}>
            <Text style={isApproved ? styles.stepCheck : styles.stepActiveDot}>
              {isApproved ? '✓' : '●'}
            </Text>
          </View>
          <View style={styles.stepTextContainer}>
            <Text style={styles.stepName}>3. Route Allocation & Active Dispatch</Text>
            <Text style={styles.stepDesc}>Ready to receive online requests</Text>
          </View>
        </View>
      </View>

      {/* Support Action */}
      <TouchableOpacity
        style={styles.helpBtn}
        onPress={() => Linking.openURL('mailto:support@econexus.com?subject=Collector%20Verification')}
      >
        <Text style={styles.helpBtnText}>Contact Compliance Support 💬</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 40,
  },
  heroCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
  },
  heroApproved: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  heroPending: {
    backgroundColor: '#FEF9C3',
    borderColor: '#FDE047',
  },
  heroIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  heroStatus: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  heroSub: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: '90%',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    gap: 12,
  },
  docIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  docMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  approvedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  approvedText: {
    color: '#15803D',
    fontSize: 11,
    fontWeight: '700',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotDone: {
    backgroundColor: '#059669',
  },
  stepDotActive: {
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#D97706',
  },
  stepCheck: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepActiveDot: {
    color: '#D97706',
    fontSize: 12,
  },
  stepTextContainer: {
    flex: 1,
  },
  stepName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  stepDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  stepLine: {
    width: 2,
    height: 20,
    backgroundColor: '#059669',
    marginLeft: 12,
    marginVertical: 2,
  },
  helpBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  helpBtnText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
});
