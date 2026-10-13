import { useEffect, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet,
} from "react-native";
import { getCategories } from "../../services/waste.service";
import { WasteCategory } from "../../types/waste";

type Props = {
  onSelect?: (category: WasteCategory) => void;
};

export default function WasteCategoryScreen({ onSelect }: Props) {
  const [categories, setCategories] = useState<WasteCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setCategories(await getCategories());
    } catch (e) {
      setError("Could not load categories. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <TouchableOpacity onPress={load} style={styles.retry}>
          <Text>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What are you recycling?</Text>
      <FlatList
        data={categories}
        keyExtractor={(c) => String(c.id)}
        numColumns={2}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => onSelect?.(item)}>
            <Text style={styles.cardText}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 56, backgroundColor: "#faf8f2" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 16, color: "#0f1b3d" },
  card: {
    flex: 1, margin: 6, paddingVertical: 28, borderRadius: 14,
    alignItems: "center", backgroundColor: "#eeeacb",
  },
  cardText: { fontSize: 16, fontWeight: "600", color: "#0f1b3d" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  error: { marginBottom: 12, textAlign: "center" },
  retry: { padding: 12, borderRadius: 8, backgroundColor: "#eeeacb" },
});