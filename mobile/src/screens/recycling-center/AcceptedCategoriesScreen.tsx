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
  Alert,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { recyclingService } from '../../services/recycling.service';
import { getCategories as getWasteCategories } from '../../services/waste.service';
import type { AcceptedCategory } from '../../types/recyclingCenter';
import type { WasteCategory } from '../../types/waste';
import { onboardingTheme } from '../../theme/onboardingTheme';

const CATEGORY_EMOJIS: Record<string, string> = {
  Plastic: '🧴',
  Paper: '📄',
  Cardboard: '📦',
  Metal: '🥫',
  Glass: '🍾',
  'E-Waste': '💻',
  Textiles: '👕',
  Organic: '🍂',
};

export default function AcceptedCategoriesScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acceptedCategories, setAcceptedCategories] = useState<AcceptedCategory[]>([]);
  const [allCategories, setAllCategories] = useState<WasteCategory[]>([]);

  // Add modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [accepted, all] = await Promise.all([
        recyclingService.getAcceptedCategories(),
        getWasteCategories().catch(() => [] as WasteCategory[]),
      ]);
      setAcceptedCategories(accepted);
      setAllCategories(all);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleAddCategory = async (categoryId: number) => {
    setSubmittingId(categoryId);
    try {
      await recyclingService.addCategory(categoryId);
      setModalVisible(false);
      fetchData();
      const successText = 'Category successfully added to accepted streams.';
      if (Platform.OS === 'web') window.alert(successText);
      else Alert.alert('Added', successText);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      const errorText =
        errorObj.response?.data?.message || errorObj.message || 'Failed to add category.';
      if (Platform.OS === 'web') window.alert(errorText);
      else Alert.alert('Error', errorText);
    } finally {
      setSubmittingId(null);
    }
  };

  const handleRemoveCategory = (cat: AcceptedCategory) => {
    const doRemove = async () => {
      try {
        await recyclingService.removeCategory(cat.id);
        setAcceptedCategories((prev) => prev.filter((item) => item.id !== cat.id));
        const removeSuccessText = `${cat.name} removed from your accepted materials.`;
        if (Platform.OS === 'web') window.alert(removeSuccessText);
        else Alert.alert('Removed', removeSuccessText);
      } catch (err: unknown) {
        const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
        const removeErrorText =
          errorObj.response?.data?.message || errorObj.message || 'Failed to remove category.';
        if (Platform.OS === 'web') window.alert(removeErrorText);
        else Alert.alert('Error', removeErrorText);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to stop accepting ${cat.name}?`)) {
        doRemove();
      }
    } else {
      Alert.alert(
        'Remove Category',
        `Are you sure your facility wants to stop accepting ${cat.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', style: 'destructive', onPress: doRemove },
        ]
      );
    }
  };

  // Categories available to add (not currently accepted)
  const availableToAdd = allCategories.filter(
    (globalCat) => !acceptedCategories.some((acc) => acc.id === globalCat.id)
  );

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
        <Text style={styles.headerTitle}>Accepted Waste Streams</Text>
        <TouchableOpacity
          style={styles.addHeaderBtn}
          onPress={() => setModalVisible(true)}
          disabled={availableToAdd.length === 0}
        >
          <Ionicons
            name="add-circle"
            size={28}
            color={availableToAdd.length === 0 ? '#94A3B8' : '#059669'}
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Loading accepted categories...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Info Card */}
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle" size={20} color="#0284C7" />
            <Text style={styles.infoBannerText}>
              Haulers and drop-off listings will only dispatch materials that match your accepted
              waste categories below.
            </Text>
          </View>

          {/* Accepted List */}
          {acceptedCategories.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>♻️</Text>
              <Text style={styles.emptyTitle}>No Streams Accepted Yet</Text>
              <Text style={styles.emptySub}>
                Your center is not currently configured to receive any waste categories.
              </Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => setModalVisible(true)}>
                <Ionicons name="add" size={18} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>Add First Stream</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.listContainer}>
              <View style={styles.listHeaderRow}>
                <Text style={styles.listCount}>Active Streams ({acceptedCategories.length})</Text>
              </View>

              {acceptedCategories.map((cat) => {
                const emoji = CATEGORY_EMOJIS[cat.name] || cat.icon || '♻️';
                return (
                  <View key={cat.id} style={styles.categoryCard}>
                    <View style={styles.categoryIconCircle}>
                      <Text style={styles.categoryEmoji}>{emoji}</Text>
                    </View>
                    <View style={styles.categoryInfo}>
                      <Text style={styles.categoryName}>{cat.name}</Text>
                      {cat.description ? (
                        <Text style={styles.categoryDesc} numberOfLines={2}>
                          {cat.description}
                        </Text>
                      ) : null}
                      <Text style={styles.categoryAdded}>
                        Added {new Date(cat.added_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => handleRemoveCategory(cat)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* Add Category Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Accepted Waste Stream</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Select a category your facility has the machinery and permits to process:
            </Text>

            {availableToAdd.length === 0 ? (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <Ionicons name="checkmark-done-circle" size={40} color="#10B981" />
                <Text style={{ marginTop: 8, fontSize: 14, color: '#64748B' }}>
                  All available system categories are already accepted!
                </Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 320 }}>
                {availableToAdd.map((cat) => {
                  const emoji = CATEGORY_EMOJIS[cat.name] || cat.icon || '♻️';
                  const isAdding = submittingId === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={styles.modalItem}
                      onPress={() => handleAddCategory(cat.id)}
                      disabled={isAdding}
                    >
                      <View style={styles.modalItemIcon}>
                        <Text style={{ fontSize: 22 }}>{emoji}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.modalItemName}>{cat.name}</Text>
                        {cat.description ? (
                          <Text style={styles.modalItemDesc} numberOfLines={1}>
                            {cat.description}
                          </Text>
                        ) : null}
                      </View>
                      {isAdding ? (
                        <ActivityIndicator size="small" color="#059669" />
                      ) : (
                        <Ionicons name="add-circle-outline" size={22} color="#059669" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  addHeaderBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    alignItems: 'center',
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#0369A1',
    lineHeight: 17,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 20,
  },
  emptyEmoji: {
    fontSize: 44,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  primaryBtn: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  listContainer: {
    gap: 10,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  listCount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    ...onboardingTheme.cardShadow,
  },
  categoryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryEmoji: {
    fontSize: 22,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  categoryDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  categoryAdded: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  removeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 18,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  modalItemIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalItemDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
});
