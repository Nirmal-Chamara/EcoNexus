import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AppText from '../../components/waste/AppText';
import Button from '../../components/waste/Button';
import Card from '../../components/waste/Card';
import Chip from '../../components/waste/Chip';
import StatusBadge from '../../components/waste/StatusBadge';
import type { WasteStackParamList } from '../../navigation/WasteNavigator';
import { colors, radii } from '../../theme/wasteTheme';
import type { WasteListing, WasteSummary } from '../../types/waste';
import {
  deleteListing,
  getMyListings,
  getSummary,
  updateListing,
} from '../../services/waste.service';

type Props = NativeStackScreenProps<WasteStackParamList, 'MyListings'>;
type Scope = 'active' | 'scheduled' | 'history' | 'drafts';

const TABS: { key: Scope; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'history', label: 'History' },
  { key: 'drafts', label: 'Drafts' },
];

const SIZE_LABEL: Record<string, string> = {
  small: 'Small Bag',
  medium: 'Medium Bin',
  bulk: 'Bulk Crate',
};

const POINTS_PER_KG = 15; // placeholder, same rate the backend uses

const EMPTY_TEXT: Record<Scope, string> = {
  active: 'No active listings yet. Tap "+ New Waste" to list your first load.',
  scheduled: 'Nothing scheduled. Request a collection from an active listing.',
  history: 'Completed and cancelled listings will appear here.',
  drafts: 'Listings you save as a draft will appear here.',
};

function getErrorMessage(error: unknown): string | undefined {
  if (!error || typeof error !== 'object') return undefined;

  if ('response' in error && error.response && typeof error.response === 'object'
    && 'data' in error.response && error.response.data && typeof error.response.data === 'object'
    && 'message' in error.response.data && typeof error.response.data.message === 'string') {
    return error.response.data.message;
  }

  return 'message' in error && typeof error.message === 'string' ? error.message : undefined;
}

