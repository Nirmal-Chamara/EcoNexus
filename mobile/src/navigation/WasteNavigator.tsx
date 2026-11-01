import { ActivityIndicator, View, Text } from 'react-native';
import { useFonts } from 'expo-font';
import {
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
import MyListingsScreen from '../screens/user/MyListingsScreen';
import WasteCategoryScreen from '../screens/user/WasteCategoryScreen';
import WasteKitScreen from '../screens/user/WasteKitScreen';
import { colors, fonts } from '../theme/wasteTheme';

export type WasteStackParamList = {
  Kit: undefined;
  MyListings: undefined;
  Categories: undefined;
  AddListing: { categoryId: number; categoryName: string };
  ListingDetail: { id: string };
};

const Stack = createNativeStackNavigator<WasteStackParamList>();

function Placeholder({ label }: { label: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>{label} (coming next)</Text>
    </View>
  );
}

function CategoriesRoute({
  navigation,
}: NativeStackScreenProps<WasteStackParamList, 'Categories'>) {
  return (
    <WasteCategoryScreen
      onSelect={(c) =>
        navigation.navigate('AddListing', { categoryId: c.id, categoryName: c.name })
      }
    />
  );
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
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName="Kit" // change to "MyListings" after you have checked the preview
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
        {() => <Placeholder label="Create listing form" />}
      </Stack.Screen>
      <Stack.Screen name="ListingDetail" options={{ title: 'Listing' }}>
        {() => <Placeholder label="Listing details" />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
