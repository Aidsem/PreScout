import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing } from '../theme/colors';

// Top App Header
export interface TacticalHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  onProfilePress?: () => void;
}

export const TacticalHeader: React.FC<TacticalHeaderProps> = ({
  title = 'PRESCOUT',
  subtitle,
  showBack = false,
  onBack,
  rightAction,
  onProfilePress,
}) => {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerLeft}>
        {showBack ? (
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.onSurface} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerIconWrapper}>
            <MaterialCommunityIcons name="access-point-network" size={24} color={Colors.tertiary} />
          </View>
        )}
        <View>
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
        </View>
      </View>

      <View style={styles.headerRight}>
        {rightAction ? (
          rightAction
        ) : (
          <TouchableOpacity
            style={styles.profileButton}
            onPress={onProfilePress}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="account-circle-outline" size={26} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// Tactical Badge
export interface TacticalBadgeProps {
  label: string;
  variant?: 'critical' | 'high' | 'normal' | 'live' | 'available' | 'mission' | 'charging' | 'info';
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  size?: 'sm' | 'md';
}

export const TacticalBadge: React.FC<TacticalBadgeProps> = ({
  label,
  variant = 'normal',
  icon,
  size = 'md',
}) => {
  const getBadgeColors = () => {
    switch (variant) {
      case 'critical':
        return {
          bg: 'rgba(216, 120, 109, 0.15)',
          border: Colors.error,
          text: Colors.error,
          iconColor: Colors.error,
        };
      case 'high':
        return {
          bg: 'rgba(215, 168, 75, 0.15)',
          border: Colors.warning,
          text: Colors.warning,
          iconColor: Colors.warning,
        };
      case 'live':
      case 'available':
      case 'normal':
        return {
          bg: 'rgba(184, 216, 106, 0.14)',
          border: Colors.tertiary,
          text: Colors.tertiary,
          iconColor: Colors.tertiary,
        };
      case 'mission':
        return {
          bg: 'rgba(248, 113, 113, 0.15)',
          border: Colors.secondary,
          text: Colors.secondary,
          iconColor: Colors.secondary,
        };
      case 'charging':
        return {
          bg: 'rgba(226, 232, 240, 0.15)',
          border: Colors.primaryFixed,
          text: Colors.primaryFixed,
          iconColor: Colors.primaryFixed,
        };
      case 'info':
      default:
        return {
          bg: 'rgba(248, 250, 252, 0.15)',
          border: Colors.outlineVariant,
          text: Colors.onSurface,
          iconColor: Colors.primary,
        };
    }
  };

  const c = getBadgeColors();
  const isSm = size === 'sm';

  return (
    <View
      style={[
        styles.badgeBase,
        {
          backgroundColor: c.bg,
          borderColor: c.border,
          paddingHorizontal: isSm ? 6 : 8,
          paddingVertical: isSm ? 2 : 4,
        },
      ]}
    >
      {icon && (
        <MaterialCommunityIcons
          name={icon}
          size={isSm ? 10 : 12}
          color={c.iconColor}
          style={{ marginRight: 4 }}
        />
      )}
      <Text
        style={[
          styles.badgeText,
          { color: c.text, fontSize: isSm ? 9 : 10 },
        ]}
      >
        {label.toUpperCase()}
      </Text>
    </View>
  );
};

// Tactical Metric Card
export interface TacticalMetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  variant?: 'green' | 'red' | 'white' | 'amber';
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const TacticalMetricCard: React.FC<TacticalMetricCardProps> = ({
  label,
  value,
  subValue,
  icon,
  variant = 'white',
  onPress,
  style,
}) => {
  const getValueColor = () => {
    switch (variant) {
      case 'green':
        return Colors.tertiary;
      case 'red':
        return Colors.error;
      case 'amber':
        return Colors.warning;
      case 'white':
      default:
        return Colors.white;
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'green':
        return 'rgba(184, 216, 106, 0.14)';
      case 'red':
        return 'rgba(216, 120, 109, 0.15)';
      case 'amber':
        return 'rgba(215, 168, 75, 0.15)';
      case 'white':
      default:
        return 'rgba(255, 255, 255, 0.08)';
    }
  };

  return (
    <TouchableOpacity
      style={[styles.metricCard, style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
      disabled={!onPress}
    >
      <Text style={styles.metricLabel}>{label.toUpperCase()}</Text>
      <View style={styles.metricValueRow}>
        <Text style={[styles.metricValue, { color: getValueColor() }]}>
          {value}
        </Text>
        {subValue && <Text style={styles.metricSubValue}>{subValue}</Text>}
      </View>
      <View style={styles.metricWatermarkIcon}>
        <MaterialCommunityIcons name={icon} size={36} color={getIconColor()} />
      </View>
    </TouchableOpacity>
  );
};

// Tactical Button
export interface TacticalButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'danger' | 'blue' | 'secondary' | 'ghost';
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
  fullWidth?: boolean;
}

export const TacticalButton: React.FC<TacticalButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  icon,
  style,
  labelStyle,
  disabled = false,
  fullWidth = true,
}) => {
  const getButtonStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          bg: Colors.secondaryContainer,
          border: 'rgba(255,255,255,0.15)',
          text: Colors.white,
        };
      case 'blue':
        return {
          bg: Colors.accentBlue,
          border: 'rgba(255,255,255,0.15)',
          text: Colors.white,
        };
      case 'secondary':
        return {
          bg: Colors.surfaceContainerHigh,
          border: Colors.outlineVariant,
          text: Colors.onSurface,
        };
      case 'ghost':
        return {
          bg: 'transparent',
          border: Colors.outlineVariant,
          text: Colors.onSurface,
        };
      case 'primary':
      default:
        return {
          bg: Colors.tertiary,
          border: Colors.tertiary,
          text: Colors.onTertiary,
        };
    }
  };

  const btn = getButtonStyles();

  return (
    <TouchableOpacity
      style={[
        styles.buttonBase,
        {
          backgroundColor: disabled ? Colors.surfaceVariant : btn.bg,
          borderColor: btn.border,
          width: fullWidth ? '100%' : 'auto',
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      {icon && (
        <MaterialCommunityIcons
          name={icon}
          size={18}
          color={disabled ? Colors.outline : btn.text}
          style={{ marginRight: 8 }}
        />
      )}
      <Text
        style={[
          styles.buttonLabel,
          { color: disabled ? Colors.outline : btn.text },
          labelStyle,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

// HUD Targeting Reticle & Crosshair
export const CrosshairReticle: React.FC<{ size?: number }> = ({ size = 180 }) => {
  return (
    <View style={[styles.crosshairContainer, { width: size, height: size }]}>
      <View style={styles.reticleCircle} />
      <View style={styles.crosshairHorizontal} />
      <View style={styles.crosshairVertical} />
      <View style={styles.centerTargetPip} />
    </View>
  );
};

const styles = StyleSheet.create({
  // Header
  headerContainer: {
    height: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.marginMobile,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.tertiaryFixedDim,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    fontFamily: 'System',
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },

  // Badge
  badgeBase: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontFamily: 'System',
    fontWeight: '700',
    letterSpacing: 0.6,
  },

  // Metric Card
  metricCard: {
    backgroundColor: Colors.surfaceContainer,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    position: 'relative',
    overflow: 'hidden',
  },
  metricLabel: {
    color: Colors.onSurfaceVariant,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'System',
    letterSpacing: 1,
    marginBottom: 4,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  metricValue: {
    fontSize: 26,
    fontWeight: '700',
    fontFamily: 'System',
    letterSpacing: -0.5,
  },
  metricSubValue: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    fontFamily: 'Courier',
  },
  metricWatermarkIcon: {
    position: 'absolute',
    right: 8,
    bottom: 6,
  },

  // Tactical Button
  buttonBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'System',
    letterSpacing: 1,
  },

  // Crosshair Reticle
  crosshairContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  reticleCircle: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(248, 250, 252, 0.35)',
  },
  crosshairHorizontal: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(248, 250, 252, 0.3)',
  },
  crosshairVertical: {
    position: 'absolute',
    height: '100%',
    width: 1,
    backgroundColor: 'rgba(248, 250, 252, 0.3)',
  },
  centerTargetPip: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.tertiary,
  },
});
