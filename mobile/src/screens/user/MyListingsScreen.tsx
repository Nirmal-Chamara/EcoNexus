import { useCallback, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { WasteStackParamList } from "../../navigation/WasteNavigator";
import { getMyListings } from "../../services/waste.service";
import { WasteListing } from "../../types/waste";

type Scope = "active" | "history";
type Props = NativeStackScreenProps<WasteStackParamList, "MyListings">;

export default function MyListingsScreen({ navigation }: Props) {
  const [scope, setScope] = useState<Scope>("active");
  const [listings, setListings] = useState<WasteListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setListings(await getMyListings(scope));
    } catch (e: any) {
      setError(
        `Could not load (${e?.response?.status ?? e?.message})\n${e?.config?.baseURL ?? "no baseURL"}`
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [scope]);

  // Reloads every time the screen is shown, e.g. after adding a listing
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function changeScope(s: Scope) {
    setLoading(true);
    setScope(s);
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {(["active", "history"] as Scope[]).map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.tab, scope === s && styles.tabActive]}
            onPress={() => changeScope(s)}
          >
            <Text style={styles.tabText}>{s === "active" ? "Active" : "History"}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" />
      ) : error ? (
        <View style={styles.center}>
          <Text>{error}</Text>
          <TouchableOpacity style={styles.retry} onPress={load}>
            <Text>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(l) => l.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />
          }
          ListEmptyComponent={<Text style={styles.empty}>No listings here yet.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate("ListingDetail", { id: item.id })}
            >
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.meta}>
                {item.category_name} · {Number(item.quantity)} {item.unit} · {item.condition}
              </Text>
              <Text style={styles.status}>{item.status.toUpperCase()}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate("Categories")}>
        <Text style={styles.fabText}>+ Add</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#faf8f2" },
  tabs: { flexDirection: "row", marginBottom: 12 },
  tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: "#e9e6d8", marginRight: 8 },
  tabActive: { backgroundColor: "#eeeacb", borderWidth: 1, borderColor: "#0f1b3d" },
  tabText: { fontWeight: "600", color: "#0f1b3d" },
  card: { padding: 14, borderRadius: 12, backgroundColor: "#fff", marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#0f1b3d" },
  meta: { marginTop: 4, color: "#555" },
  status: { marginTop: 6, fontSize: 12, fontWeight: "700", color: "#6b7a1f" },
  empty: { textAlign: "center", marginTop: 40, color: "#777" },
  center: { alignItems: "center", marginTop: 40 },
  retry: { marginTop: 12, padding: 10, borderRadius: 8, backgroundColor: "#eeeacb" },
  fab: {
    position: "absolute", right: 20, bottom: 28, paddingVertical: 14, paddingHorizontal: 22,
    borderRadius: 28, backgroundColor: "#0f1b3d",
  },
  fabText: { color: "#fff", fontWeight: "700" },
});