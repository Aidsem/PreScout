import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing } from '../theme/colors';

const { width } = Dimensions.get('window');

interface Slide {
  id: number;
  title: string;
  badge: string;
  description: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  accentColor: string;
}

const slides: Slide[] = [
  {
    id: 1,
    title: 'Intelligent Response',
    badge: 'AI COMPUTER VISION',
    description:
      'Harness the power of neural models to detect stranded persons, thermal signatures, and environmental hazards in real-time.',
    icon: 'eye-outline',
    accentColor: Colors.tertiary,
  },
  {
    id: 2,
    title: 'Tactical Awareness',
    badge: 'TELEMETRY & MESH',
    description:
      'Monitor ground-level sensors, aerial video feeds, and decentralized mesh network packets under zero-cellular conditions.',
    icon: 'radar',
    accentColor: Colors.warning,
  },
  {
    id: 3,
    title: 'Unified Command',
    badge: 'AIR & GROUND SWARM',
    description:
      'Seamlessly coordinate reconnaissance drones, rovers, and rescue operators through a single high-reliability tactical interface.',
    icon: 'shield-cross',
    accentColor: Colors.accentBlue,
  },
];

export const OnboardingScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const handleNext = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    } else {
      navigation.replace('MainTabs');
    }
  };

  const handleSkip = () => {
    navigation.replace('MainTabs');
  };

  const slide = slides[currentSlideIndex];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Top Bar with RESQMESH and SKIP */}
      <View style={styles.topBar}>
        <View style={styles.logoRow}>
          <MaterialCommunityIcons name="access-point-network" size={20} color={Colors.tertiary} />
          <Text style={styles.topLogoText}>RESQMESH</Text>
        </View>
        <TouchableOpacity onPress={handleSkip} activeOpacity={0.7} style={styles.skipButton}>
          <Text style={styles.skipButtonText}>SKIP</Text>
        </TouchableOpacity>
      </View>

      {/* Slide Illustration Box */}
      <View style={styles.cardWrapper}>
        <View style={styles.tacticalCard}>
          {/* Decorative Corner Reticles */}
          <View style={[styles.cornerBracket, styles.bracketTopLeft]} />
          <View style={[styles.cornerBracket, styles.bracketTopRight]} />
          <View style={[styles.cornerBracket, styles.bracketBottomLeft]} />
          <View style={[styles.cornerBracket, styles.bracketBottomRight]} />

          {/* Icon Stage */}
          <View style={[styles.iconCircle, { borderColor: slide.accentColor }]}>
            <MaterialCommunityIcons
              name={slide.icon}
              size={72}
              color={slide.accentColor}
            />
          </View>

          {/* Tactical Badge */}
          <View
            style={[
              styles.slideBadge,
              { backgroundColor: `${slide.accentColor}20`, borderColor: slide.accentColor },
            ]}
          >
            <Text style={[styles.slideBadgeText, { color: slide.accentColor }]}>
              {slide.badge}
            </Text>
          </View>

          {/* Titles & Description */}
          <Text style={styles.slideTitle}>{slide.title}</Text>
          <Text style={styles.slideDescription}>{slide.description}</Text>
        </View>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {/* Pagination Pips */}
        <View style={styles.paginationRow}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentSlideIndex
                  ? [styles.paginationDotActive, { backgroundColor: slide.accentColor }]
                  : styles.paginationDotInactive,
              ]}
            />
          ))}
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: slide.accentColor }]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.actionButtonText,
              { color: slide.accentColor === Colors.tertiary ? Colors.primaryContainer : Colors.white },
            ]}
          >
            {currentSlideIndex === slides.length - 1 ? 'GET STARTED' : 'PROCEED'}
          </Text>
          <MaterialCommunityIcons
            name="arrow-right"
            size={20}
            color={slide.accentColor === Colors.tertiary ? Colors.primaryContainer : Colors.white}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.marginMobile,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  topLogoText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 2,
  },
  skipButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skipButtonText: {
    fontSize: 12,
    fontFamily: 'Courier',
    color: Colors.onSurfaceVariant,
    letterSpacing: 1.5,
  },
  cardWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 16,
  },
  tacticalCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: 24,
    alignItems: 'center',
    position: 'relative',
  },
  cornerBracket: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderColor: Colors.primary,
  },
  bracketTopLeft: {
    top: 8,
    left: 8,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  bracketTopRight: {
    top: 8,
    right: 8,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  bracketBottomLeft: {
    bottom: 8,
    left: 8,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  bracketBottomRight: {
    bottom: 8,
    right: 8,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  iconCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: Colors.surfaceContainer,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  slideBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    marginBottom: 16,
  },
  slideBadgeText: {
    fontSize: 10,
    fontFamily: 'Courier',
    fontWeight: '700',
    letterSpacing: 1,
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 12,
  },
  slideDescription: {
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomControls: {
    marginBottom: 28,
    gap: 20,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  paginationDot: {
    height: 6,
    borderRadius: 3,
  },
  paginationDotActive: {
    width: 28,
  },
  paginationDotInactive: {
    width: 8,
    backgroundColor: Colors.outlineVariant,
  },
  actionButton: {
    height: 52,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'Courier',
    letterSpacing: 1.5,
  },
});
