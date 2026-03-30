import React, { useCallback, useEffect, useState } from 'react';
import { View, FlatList, RefreshControl, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { useScrollToTop } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import { useTheme } from '@contexts/ThemeContext';
import { DSText } from '@ds/Text';
import { DSDivider } from '@ds/Divider';
import { DSSkeletonCard } from '@ds/Skeleton';
import { FeedCard } from '@components/feed/FeedCard';
import { EmptyState } from '@components/common/EmptyState';
import { ErrorState } from '@components/common/ErrorState';
import { OfflineBanner } from '@components/common/OfflineBanner';
import { FAB } from '@components/common/FAB';
import { useFeed } from '@hooks/useFeed';
import { Post } from '@appTypes/index';
import { NavBar } from '@components/common/NavBar';

export default function HomeFeed() {
    const { tokens, colorMode } = useTheme();
    const { tag, sort: sortParam } = useLocalSearchParams<{ tag?: string, sort?: string }>();
    const initialSort = (sortParam === 'top' ? 'top' : 'latest') as 'latest' | 'top';

    const { posts, loading, error, refresh, loadMore, sort, tag: activeTag, hasMore } = useFeed(initialSort, tag || null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [isOffline, setIsOffline] = useState(false);
    const flatListRef = React.useRef<FlatList>(null);
    useScrollToTop(flatListRef);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state) => {
            setIsOffline(!state.isConnected);
        });
        return unsubscribe;
    }, []);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        setRefreshKey(prev => prev + 1);
        await refresh(true);
        setIsRefreshing(false);
    }, [refresh]);

    const navigation = require('@react-navigation/native').useNavigation();

    useEffect(() => {
        const unsubscribe = navigation.addListener('tabPress', (e: any) => {
            const isFocused = navigation.isFocused();
            if (isFocused && !tag) {
                flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
                handleRefresh();
            }
        });
        return unsubscribe;
    }, [navigation, handleRefresh, tag]);

    const screenStyle = {
        flex: 1,
        backgroundColor: tokens.colors.background,
    };

    const renderItem = useCallback(({ item }: { item: Post }) => (
        <FeedCard post={item} refreshKey={refreshKey} />
    ), [refreshKey]);

    const keyExtractor = useCallback((item: Post) => item.id, []);

    if (loading && posts.length === 0) {
        return (
            <View style={screenStyle}>
                <NavBar />
                <View style={{ gap: 0 }}>
                    <DSSkeletonCard />
                    <DSSkeletonCard />
                    <DSSkeletonCard />
                </View>
            </View>
        );
    }

    if (error && posts.length === 0) {
        return (
            <View style={screenStyle}>
                <NavBar />
                <ErrorState message={error} onRetry={refresh} />
            </View>
        );
    }

    return (
        <View style={screenStyle}>
            <NavBar showInfo={true} />
            {isOffline && <OfflineBanner />}

            <View style={[styles.filterBar, {
                backgroundColor: tokens.colors.surface,
                borderBottomColor: tokens.colors.border
            }]}>
                <View style={[styles.sortContainer, { backgroundColor: tokens.colors.surface2 }]}>
                    <TouchableOpacity
                        style={[
                            styles.sortButton,
                            sort === 'latest' && { backgroundColor: tokens.colors.textPrimary }
                        ]}
                        onPress={() => router.setParams({ sort: 'latest' })}
                    >
                        <DSText
                            size="xs"
                            weight="bold"
                            color={sort === 'latest' ? (colorMode === 'dark' ? 'background' : 'surface') : 'textMuted'}
                        >
                            LATEST
                        </DSText>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.sortButton,
                            sort === 'top' && { backgroundColor: tokens.colors.textPrimary }
                        ]}
                        onPress={() => router.setParams({ sort: 'top' })}
                    >
                        <DSText
                            size="xs"
                            weight="bold"
                            color={sort === 'top' ? (colorMode === 'dark' ? 'background' : 'surface') : 'textMuted'}
                        >
                            TOP
                        </DSText>
                    </TouchableOpacity>
                </View>

                {activeTag && (
                    <TouchableOpacity
                        style={[styles.activeTagBadge, {
                            backgroundColor: tokens.colors.surface2,
                            borderColor: tokens.colors.border
                        }]}
                        onPress={() => router.setParams({ tag: undefined })}
                    >
                        <DSText size="xs" weight="bold" color="accent">
                            {activeTag.replace(/^#/, '').toUpperCase()}
                        </DSText>
                        <Ionicons name="close-circle" size={14} color={tokens.colors.accent} />
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                ref={flatListRef}
                data={posts}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                ListEmptyComponent={<EmptyState />}
                ListFooterComponent={
                    <View style={{ paddingVertical: 20 }}>
                        {loading && posts.length > 0 ? (
                            <ActivityIndicator size="small" color={tokens.colors.accent} />
                        ) : !hasMore && posts.length > 0 ? (
                            <View style={{ alignItems: 'center', padding: 20 }}>
                                <DSText size="sm" color="textMuted" weight="medium">
                                    YOU&apos;VE REACHED THE END OF THE ARCHIVE
                                </DSText>
                            </View>
                        ) : null}
                    </View>
                }
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        tintColor={tokens.colors.accent}
                        colors={[tokens.colors.accent]}
                    />
                }
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                removeClippedSubviews={Platform.OS === 'android'}
                initialNumToRender={5}
                maxToRenderPerBatch={5}
                windowSize={10}
                contentContainerStyle={{
                    flexGrow: 1,
                    paddingBottom: tokens.layout.screenPaddingBottom
                }}
            />
            <FAB />
        </View>
    );
}

const styles = StyleSheet.create({
    filterBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
        borderBottomWidth: 1,
    },
    sortContainer: {
        flexDirection: 'row',
        borderRadius: 20,
        padding: 2,
    },
    sortButton: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 18,
    },
    activeTagBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 16,
        borderWidth: 1,
    }
});
