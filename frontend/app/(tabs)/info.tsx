import React from 'react';
import { View, ScrollView, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@contexts/ThemeContext';
import { DSText } from '@ds/Text';
import { DSDivider } from '@ds/Divider';
import { DSButton } from '@ds/Button';
import { NavBar } from '@components/common/NavBar';

export default function InfoScreen() {
    const { tokens } = useTheme();

    const handleContact = () => {
        Linking.openURL('mailto:0x0is1@proton.me');
    };

    const handleFeedback = () => {
        Linking.openURL('https://forms.gle/L5mRtpaS7YBXTByY9');
    };

    const Section = ({ title, icon, children }: { title: string, icon: any, children: React.ReactNode }) => (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Ionicons name={icon} size={22} color={tokens.colors.accent} />
                <DSText size="lg" weight="bold" color="textPrimary" style={{ marginLeft: 8 }}>
                    {title}
                </DSText>
            </View>
            {children}
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: tokens.colors.background }}>
            <NavBar title="Information" />
            <ScrollView
                contentContainerStyle={[
                    styles.content,
                    { paddingBottom: tokens.layout.screenPaddingBottom }
                ]}
            >
                <Section title="About Black Hands" icon="information-circle-outline">
                    <DSText size="base" color="textMuted" style={styles.paragraph}>
                        Black Hands is a community platform for exposing and archiving public figures — politicians, influencers, creators, and others — who have made statements or taken actions that deserve public scrutiny.
                    </DSText>
                    <DSText size="base" color="textMuted" style={styles.paragraph}>
                        The Posts feed curates real, sourced controversies from across the web. The Snakes list is a community-maintained archive of individuals who have been publicly called out. Vote, discuss, and hold them accountable.
                    </DSText>
                    <DSText size="base" color="textMuted" style={styles.paragraph}>
                        Nothing gets buried here. If it happened, it&apos;s recorded.
                    </DSText>
                </Section>

                <DSDivider style={styles.divider} />

                <Section title="Contact Us" icon="mail-outline">
                    <DSText size="base" color="textMuted" style={styles.paragraph}>
                        Have a question or a legal inquiry? Our team is here to help.
                    </DSText>
                    <DSButton
                        label="Send an Email"
                        onPress={handleContact}
                        variant="outline"
                        leftIcon={<Ionicons name="send-outline" size={18} color={tokens.colors.textPrimary} />}
                    />
                </Section>

                <DSDivider style={styles.divider} />

                <Section title="Feedback" icon="chatbubble-ellipses-outline">
                    <DSText size="base" color="textMuted" style={styles.paragraph}>
                        Help us improve! We&apos;re in active development and would love to hear your thoughts on new features or bugs.
                    </DSText>
                    <DSButton
                        label="Give Feedback"
                        onPress={handleFeedback}
                        variant="solid"
                    />
                </Section>

                <View style={styles.footer}>
                    <DSText size="xs" color="textMuted">Version 0.1.4</DSText>
                    <DSText size="xs" color="textMuted">© 2026 Algocry</DSText>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: 20,
    },
    section: {
        marginBottom: 8,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    paragraph: {
        lineHeight: 24,
        marginBottom: 16,
    },
    divider: {
        marginVertical: 24,
    },
    footer: {
        marginTop: 40,
        alignItems: 'center',
        gap: 4,
    }
});