export default function MyListingsScreen({ navigation }: Props) {
  const [scope, setScope] = useState<Scope>('active');
  const [listings, setListings] = useState<WasteListing[]>([]);
  const [summary, setSummary] = useState<WasteSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (s: Scope, spinner: boolean) => {
    if (spinner) setLoading(true);
    setError(null);
    try {
      const [list, sum] = await Promise.all([getMyListings(s), getSummary()]);
      setListings(list);
      setSummary(sum);
    } catch (e: unknown) {
      setError(getErrorMessage(e) || 'Could not load your listings.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Runs when the screen opens, when you come back to it, and when the tab changes
  useFocusEffect(
    useCallback(() => {
      load(scope, true);
    }, [scope, load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load(scope, false);
  };

  const confirmDelete = (item: WasteListing) => {
    Alert.alert('Delete listing?', `"${item.title}" will be removed. This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setBusyId(item.id);
          try {
            await deleteListing(item.id);
            await load(scope, false);
          } catch (e: unknown) {
            Alert.alert('Could not delete', getErrorMessage(e) || 'Please try again.');
          } finally {
            setBusyId(null);
          }
        },
      },
    ]);
  };

  // A draft becomes an active listing (the edit endpoint needs the full listing back)
  const publish = async (item: WasteListing) => {
    setBusyId(item.id);
    try {
      await updateListing(item.id, {
        categoryId: item.category_id,
        description: item.description || undefined,
        quantity: Number(item.quantity),
        unit: item.unit,
        containerSize: item.container_size ?? 'medium',
        isCleaned: !!item.is_cleaned,
        isSorted: !!item.is_sorted,
        pathway: item.pathway,
        status: 'active',
        photos: (item.images ?? []).map((p) => ({ url: p.url, label: p.label ?? undefined })),
      });
      await load(scope, false);
    } catch (e: unknown) {
      Alert.alert('Could not publish', getErrorMessage(e) || 'Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const counts = summary?.counts;
  const total = counts ? counts.active + counts.scheduled + counts.history + counts.drafts : 0;
  const recycledKg = summary?.recycled_kg ?? 0;

  const header = (
    <View style={{ gap: 16, paddingBottom: 8 }}>
      <View style={styles.statsRow}>
        <Stat label="Active" value={String(counts?.active ?? 0)} />
        <Stat label="Recycled" value={`${recycledKg} kg`} />
        <Stat label="Earned" value={`${Math.round(recycledKg * POINTS_PER_KG)} pts`} />
      </View>

      <View style={styles.rowBetween}>
        <AppText variant="section">My Listings ({total} Total)</AppText>
        <Button
          label="New Waste"
          icon="add"
          variant="lime"
          onPress={() => navigation.navigate('AddListing')}
          style={{ paddingVertical: 10, paddingHorizontal: 14 }}
        />
      </View>

      <View style={styles.tabs}>
        {TABS.map((t) => (
          <Chip
            key={t.key}
            label={t.label}
            count={counts?.[t.key]}
            selected={scope === t.key}
            onPress={() => setScope(t.key)}
          />
        ))}
      </View>
    </View>
  );

  const footer = (
    <Card tone="mint" style={{ marginTop: 8 }}>
      <View style={styles.rowBetween}>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="label">Recent recycling history</AppText>
          <AppText variant="number">{recycledKg} kg recycled</AppText>
          <AppText variant="caption">Your completed collections add up here.</AppText>
        </View>
        <Button label="View all" variant="linkText" onPress={() => setScope('history')} />
      </View>
    </Card>
  );

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 12 }}
      data={loading ? [] : listings}
      keyExtractor={(l) => l.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={header}
      ListFooterComponent={loading ? null : footer}
      ListEmptyComponent={
        loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
        ) : error ? (
          <Card tone="amber" style={{ gap: 8 }}>
            <AppText variant="bodyStrong">Could not load your listings</AppText>
            <AppText variant="muted">{error}</AppText>
            <Button label="Try again" variant="soft" onPress={() => load(scope, true)} />
          </Card>
        ) : (
          <Card style={{ alignItems: 'center', gap: 8, paddingVertical: 28 }}>
            <Ionicons name="leaf-outline" size={32} color={colors.primary} />
            <AppText variant="muted" style={{ textAlign: 'center' }}>
              {EMPTY_TEXT[scope]}
            </AppText>
          </Card>
        )
      }
      renderItem={({ item }) => (
        <ListingCard
          item={item}
          busy={busyId === item.id}
          onRequest={() => navigation.navigate('RequestCollection', { listingIds: [item.id] })}
          onEdit={() =>
            (navigation as unknown as {
              navigate: (screen: string, params: { id: string }) => void;
            }).navigate('EditListing', { id: item.id })
          }
          onTrack={() => navigation.navigate('ListingDetail', { id: item.id })}
          onDelete={() => confirmDelete(item)}
          onPublish={() => publish(item)}
        />
      )}
    />
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card style={styles.stat}>
      <AppText variant="caption">{label}</AppText>
      <AppText variant="number">{value}</AppText>
    </Card>
  );
}

type CardProps = {
  item: WasteListing;
  busy: boolean;
  onRequest: () => void;
  onEdit: () => void;
  onTrack: () => void;
  onDelete: () => void;
  onPublish: () => void;
};

function ListingCard({ item, busy, onRequest, onEdit, onTrack, onDelete, onPublish }: CardProps) {
  const photo = item.images?.[0]?.url;
  const weight = `${Number(item.quantity)} ${item.unit}`;
  const size = item.container_size ? SIZE_LABEL[item.container_size] : null;
  const code = item.listing_code ? `#${item.listing_code}` : '';

  return (
    <Card style={{ gap: 12 }}>
      <View style={styles.cardTop}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbEmpty]}>
            <Ionicons name="image-outline" size={24} color={colors.primary} />
          </View>
        )}
        <View style={{ flex: 1, gap: 4 }}>
          <View style={styles.rowBetween}>
            <AppText variant="caption">{code}</AppText>
            <StatusBadge status={item.status} />
          </View>
          <AppText variant="section" numberOfLines={1}>
            {item.title}
          </AppText>
          <AppText variant="muted" numberOfLines={1}>
            {item.category_name} · {weight}
            {size ? ` · ${size}` : ''}
          </AppText>
        </View>
      </View>

      {item.status === 'active' && (
        <View style={styles.actions}>
          <Button
            label="Request Collection"
            icon="car-outline"
            onPress={onRequest}
            disabled={busy}
            style={{ flex: 1 }}
          />
          <Button label="Edit" variant="soft" onPress={onEdit} disabled={busy} />
          <TrashButton onPress={onDelete} busy={busy} />
        </View>
      )}

      {item.status === 'draft' && (
        <View style={styles.actions}>
          <Button
            label="Publish Listing"
            icon="cloud-upload-outline"
            variant="lime"
            onPress={onPublish}
            loading={busy}
            style={{ flex: 1 }}
          />
          <Button label="Edit" variant="soft" onPress={onEdit} disabled={busy} />
          <TrashButton onPress={onDelete} busy={busy} />
        </View>
      )}

      {(item.status === 'requested' || item.status === 'scheduled') && (
        <Button
          label={item.status === 'scheduled' ? 'Track Live Hauler' : 'View Request'}
          icon="navigate-outline"
          onPress={onTrack}
        />
      )}
    </Card>
  );
}

function TrashButton({ onPress, busy }: { onPress: () => void; busy: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={busy} style={styles.trash}>
      <Ionicons name="trash-outline" size={20} color={colors.danger} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statsRow: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, padding: 12, gap: 2 },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cardTop: { flexDirection: 'row', gap: 12 },
  thumb: { width: 76, height: 76, borderRadius: radii.md },
  thumbEmpty: {
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  trash: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});