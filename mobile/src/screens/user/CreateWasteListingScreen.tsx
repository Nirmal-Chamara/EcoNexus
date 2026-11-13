import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Slider from '@react-native-community/slider';
import AppText from '../../components/waste/AppText';
import Button from '../../components/waste/Button';
import Card from '../../components/waste/Card';
import { colors, radii } from '../../theme/wasteTheme';
import { fonts } from '../../theme/wasteTheme';
import type { ContainerSize, WasteCategory } from '../../types/waste';
import { createListing, getCategories, uploadImage } from '../../services/waste.service';

const MAX_PHOTOS = 4;
const PHOTO_LABELS = ['Front view', 'Close-up', 'Side view', 'Detail'];
const CHIPS = [1, 5, 10, 25];
const POINTS_PER_KG = 15; // placeholder: same rate the backend uses

const SIZES: {
  key: ContainerSize;
  title: string;
  sub: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: 'small', title: 'Small Bag', sub: '< 3 kg', icon: 'bag-handle-outline' },
  { key: 'medium', title: 'Medium Bin', sub: '3 - 15 kg', icon: 'trash-bin-outline' },
  { key: 'bulk', title: 'Bulk Crate', sub: '15+ kg', icon: 'cube-outline' },
];

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Plastic: 'water-outline',
  Paper: 'document-text-outline',
  Cardboard: 'cube-outline',
  Metal: 'construct-outline',
  Glass: 'wine-outline',
  'E-Waste': 'hardware-chip-outline',
  Textiles: 'shirt-outline',
};

type Props = {
  onDone: (listingId: string, goNext: boolean) => void;
};

