/* eslint-disable react-native/no-color-literals, react-native/no-inline-styles */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { recyclingService } from '../../services/recycling.service';
import type { VerificationStatusRecord } from '../../types/recyclingCenter';
import { onboardingTheme } from '../../theme/onboardingTheme';

export default function VerificationStatusScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [record, setRecord] = useState<VerificationStatusRecord | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await recyclingService.getVerificationStatus();
      setRecord(data);
    } catch (err) {
      console.error('Failed to load verification status:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStatus();
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'APPROVED':
        return {
          bg: '#ECFDF5',
          text: '#065F46',
          label: 'VERIFIED & ACTIVE',
          icon: 'checkmark-circle' as const,
          color: '#10B981',
        };
      case 'REJECTED':
        return {
          bg: '#FEF2F2',
          text: '#991B1B',
          label: 'VERIFICATION REJECTED',
          icon: 'close-circle' as const,
          color: '#EF4444',
        };
      case 'PENDING':
      default:
        return {
          bg: '#FFFBEB',
          text: '#92400E',
          label: 'UNDER REVIEW',
          icon: 'time' as const,
          color: '#F59E0B',
        };
    }
  };

  const badge = getStatusBadge(record?.status);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verification Status</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Loading verification details...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Main Status Hero Card */}
          <View style={[styles.card, styles.heroCard]}>
            <View style={[styles.statusIconCircle, { backgroundColor: badge.bg }]}>
              <Ionicons name={badge.icon} size={36} color={badge.color} />
            </View>
            <View style={[styles.statusPill, { backgroundColor: badge.bg }]}>
              <Text style={[styles.statusPillText, { color: badge.text }]}>{badge.label}</Text>
            </View>
            <Text style={styles.heroTitle}>
              {record?.status === 'APPROVED'
                ? 'Your Facility is Fully Verified'
                : record?.status === 'REJECTED'
                  ? 'Application Needs Attention'
                  : 'Facility Review in Progress'}
            </Text>
            <Text style={styles.heroSub}>
              {record?.status === 'APPROVED'
                ? 'Your recycling facility credentials and licenses have been verified by municipal administrators.'
                : record?.status === 'REJECTED'
                  ? 'Your submission could not be approved. Please review the administrator notes below.'
                  : 'Our administrative team is reviewing your license and operating credentials.'}
            </Text>
          </View>

          {/* Rejection Note Alert */}
          {record?.status === 'REJECTED' && record.review_note && (
            <View style={styles.alertCard}>
              <View style={styles.alertHeader}>
                <Ionicons name="alert-circle" size={20} color="#DC2626" />
                <Text style={styles.alertTitle}>Reviewer Remarks</Text>
              </View>
              <Text style={styles.alertBody}>{record.review_note}</Text>
              {record.reviewed_at && (
                <Text style={styles.alertMeta}>
                  Reviewed on {new Date(record.reviewed_at).toLocaleDateString()}
                  {record.reviewer_name ? ` by ${record.reviewer_name}` : ''}
                </Text>
              )}
            </View>
          )}

          {/* Facility Details Breakdown */}
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Submission Details</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Organization Name</Text>
              <Text style={styles.detailValue}>{record?.organization_name || 'Not provided'}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Registration / License No.</Text>
              <Text style={styles.detailValue}>{record?.registration_no || 'Not provided'}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Submission Date</Text>
              <Text style={styles.detailValue}>
                {record?.created_at ? new Date(record.created_at).toLocaleDateString() : 'N/A'}
              </Text>
            </View>

            {record?.reviewed_at && (
              <>
                <View style={styles.divider} />
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Reviewed At</Text>
                  <Text style={styles.detailValue}>
                    {new Date(record.reviewed_at).toLocaleDateString()}
                  </Text>
                </View>
              </>
            )}

            {record?.reviewer_name && (
              <>
                <View style={styles.divider} />
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Verified By</Text>
                  <Text style={styles.detailValue}>{record.reviewer_name}</Text>
                </View>
              </>
            )}
          </View>

          {/* Compliance & Standards Info */}
          <View style={[styles.card, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="shield-checkmark" size={20} color="#059669" />
              <Text
                style={[
                  styles.cardSectionTitle,
                  { color: '#065F46', marginBottom: 0, marginLeft: 8 },
                ]}
              >
                Compliance Standards
              </Text>
            </View>
            <Text style={styles.complianceText}>
              • CEA (Central Environmental Authority) waste handling certification{'\n'}• Local
              municipal council operating clearance{'\n'}• Calibrated industrial weighbridge
              standard compliance
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  scrollArea: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...onboardingTheme.cardShadow,
  },
  heroCard: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  statusIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 12,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  heroSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 12,
  },
  alertCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 14,
    padding: 16,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991B1B',
  },
  alertBody: {
    fontSize: 13,
    color: '#7F1D1D',
    lineHeight: 18,
  },
  alertMeta: {
    marginTop: 8,
    fontSize: 11,
    color: '#B91C1C',
  },
  cardSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  complianceText: {
    fontSize: 13,
    color: '#166534',
    lineHeight: 20,
  },
});
