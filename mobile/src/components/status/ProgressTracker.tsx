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
    paddingVertical: 12,
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
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  circleDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  circleCurrent: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderWidth: 3,
  },
  innerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textMuted,
  },
  innerDotCurrent: {
    backgroundColor: colors.primary,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  checkmark: {
    color: colors.textInverse,
    fontSize: 12,
    fontWeight: 'bold',
  },
  line: {
    width: 2,
    flex: 1,
    minHeight: 32,
    backgroundColor: colors.border,
    marginVertical: 3,
  },
  lineDone: {
    backgroundColor: colors.primary,
  },
  stepContent: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: 'flex-start',
    paddingTop: 1,
  },
  stepContentSpaced: {
    paddingBottom: 20,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMuted,
  },
  stepTitleCurrent: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  stepTitleDone: {
    color: colors.textSecondary,
    fontWeight: '600',
  },
  stepSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  cancelledContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorSurface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  cancelledIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cancelledText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelledTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.error,
  },
  cancelledSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

