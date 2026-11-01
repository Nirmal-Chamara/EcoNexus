import { ScrollView, View, Alert } from 'react-native';
import AppText from '../../components/waste/AppText';
import Button from '../../components/waste/Button';
import Chip from '../../components/waste/Chip';
import Card from '../../components/waste/Card';
import StatusBadge from '../../components/waste/StatusBadge';
import { colors } from '../../theme/wasteTheme';

// Developer preview of the waste module's building blocks.
export default function WasteKitScreen() {
  const tap = () => Alert.alert('Tapped');
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, gap: 16 }}
    >
      <AppText variant="label">Waste registration</AppText>
      <AppText variant="title">Waste Details</AppText>
      <AppText variant="muted">
        Inter for descriptions and long text. Photos help collectors bring the right equipment.
      </AppText>

      <Card>
        <AppText variant="section">Estimated Weight</AppText>
        <AppText variant="number">5.5 kg</AppText>
        <AppText variant="caption">0.5 kg to 50+ kg</AppText>
      </Card>

      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Chip label="All" count={22} onPress={tap} />
        <Chip label="Active" count={3} selected onPress={tap} />
        <Chip label="Scheduled" count={1} onPress={tap} />
        <Chip label="History" onPress={tap} />
      </View>

      <View style={{ gap: 8 }}>
        {['draft', 'active', 'requested', 'scheduled', 'collected', 'cancelled'].map((s) => (
          <StatusBadge key={s} status={s} />
        ))}
      </View>

      <Card tone="mint">
        <AppText variant="bodyStrong">Est. yield: +85 EcoPoints ($2.80)</AppText>
      </Card>
      <Card tone="amber">
        <AppText variant="bodyStrong">Estimated impact reward</AppText>
      </Card>

      <Button label="Request Collection" icon="car-outline" onPress={tap} />
      <Button label="Publish Listing" variant="lime" icon="cloud-upload-outline" onPress={tap} />
      <Button label="Next: Pickup Location & Schedule" iconRight="arrow-forward" onPress={tap} />
      <Button label="Edit" variant="soft" onPress={tap} />
      <Button label="Saving..." loading onPress={tap} />
      <Button label="Save as Draft" variant="linkText" onPress={tap} />
      <Button label="Cancel Request" variant="dangerText" onPress={tap} />
    </ScrollView>
  );
}
