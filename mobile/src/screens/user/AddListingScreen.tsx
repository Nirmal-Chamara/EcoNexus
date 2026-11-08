import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Image,
  ActivityIndicator, StyleSheet, Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { WasteStackParamList } from "../../navigation/WasteNavigator";
import { createListing, uploadImage } from "../../services/waste.service";

type Props = NativeStackScreenProps<WasteStackParamList, "AddListing">;
type Unit = "kg" | "items";
type Condition = "clean" | "dirty" | "damaged" | "reusable";

const CONDITIONS: Condition[] = ["clean", "dirty", "damaged", "reusable"];

export default function AddListingScreen({ route, navigation }: Props) {
  const { categoryId, categoryName } = route.params;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState<Unit>("kg");
  const [condition, setCondition] = useState<Condition>("clean");
  const [photos, setPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pickPhotos() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow photo access to add pictures.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: 5 - photos.length,
      quality: 0.7, // smaller files upload faster
    });
    if (!result.canceled) {
      setPhotos((p) => [...p, ...result.assets.map((a) => a.uri)].slice(0, 5));
    }
  }

  async function submit() {
    setError(null);
    const qty = Number(quantity);
    if (title.trim().length < 3) return setError("Title must be at least 3 characters.");
    if (!qty || qty <= 0) return setError("Enter a quantity greater than 0.");

    setSaving(true);
    try {
      const imageUrls: string[] = [];
      for (const uri of photos) {
        imageUrls.push(await uploadImage(uri));
      }
      await createListing({
        categoryId,
        title: title.trim(),
        description: description.trim() || undefined,
        quantity: qty,
        unit,
        condition,
        imageUrls,
      });
      navigation.popToTop(); // back to My Listings, which reloads itself
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Could not save the listing. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.category}>Category: {categoryName}</Text>

      <Text style={styles.label}>Title</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. Plastic bottles" />

      <Text style={styles.label}>Description (optional)</Text>
      <TextInput
        style={[styles.input, { height: 80 }]}
        value={description}
        onChangeText={setDescription}
        placeholder="Anything the collector should know"
        multiline
      />

      <Text style={styles.label}>Quantity</Text>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={quantity}
          onChangeText={setQuantity}
          placeholder="0"
          keyboardType="decimal-pad"
        />
        {(["kg", "items"] as Unit[]).map((u) => (
          <TouchableOpacity
            key={u}
            style={[styles.chip, unit === u && styles.chipActive]}
            onPress={() => setUnit(u)}
          >
            <Text style={styles.chipText}>{u}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Condition</Text>
      <View style={styles.rowWrap}>
        {CONDITIONS.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.chip, condition === c && styles.chipActive]}
            onPress={() => setCondition(c)}
          >
            <Text style={styles.chipText}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Photos ({photos.length}/5)</Text>
      <View style={styles.rowWrap}>
        {photos.map((uri) => (
          <TouchableOpacity key={uri} onPress={() => setPhotos((p) => p.filter((x) => x !== uri))}>
            <Image source={{ uri }} style={styles.thumb} />
            <Text style={styles.remove}>tap to remove</Text>
          </TouchableOpacity>
        ))}
        {photos.length < 5 && (
          <TouchableOpacity style={styles.addPhoto} onPress={pickPhotos}>
            <Text style={styles.addPhotoText}>+ Add photos</Text>
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity style={[styles.submit, saving && { opacity: 0.6 }]} onPress={submit} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Save listing</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#faf8f2" },
  category: { fontSize: 16, fontWeight: "700", color: "#0f1b3d", marginBottom: 8 },
  label: { marginTop: 14, marginBottom: 6, fontWeight: "600", color: "#0f1b3d" },
  input: { backgroundColor: "#fff", borderRadius: 10, padding: 12, fontSize: 16, borderWidth: 1, borderColor: "#e3e0d0" },
  row: { flexDirection: "row", alignItems: "center" },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", alignItems: "center" },
  chip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, backgroundColor: "#e9e6d8", marginLeft: 8, marginBottom: 8 },
  chipActive: { backgroundColor: "#eeeacb", borderWidth: 1, borderColor: "#0f1b3d" },
  chipText: { fontWeight: "600", color: "#0f1b3d" },
  thumb: { width: 80, height: 80, borderRadius: 10, marginRight: 8 },
  remove: { fontSize: 10, color: "#999", textAlign: "center", marginBottom: 8 },
  addPhoto: { width: 80, height: 80, borderRadius: 10, borderWidth: 1, borderStyle: "dashed", borderColor: "#0f1b3d", alignItems: "center", justifyContent: "center" },
  addPhotoText: { fontSize: 12, textAlign: "center", color: "#0f1b3d" },
  error: { color: "#b00020", marginTop: 14 },
  submit: { marginTop: 24, backgroundColor: "#0f1b3d", borderRadius: 12, padding: 16, alignItems: "center" },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});