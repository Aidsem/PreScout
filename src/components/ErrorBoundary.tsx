import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing } from '../theme/colors';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Unhandled error caught by ErrorBoundary:', error, info.componentStack);
  }

  private reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <MaterialCommunityIcons name="alert-octagon-outline" size={48} color={Colors.error} />
          <Text style={styles.title}>SYSTEM FAULT</Text>
          <Text style={styles.message}>
            PRESCOUT hit an unexpected error and this screen couldn't render.
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.reset}>
            <Text style={styles.buttonText}>RESET</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    gap: Spacing.md,
  },
  title: {
    color: Colors.onBackground,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
  message: {
    color: Colors.onSurfaceVariant,
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.tertiary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
  },
  buttonText: {
    color: Colors.onTertiary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
