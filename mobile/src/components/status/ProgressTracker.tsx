import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

export interface ProgressStep {
  key: string;
  label: string;
  sublabel?: string;
  timestamp?: string;
}

interface ProgressTrackerProps {
  currentStatus: string;
}

const STEPS: ProgressStep[] = [
  { key: 'PENDING', label: 'Requested', sublabel: 'Awaiting collector match' },
  { key: 'ACCEPTED', label: 'Accepted', sublabel: 'Collector assigned' },
  { key: 'IN_TRANSIT', label: 'En Route', sublabel: 'Collector moving to location' },
  { key: 'COMPLETED', label: 'Completed', sublabel: 'Waste collected' },
];

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({ currentStatus }) => {
  const normalized = currentStatus.toUpperCase().replace(/\s+/g, '_');
  const isCancelled = normalized === 'CANCELLED';

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 0;
      case 'ACCEPTED':
        return 1;
      case 'IN_TRANSIT':
      case 'EN_ROUTE':
      case 'WEIGHING':
        return 2;
      case 'COMPLETED':
        return 3;
      default:
        return 0;
    }
  };

  const currentIndex = isCancelled ? -1 : getStepIndex(normalized);

  if (isCancelled) {
    return (
      <View style={styles.cancelledContainer}>
        <View style={styles.cancelledIcon}>
          <Text style={styles.cancelledText}>✕</Text>
        </View>
        <View>
          <Text style={styles.cancelledTitle}>Pickup Cancelled</Text>
          <Text style={styles.cancelledSub}>This collection order has been cancelled.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {STEPS.map((step, index) => {
        const isDone = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isLast = index === STEPS.length - 1;

        return (
          <View key={step.key} style={styles.stepRow}>
            {/* Left timeline indicator */}
            <View style={styles.indicatorContainer}>
              <View
                style={[
                  styles.circle,
                  isDone && styles.circleDone,
                  isCurrent && styles.circleCurrent,
                ]}
              >
                {isDone ? (
                  <Text style={styles.checkmark}>✓</Text>
                ) : (
                  <View
                    style={[
                      styles.innerDot,
                      isCurrent && styles.innerDotCurrent,
                    ]}
                  />
                )}
              </View>

              {!isLast && (
                <View
                  style={[
                    styles.line,
                    isDone && styles.lineDone,
                  ]}
                />
              )}
            </View>

            {/* Step text content */}
            <View style={[styles.stepContent, !isLast && styles.stepContentSpaced]}>
              <Text
                style={[
                  styles.stepTitle,
                  isCurrent && styles.stepTitleCurrent,
                  isDone && styles.stepTitleDone,
                ]}
              >
                {step.label}
              </Text>
              {step.sublabel && (
                <Text style={styles.stepSubtitle}>{step.sublabel}</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  stepRow: {
    flexDirection: 'row',
  },
  indicatorContainer: {
    alignItems: 'center',
    width: 28,
  },
  circle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  circleDone: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  circleCurrent: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
    borderWidth: 2.5,
  },
  innerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  innerDotCurrent: {
    backgroundColor: '#059669',
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  line: {
    width: 2,
    flex: 1,
    minHeight: 28,
    backgroundColor: '#E2E8F0',
    marginVertical: 3,
  },
  lineDone: {
    backgroundColor: '#059669',
  },
  stepContent: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: 'flex-start',
    paddingTop: 1,
  },
  stepContentSpaced: {
    paddingBottom: 18,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94A3B8',
  },
  stepTitleCurrent: {
    color: '#0F172A',
    fontWeight: '700',
  },
  stepTitleDone: {
    color: '#059669',
    fontWeight: '600',
  },
  stepSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  cancelledContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  cancelledIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cancelledText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelledTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991B1B',
  },
  cancelledSub: {
    fontSize: 12,
    color: '#B91C1C',
    marginTop: 2,
  },
});

