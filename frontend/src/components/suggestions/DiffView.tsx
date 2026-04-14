import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DSText } from '@ds/Text';
import { useTheme } from '@contexts/ThemeContext';

interface DiffViewProps {
    label: string;
    original: any;
    suggested: any;
}

export const DiffView: React.FC<DiffViewProps> = ({ label, original, suggested }) => {
    const { tokens } = useTheme();
    const isChanged = JSON.stringify(original) !== JSON.stringify(suggested);

    if (!isChanged) return null;

    const renderValue = (val: any) => {
        if (Array.isArray(val)) {
            return val.map(v => (typeof v === 'string' && v.startsWith('data:image/')) ? '[Image]' : String(v)).join(', ');
        }
        if (typeof val === 'string' && val.startsWith('data:image/')) {
            return '[Image Data]';
        }
        if (typeof val === 'boolean') return val ? 'Yes' : 'No';
        return String(val || 'None');
    };

    return (
        <View style={styles.container}>
            <DSText size="sm" weight="bold" color="textMuted" style={styles.label}>
                {label.toUpperCase()}
            </DSText>

            <View style={[styles.diffBox, { borderColor: tokens.colors.border }]}>
                <View style={[styles.line, { backgroundColor: tokens.colors.danger + '20' }]}>
                    <DSText size="sm" color="danger" style={{ flex: 1 }}>
                        - {renderValue(original)}
                    </DSText>
                </View>

                <View style={[styles.line, { backgroundColor: tokens.colors.success + '20' }]}>
                    <DSText size="sm" color="success" style={{ flex: 1 }}>
                        + {renderValue(suggested)}
                    </DSText>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    diffBox: {
        borderWidth: 1,
        borderRadius: 8,
        overflow: 'hidden',
    },
    line: {
        padding: 10,
        flexDirection: 'row',
    }
});