export default function CreateListingScreen({ onDone }: Props) {
  const [categories, setCategories] = useState<WasteCategory[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [photos, setPhotos] = useState<string[]>([]); // local file paths
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [weight, setWeight] = useState(5);
  const [size, setSize] = useState<ContainerSize>('medium');
  const [isCleaned, setIsCleaned] = useState(false);
  const [isSorted, setIsSorted] = useState(false);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState<'draft' | 'next' | null>(null);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => Alert.alert('Could not load categories', 'Check your connection and try again.'))
      .finally(() => setLoadingCats(false));
  }, []);

  const addPhoto = () => {
    if (photos.length >= MAX_PHOTOS) return;
    Alert.alert('Add photo', 'Where is the photo from?', [
      { text: 'Camera', onPress: () => pick(true) },
      { text: 'Gallery', onPress: () => pick(false) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const pick = async (useCamera: boolean) => {
    try {
      const perm = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Please allow access in your phone settings.');
        return;
      }
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.7,
            legacy: true,
          });
      if (!result.canceled) setPhotos((p) => [...p, result.assets[0].uri].slice(0, MAX_PHOTOS));
    } catch {
      Alert.alert(
        'Could not open photos',
        useCamera
          ? 'The camera is not available on this device.'
          : 'No photo app was found on this device. Try the camera instead.'
      );
    }
  };

  const removePhoto = (i: number) => setPhotos((p) => p.filter((_, idx) => idx !== i));

  const addWeight = (n: number) => setWeight((w) => Math.min(50, Math.round((w + n) * 2) / 2));

  const submit = async (status: 'draft' | 'active') => {
    if (categoryId === null)
      return Alert.alert('Choose a category', 'Pick the material type first.');
    if (photos.length === 0)
      return Alert.alert('Add a photo', 'Add at least one photo of the waste.');

    setBusy(status === 'draft' ? 'draft' : 'next');
    try {
      const uploaded = [];
      for (let i = 0; i < photos.length; i++) {
        const url = await uploadImage(photos[i]);
        uploaded.push({ url, label: PHOTO_LABELS[i] });
      }
      const listing = await createListing({
        categoryId,
        description: notes.trim() || undefined,
        quantity: weight,
        unit: 'kg',
        containerSize: size,
        isCleaned,
        isSorted,
        status,
        photos: uploaded,
      });
      onDone(listing.id, status === 'active');
    } catch (e: unknown) {
      const error = e as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const msg = error?.response?.data?.message || error?.message || 'Something went wrong.';
      Alert.alert('Could not save listing', msg);
    } finally {
      setBusy(null);
    }
  };

  const points = Math.round(weight * POINTS_PER_KG);

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      {/* Progress */}
      <View style={styles.gap6}>
        <View style={styles.rowBetween}>
          <AppText variant="label">Step 1 of 3</AppText>
          <AppText variant="caption">33%</AppText>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, styles.fillStep1]} />
        </View>
      </View>

      <View style={styles.gap4}>
        <AppText variant="title">Waste Details</AppText>
        <AppText variant="muted">
          Photos help collectors bring the right equipment and verify your estimate.
        </AppText>
      </View>

      {/* Photos */}
      <View style={styles.sectionGap}>
        <View style={styles.rowBetween}>
          <AppText variant="section">Photos</AppText>
          <AppText variant="caption">
            {photos.length} of {MAX_PHOTOS}
          </AppText>
        </View>
        <View style={styles.photoGrid}>
          {photos.map((uri, i) => (
            <View key={uri} style={styles.photoBox}>
              <Image source={{ uri }} style={styles.photo} />
              <View style={styles.photoLabel}>
                <AppText variant="caption" color={colors.white}>
                  {PHOTO_LABELS[i]}
                </AppText>
              </View>
              <Pressable style={styles.remove} onPress={() => removePhoto(i)}>
                <Ionicons name="close" size={14} color={colors.white} />
              </Pressable>
            </View>
          ))}
          {photos.length < MAX_PHOTOS && (
            <Pressable style={[styles.photoBox, styles.addBox]} onPress={addPhoto}>
              <Ionicons name="camera-outline" size={26} color={colors.primary} />
              <AppText variant="caption" color={colors.primary}>
                Add photo
              </AppText>
            </Pressable>
          )}
        </View>
      </View>

      {/* Category */}
      <View style={styles.sectionGap}>
        <AppText variant="section">Material Category</AppText>
        {loadingCats ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <View style={styles.catGrid}>
            {categories.map((c) => {
              const selected = c.id === categoryId;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setCategoryId(c.id)}
                  style={[styles.cat, selected && styles.itemSelected]}
                >
                  <Ionicons
                    name={CATEGORY_ICONS[c.name] ?? 'leaf-outline'}
                    size={24}
                    color={selected ? colors.primary : colors.ink}
                  />
                  <AppText variant="bodyStrong">{c.name}</AppText>
                  {!!c.description && (
                    <AppText variant="caption" numberOfLines={2}>
                      {c.description}
                    </AppText>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {/* Weight */}
      <Card>
        <View style={styles.rowBetween}>
          <AppText variant="section">Estimated Weight</AppText>
          <AppText variant="number" color={colors.primary}>
            {weight >= 50 ? '50+' : weight} kg
          </AppText>
        </View>
        <Slider
          minimumValue={0.5}
          maximumValue={50}
          step={0.5}
          value={weight}
          onValueChange={setWeight}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.lavender}
          thumbTintColor={colors.primary}
        />
        <View style={styles.rowBetween}>
          <AppText variant="caption">0.5 kg</AppText>
          <AppText variant="caption">50+ kg</AppText>
        </View>
        <View style={styles.chipRow}>
          {CHIPS.map((n) => (
            <Pressable key={n} style={styles.quick} onPress={() => addWeight(n)}>
              <AppText variant="bodyStrong">+{n}</AppText>
            </Pressable>
          ))}
        </View>
      </Card>

      {/* Container size */}
      <View style={styles.sectionGap}>
        <AppText variant="section">Volume / Container Size</AppText>
        <View style={styles.sizeRow}>
          {SIZES.map((s) => {
            const selected = s.key === size;
            return (
              <Pressable
                key={s.key}
                onPress={() => setSize(s.key)}
                style={[styles.size, selected && styles.itemSelected]}
              >
                <Ionicons name={s.icon} size={24} color={selected ? colors.primary : colors.ink} />
                <AppText variant="bodyStrong">{s.title}</AppText>
                <AppText variant="caption">{s.sub}</AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Toggles */}
      <View style={styles.sectionGap}>
        <Toggle label="Cleaned and rinsed" value={isCleaned} onChange={setIsCleaned} />
        <Toggle label="Sorted by material type" value={isSorted} onChange={setIsSorted} />
      </View>

      {/* Notes */}
      <View style={styles.gap8}>
        <AppText variant="section">Special instructions for collector</AppText>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Gate code, where the bags are, anything the collector should know"
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={1000}
          style={styles.input}
        />
      </View>

      {/* Reward */}
      <Card tone="amber">
        <AppText variant="label" color={colors.amberText}>
          Estimated impact reward
        </AppText>
        <AppText variant="number">+{points} EcoPoints</AppText>
        <AppText variant="caption">Final points depend on the verified weight at pickup.</AppText>
      </Card>

      <Button
        label="Next: Pickup Location & Schedule"
        iconRight="arrow-forward"
        loading={busy === 'next'}
        disabled={busy !== null}
        onPress={() => submit('active')}
      />
      <Button
        label="Save as Draft"
        variant="linkText"
        loading={busy === 'draft'}
        disabled={busy !== null}
        onPress={() => submit('draft')}
      />
    </ScrollView>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Pressable onPress={() => onChange(!value)} style={styles.toggle}>
      <AppText variant="bodyStrong">{label}</AppText>
      <View style={[styles.switch, value && styles.switchActive]}>
        <View style={[styles.knob, value && styles.knobActive]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1, backgroundColor: colors.background },
  contentContainer: { padding: 16, paddingBottom: 40, gap: 20 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gap4: { gap: 4 },
  gap6: { gap: 6 },
  gap8: { gap: 8 },
  sectionGap: { gap: 10 },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.lavender },
  fill: { height: 6, borderRadius: 3, backgroundColor: colors.primary },
  fillStep1: { width: '33%' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoBox: { width: '47.5%', aspectRatio: 1.2, borderRadius: radii.md, overflow: 'hidden' },
  photo: { width: '100%', height: '100%' },
  photoLabel: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    backgroundColor: colors.overlay,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
  },
  remove: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cat: {
    width: '47.5%',
    minHeight: 96,
    padding: 12,
    gap: 4,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  itemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.mint,
  },
  chipRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  quick: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.lavender,
  },
  sizeRow: { flexDirection: 'row', gap: 10 },
  size: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    gap: 4,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  switch: {
    width: 46,
    height: 26,
    borderRadius: 13,
    padding: 3,
    backgroundColor: colors.lavender,
    justifyContent: 'center',
  },
  switchActive: {
    backgroundColor: colors.primary,
  },
  knob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.white,
    alignSelf: 'flex-start',
  },
  knobActive: {
    alignSelf: 'flex-end',
  },
  input: {
    minHeight: 96,
    padding: 12,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    textAlignVertical: 'top',
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ink,
  },
});
