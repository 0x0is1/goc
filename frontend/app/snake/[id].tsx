import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Image, TouchableOpacity, Alert, Dimensions, Modal } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@contexts/ThemeContext';
import { useCancelledPerson } from '@hooks/useCancelledPerson';
import { DSText } from '@ds/Text';
import { DSDivider } from '@ds/Divider';
import { DSSkeletonCard } from '@ds/Skeleton';
import { DSBadge } from '@ds/Badge';
import { ErrorState } from '@components/common/ErrorState';
import { formatFullDate } from '@utils/formatters';
import { NavBar } from '@components/common/NavBar';
import { useFeedback } from '@contexts/FeedbackContext';
import { useAuthContext } from '@contexts/AuthContext';
import { deleteCancelledPerson } from '@services/api';
import { MarkdownBody } from '@components/common/MarkdownBody';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence, FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function SnakeDetail() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { tokens, colorMode } = useTheme();
    const { user } = useAuthContext();
    const { person, loading, error, userVote, handleVote } = useCancelledPerson(id ?? '');
    const { playClick, playTick, playSuccess } = useFeedback();
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const upScale = useSharedValue(1);
    const downScale = useSharedValue(1);

    const upStyle = useAnimatedStyle(() => ({ transform: [{ scale: upScale.value }] }));
    const downStyle = useAnimatedStyle(() => ({ transform: [{ scale: downScale.value }] }));

    const handleVoteWithAnimation = async (type: 'up' | 'down') => {
        const scale = type === 'up' ? upScale : downScale;
        scale.value = withSequence(
            withSpring(1.1, { damping: 12, stiffness: 250 }),
            withSpring(1, { damping: 15, stiffness: 200 })
        );

        playSuccess();

        try {
            await handleVote(type);
        } catch (err) {
            Alert.alert('Error', 'Failed to cast vote.');
        }
    };

    const handleDelete = () => {
        playTick();
        Alert.alert('Delete Entry', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteCancelledPerson(id!);
                        router.back();
                    } catch (err) {
                        Alert.alert('Error', 'Failed to delete.');
                    }
                }
            }
        ]);
    };

    if (loading && !person) {
        return (
            <View style={{ flex: 1, backgroundColor: tokens.colors.background }}>
                <NavBar title="Loading..." showBack />
                <View style={{ padding: 16 }}>
                    <DSSkeletonCard />
                </View>
            </View>
        );
    }

    if (error || !person) {
        return (
            <View style={{ flex: 1, backgroundColor: tokens.colors.background }}>
                <NavBar title="Snake missing" showBack />
                <ErrorState message={error ?? 'Not found'} onRetry={() => router.back()} />
            </View>
        );
    }

    const upActive = userVote?.type === 'up';
    const downActive = userVote?.type === 'down';

    return (
        <View style={{ flex: 1, backgroundColor: tokens.colors.background }}>
            <NavBar title="Snake Profile" showBack />

            <ScrollView
                contentContainerStyle={{ paddingBottom: tokens.layout.screenPaddingBottom + 100 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Header */}
                <View style={[styles.hero, { backgroundColor: tokens.colors.surface }]}>
                    <View style={styles.heroContent}>
                        {person.avatar ? (
                            <Image source={{ uri: person.avatar }} style={styles.bigAvatar} />
                        ) : (
                            <View style={[styles.bigAvatarPlaceholder, { backgroundColor: tokens.colors.surface2 }]}>
                                <Ionicons name="person" size={50} color={tokens.colors.textMuted} />
                            </View>
                        )}

                        <View style={styles.heroText}>
                            <DSText size="2xl" weight="extraBold" color="textPrimary">
                                {person.name}
                            </DSText>
                            <View style={[styles.profBadge, { backgroundColor: tokens.colors.surface2 }]}>
                                <Ionicons name="briefcase-outline" size={14} color={tokens.colors.accent} />
                                <DSText size="sm" weight="extraBold" color="accent">
                                    {person.profession.toUpperCase()}
                                </DSText>
                            </View>
                            <View style={styles.heroBadges}>
                                <DSBadge
                                    label={person.isIndian ? "INDIAN NATIVE" : "NON-INDIAN"}
                                    variant={person.isIndian ? "solid" : "outline"}
                                    color={person.isIndian ? "accent" : "textMuted"}
                                />
                                {user?.uid === person.authorId && (
                                    <TouchableOpacity
                                        onPress={() => router.push({ pathname: '/snake-enlist', params: { editId: person.id } })}
                                        style={styles.editBtn}
                                    >
                                        <Ionicons name="pencil" size={14} color={tokens.colors.accent} />
                                        <DSText size="xs" weight="bold" color="accent">EDIT</DSText>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </View>
                </View>

                {/* Statistics hidden as they are moved to buttons */}

                <View style={styles.body}>
                    {/* Description Section */}
                    <Animated.View entering={FadeInDown.delay(100)}>
                        <DSText size="sm" weight="extraBold" color="textMuted" style={styles.sectionTitle}>
                            MISSION & ACTIONS
                        </DSText>
                        <View style={[styles.contentCard, { backgroundColor: tokens.colors.surface }]}>
                            <MarkdownBody>{person.description}</MarkdownBody>
                        </View>
                    </Animated.View>

                    {/* Image Gallery */}
                    {person.images && person.images.length > 0 && (
                        <Animated.View entering={FadeInDown.delay(200)} style={styles.section}>
                            <DSText size="sm" weight="extraBold" color="textMuted" style={styles.sectionTitle}>
                                EVIDENCE & MEDIA
                            </DSText>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gallery}>
                                {person.images.map((img, i) => (
                                    <TouchableOpacity key={i} onPress={() => setSelectedImage(img)}>
                                        <Image source={{ uri: img }} style={styles.galleryImage} />
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </Animated.View>
                    )}

                    {/* Reference Links */}
                    {person.postLinks && person.postLinks.length > 0 && (
                        <Animated.View entering={FadeInDown.delay(300)} style={styles.section}>
                            <DSText size="sm" weight="extraBold" color="textMuted" style={styles.sectionTitle}>
                                REFERENCE LINKS
                            </DSText>
                            <View style={styles.linkGrid}>
                                {person.postLinks.map((link, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        style={[styles.linkCard, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}
                                        onPress={() => router.push(link as any)}
                                    >
                                        <Ionicons name="link" size={18} color={tokens.colors.accent} />
                                        <DSText size="sm" weight="bold" color="textPrimary" numberOfLines={1} style={{ flex: 1 }}>
                                            {link}
                                        </DSText>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </Animated.View>
                    )}

                    {/* Author Meta */}
                    <View style={styles.authorMeta}>
                        <DSText size="xs" color="textMuted">
                            Added by {person.isAnonymous ? 'Anonymous' : `@${person.authorName}`} on {formatFullDate(person.createdAt)}
                        </DSText>
                        {user?.uid === person.authorId && (
                            <TouchableOpacity onPress={handleDelete}>
                                <DSText size="xs" weight="bold" color="danger">DELETE ENTRY</DSText>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Floating Vote Bar */}
            <View style={[styles.bottomBar, { backgroundColor: tokens.colors.background, borderTopColor: tokens.colors.border, paddingBottom: tokens.layout.screenPaddingBottom }]}>
                <View style={styles.voteContainer}>
                    <Animated.View style={[upStyle, { flex: 1 }]}>
                        <TouchableOpacity
                            onPress={() => handleVoteWithAnimation('up')}
                            style={[styles.bigVoteBtn, { backgroundColor: upActive ? tokens.colors.accent : tokens.colors.surface2 }]}
                        >
                            <Ionicons name={upActive ? "arrow-up-circle" : "arrow-up-circle-outline"} size={22} color={upActive ? tokens.colors.accentForeground : tokens.colors.textMuted} />
                            <DSText size="sm" weight="bold" color={upActive ? 'accentForeground' : 'textMuted'}>{person.upvotes}</DSText>
                        </TouchableOpacity>
                    </Animated.View>

                    <Animated.View style={[downStyle, { flex: 1 }]}>
                        <TouchableOpacity
                            onPress={() => handleVoteWithAnimation('down')}
                            style={[styles.bigVoteBtn, { backgroundColor: downActive ? tokens.colors.danger : tokens.colors.surface2 }]}
                        >
                            <Ionicons name={downActive ? "arrow-down-circle" : "arrow-down-circle-outline"} size={22} color={downActive ? tokens.colors.accentForeground : tokens.colors.textMuted} />
                            <DSText size="sm" weight="bold" color={downActive ? 'accentForeground' : 'textMuted'}>{person.downvotes}</DSText>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </View>

            {/* Image Detail Modal */}
            <Modal
                visible={!!selectedImage}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSelectedImage(null)}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={styles.modalClose}
                        onPress={() => setSelectedImage(null)}
                    >
                        <Ionicons name="close" size={32} color="white" />
                    </TouchableOpacity>
                    {selectedImage && (
                        <Image
                            source={{ uri: selectedImage }}
                            style={styles.modalImage}
                            resizeMode="contain"
                        />
                    )}
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    hero: {
        padding: 16,
        paddingTop: 8,
        paddingBottom: 24,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        zIndex: 10,
    },
    heroContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
    },
    bigAvatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: '#fff',
    },
    bigAvatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroText: {
        flex: 1,
        gap: 4,
    },
    profBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        marginTop: 6,
        marginBottom: 4,
    },
    heroBadges: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 4,
    },
    editBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statsRow: {
        display: 'none',
    },
    statCard: {
        flex: 1,
        padding: 12,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    body: {
        padding: 16,
        marginTop: 0,
    },
    sectionTitle: {
        marginBottom: 10,
        marginLeft: 4,
        letterSpacing: 0.5,
    },
    contentCard: {
        padding: 16,
        borderRadius: 20,
        marginBottom: 24,
    },
    section: {
        marginBottom: 24,
    },
    gallery: {
        paddingVertical: 4,
    },
    galleryImage: {
        width: width * 0.7,
        aspectRatio: 16 / 9,
        borderRadius: 16,
        marginRight: 12,
    },
    linkGrid: {
        gap: 8,
    },
    linkCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
    },
    authorMeta: {
        marginTop: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
        opacity: 0.6,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        borderTopWidth: 1,
    },
    voteContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    bigVoteBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 10,
        borderRadius: 12,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalClose: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 100,
        padding: 10,
    },
    modalImage: {
        width: width,
        height: width,
    },
});
