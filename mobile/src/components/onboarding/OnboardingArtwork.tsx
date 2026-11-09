import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { onboardingTheme } from '../../theme/onboardingTheme';

/**
 * Slide 1 Graphic: Electric Eco-Hauler Van
 */
export function DoorstepHaulerArtwork() {
  return (
    <View style={styles.artworkContainer}>
      {/* Outer ambient glow rings */}
      <View style={[styles.glowRing, { width: 220, height: 220, opacity: 0.35 }]} />
      <View style={[styles.glowRing, { width: 170, height: 170, opacity: 0.55 }]} />

      {/* Floating leaves */}
      <View style={[styles.floatingLeaf, { top: 20, left: 30 }]}>
        <Ionicons name="leaf" size={18} color="#10B981" />
      </View>
      <View style={[styles.floatingLeaf, { top: 40, right: 35 }]}>
        <Ionicons name="leaf" size={14} color="#34D399" />
      </View>
      <View style={[styles.floatingLeaf, { bottom: 35, left: 24 }]}>
        <Ionicons name="leaf" size={16} color="#059669" />
      </View>

      {/* Van Body */}
      <View style={styles.haulerIllustration}>
        {/* Antenna with leaf */}
        <View style={styles.haulerAntennaRow}>
          <View style={styles.antennaStem} />
          <View style={styles.antennaLeafBadge}>
            <Ionicons name="leaf" size={12} color="#059669" />
          </View>
        </View>

        {/* Truck Cabin & Cargo Box */}
        <View style={styles.haulerBodyRow}>
          {/* Main Cargo Container */}
          <View style={styles.haulerCargoBox}>
            <View style={styles.haulerRecycleEmblem}>
              <MaterialCommunityIcons name="recycle" size={24} color="#059669" />
            </View>
            <View style={styles.haulerDoorLine} />
            <View style={styles.haulerVentCol}>
              <View style={styles.haulerVentLine} />
              <View style={styles.haulerVentLine} />
            </View>
          </View>

          {/* Cabin */}
          <View style={styles.haulerCabin}>
            {/* Windshield */}
            <View style={styles.haulerWindshield}>
              <View style={styles.windshieldGlare} />
            </View>
            {/* Headlight */}
            <View style={styles.headlightGlow} />
          </View>
        </View>

        {/* Truck Base & Wheels */}
        <View style={styles.haulerWheelsRow}>
          <View style={styles.wheelOuter}>
            <View style={styles.wheelHub} />
          </View>
          <View style={styles.wheelOuter}>
            <View style={styles.wheelHub} />
          </View>
        </View>

        {/* Road Track Line */}
        <View style={styles.roadTrackLine} />
      </View>
    </View>
  );
}

/**
 * Slide 2 Graphic: Eco-Dome & Micro-Forest Botanic Laboratory
 */
