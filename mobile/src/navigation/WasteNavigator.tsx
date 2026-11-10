import { View, Text } from "react-native";
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import MyListingsScreen from "../screens/user/MyListingsScreen";
import WasteCategoryScreen from "../screens/user/WasteCategoryScreen";
import AddListingScreen from "../screens/user/AddListingScreen";

export type WasteStackParamList = {
  MyListings: undefined;
  Categories: undefined;
  AddListing: { categoryId: number; categoryName: string };
  ListingDetail: { id: string };
};

const Stack = createNativeStackNavigator<WasteStackParamList>();

function Placeholder({ label }: { label: string }) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F8FAF9" }}>
      <Text style={{ fontSize: 16, color: "#475569" }}>{label}</Text>
    </View>
  );
}

function CategoriesRoute({
  navigation,
}: NativeStackScreenProps<WasteStackParamList, "Categories">) {
  return (
    <WasteCategoryScreen
      onSelect={(c) =>
        navigation.navigate("AddListing", { categoryId: c.id, categoryName: c.name })
      }
    />
  );
}

export default function WasteNavigator() {
  return (
    <Stack.Navigator initialRouteName="MyListings">
      <Stack.Screen name="MyListings" component={MyListingsScreen} options={{ title: "My Waste Listings" }} />
      <Stack.Screen name="Categories" component={CategoriesRoute} options={{ title: "Choose a category" }} />
      <Stack.Screen name="AddListing" component={AddListingScreen} options={{ title: "Add Waste Listing" }} />
      <Stack.Screen name="ListingDetail" options={{ title: "Listing" }}>
        {() => <Placeholder label="Listing details" />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}