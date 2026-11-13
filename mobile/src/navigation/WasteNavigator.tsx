import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useFonts } from 'expo-font';
import {
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CreateListingScreen from '../screens/user/CreateWasteListingScreen';
import MyListingsScreen from '../screens/user/MyListingsScreen';
import WasteCategoryScreen from '../screens/user/WasteCategoryScreen';
import WasteKitScreen from '../screens/user/WasteKitScreen';
import { colors, fonts } from '../theme/wasteTheme';

export type WasteStackParamList = {
  Kit: undefined;
  MyListings: undefined;
  Categories: undefined;
  AddListing: undefined;
  RequestCollection: { listingIds: string[] };
  ListingDetail: { id: string };
};

const Stack = createNativeStackNavigator<WasteStackParamList>();

function Placeholder({ label }: { label: string }) {
  return (
    <View style={styles.centerContainer}>
      <Text>{label} (coming next)</Text>
    </View>
  );
}

function CategoriesRoute({
  navigation,
}: NativeStackScreenProps<WasteStackParamList, 'Categories'>) {
  return <WasteCategoryScreen onSelect={() => navigation.navigate('AddListing')} />;
}

export default function WasteNavigator() {
  // Fonts are loaded here for now; move this to App.tsx once the whole app uses them.
  const [fontsLoaded] = useFonts({
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName="AddListing" // use "MyListings" once the form works
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTintColor: colors.ink,
        headerTitleStyle: { fontFamily: fonts.headingSemi, fontSize: 17 },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Kit" component={WasteKitScreen} options={{ title: 'Design kit' }} />
      <Stack.Screen
        name="MyListings"
        component={MyListingsScreen}
        options={{ title: 'My Waste Listings' }}
      />
      <Stack.Screen
        name="Categories"
        component={CategoriesRoute}
        options={{ title: 'Choose a category' }}
      />
      <Stack.Screen name="AddListing" options={{ title: 'Create Listing' }}>
        {({ navigation }) => (
          <CreateListingScreen
            onDone={(id, goNext) =>
              goNext
                ? navigation.replace('RequestCollection', { listingIds: [id] })
                : navigation.replace('MyListings')
            }
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="RequestCollection" options={{ title: 'Create Collection Request' }}>
        {() => <Placeholder label="Pickup location & schedule" />}
      </Stack.Screen>
      <Stack.Screen name="ListingDetail" options={{ title: 'Listing' }}>
        {() => <Placeholder label="Listing details" />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});