export function EcologicalImpactArtwork() {
  return (
    <View style={styles.artworkContainer}>
      {/* Background sunbeam aura */}
      <View style={[styles.glowRing, { width: 220, height: 220, backgroundColor: '#ECFDF5', opacity: 0.6 }]} />
      <View style={[styles.glowRing, { width: 160, height: 160, backgroundColor: '#D1FAE5', opacity: 0.5 }]} />

      {/* Eco Dome Frame */}
      <View style={styles.domeFrame}>
        {/* Top Solar Arch */}
        <View style={styles.domeArch}>
          <Ionicons name="sunny" size={22} color="#F59E0B" />
        </View>

        {/* Greenhouse Interior Scene */}
        <View style={styles.domeInterior}>
          {/* Micro-forest saplings */}
          <View style={styles.saplingCluster}>
            <View style={styles.plantPot}>
              <Ionicons name="leaf" size={26} color="#059669" />
            </View>
            <View style={[styles.plantPot, { transform: [{ scale: 1.2 }], marginHorizontal: 8 }]}>
              <MaterialCommunityIcons name="tree" size={38} color="#047857" />
            </View>
            <View style={styles.plantPot}>
              <Ionicons name="leaf" size={22} color="#10B981" />
            </View>
          </View>

          {/* Eco Botanist Avatar / Badge */}
          <View style={styles.botanistBadge}>
            <Ionicons name="person" size={16} color="#065F46" />
            <Text style={styles.botanistBadgeText}>Eco-Steward</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

/**
 * Slide 3 Graphic: Rewards Vault, Produce Basket & EcoPoints
 */
export function RewardsValueArtwork() {
  return (
    <View style={styles.artworkContainer}>
      {/* Warm Golden Glow Rings */}
      <View style={[styles.glowRing, { width: 220, height: 220, backgroundColor: '#FEF3C7', opacity: 0.4 }]} />
      <View style={[styles.glowRing, { width: 170, height: 170, backgroundColor: '#FDE68A', opacity: 0.5 }]} />

      {/* Reward Showcase Cluster */}
      <View style={styles.rewardsCluster}>
        {/* Main Produce / Groceries Basket */}
        <View style={styles.basketContainer}>
          <View style={styles.basketHandle} />
          <View style={styles.basketBody}>
            <View style={styles.basketItemsRow}>
              <Text style={styles.basketEmoji}>🥦</Text>
              <Text style={styles.basketEmoji}>🍎</Text>
              <Text style={styles.basketEmoji}>🥕</Text>
            </View>
            <View style={styles.supermarketTag}>
              <Text style={styles.supermarketTagText}>Keells & Cargills</Text>
            </View>
          </View>
        </View>

        {/* Floating Golden Coin */}
        <View style={styles.floatingCoin}>
          <Text style={styles.coinGlyph}>🪙</Text>
        </View>

        {/* Voucher Tag Pill */}
        <View style={styles.floatingVoucherPill}>
          <Ionicons name="receipt-outline" size={13} color="#059669" />
          <Text style={styles.floatingVoucherText}>Rs. 1,000</Text>
        </View>
      </View>
    </View>
  );
}

/**
 * Clean Sri Lanka Glowing Brand Emblem (For Splash Screen)
 */
export function CleanSriLankaEmblem() {
  return (
    <View style={styles.emblemContainer}>
      <View style={[styles.emblemRing, { width: 190, height: 190, opacity: 0.25 }]} />
      <View style={[styles.emblemRing, { width: 150, height: 150, opacity: 0.45 }]} />
      <View style={[styles.emblemRing, { width: 116, height: 116, opacity: 0.85 }]} />

      {/* Central Brand Shield */}
      <View style={styles.emblemCenterBadge}>
        {/* Recycle circle with leaf */}
        <View style={styles.recycleGlyphCircle}>
          <MaterialCommunityIcons name="recycle-variant" size={42} color="#059669" />
        </View>
        <View style={styles.cleanSriLankaBadge}>
          <Text style={styles.cleanSriLankaText}>CLEAN SRI LANKA</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  artworkContainer: {
    width: '100%',
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  glowRing: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#D1FAE5',
  },
  floatingLeaf: {
    position: 'absolute',
  },

  /* Slide 1 - Hauler */
  haulerIllustration: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 190,
    height: 140,
    position: 'relative',
  },
  haulerAntennaRow: {
    position: 'absolute',
    top: 6,
    left: 45,
    flexDirection: 'row',
    alignItems: 'center',
  },
  antennaStem: {
    width: 2,
    height: 18,
    backgroundColor: '#059669',
  },
  antennaLeafBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    padding: 2,
    marginLeft: -4,
    marginTop: -8,
  },
  haulerBodyRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 22,
  },
  haulerCargoBox: {
    width: 105,
    height: 68,
    backgroundColor: '#047857',
    borderRadius: 14,
    borderTopRightRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: '#065F46',
  },
  haulerRecycleEmblem: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  haulerDoorLine: {
    position: 'absolute',
    right: 18,
    top: 6,
    bottom: 6,
    width: 2,
    backgroundColor: '#065F46',
  },
  haulerVentCol: {
    position: 'absolute',
    left: 8,
    top: 14,
    gap: 3,
  },
  haulerVentLine: {
    width: 14,
    height: 2,
    backgroundColor: '#065F46',
    borderRadius: 1,
  },
  haulerCabin: {
    width: 48,
    height: 52,
    backgroundColor: '#059669',
    borderTopRightRadius: 18,
    borderBottomRightRadius: 10,
    marginLeft: -2,
    justifyContent: 'space-between',
    padding: 4,
    borderWidth: 2,
    borderColor: '#047857',
    position: 'relative',
  },
  haulerWindshield: {
    width: 32,
    height: 26,
    backgroundColor: '#CCFBF1',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 4,
    overflow: 'hidden',
  },
  windshieldGlare: {
    width: 8,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    transform: [{ rotate: '25deg' }],
    marginTop: -6,
  },
  headlightGlow: {
    position: 'absolute',
    right: -3,
    bottom: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FEF08A',
  },
  haulerWheelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 120,
    marginTop: -10,
    zIndex: 10,
  },
  wheelOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1E293B',
    borderWidth: 3,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelHub: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  roadTrackLine: {
    width: 170,
    height: 3,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    marginTop: -8,
  },

  /* Slide 2 - Ecological Dome */
  domeFrame: {
    width: 180,
    height: 130,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    position: 'relative',
    ...onboardingTheme.cardShadow,
  },
  domeArch: {
    position: 'absolute',
    top: -14,
    backgroundColor: '#FEF3C7',
    padding: 4,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FDE68A',
  },
  domeInterior: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  saplingCluster: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: 8,
  },
  plantPot: {
    alignItems: 'center',
  },
  botanistBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  botanistBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
  },

  /* Slide 3 - Rewards */
  rewardsCluster: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: 180,
    height: 140,
  },
  basketContainer: {
    alignItems: 'center',
  },
  basketHandle: {
    width: 50,
    height: 24,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    borderWidth: 3,
    borderColor: '#D97706',
    borderBottomWidth: 0,
    marginBottom: -4,
  },
  basketBody: {
    backgroundColor: '#FDE68A',
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F59E0B',
    ...onboardingTheme.cardShadow,
  },
  basketItemsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  basketEmoji: {
    fontSize: 22,
  },
  supermarketTag: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  supermarketTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065F46',
  },
  floatingCoin: {
    position: 'absolute',
    top: 6,
    left: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 4,
    ...onboardingTheme.glowShadow,
  },
  coinGlyph: {
    fontSize: 22,
  },
  floatingVoucherPill: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  floatingVoucherText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065F46',
  },

  /* Splash Screen Clean Sri Lanka Emblem */
  emblemContainer: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  emblemRing: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#D1FAE5',
  },
  emblemCenterBadge: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#34D399',
    ...onboardingTheme.glowShadow,
  },
  recycleGlyphCircle: {
    marginBottom: 4,
  },
  cleanSriLankaBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cleanSriLankaText: {
    color: '#FFFFFF',
    fontSize: 7.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});

