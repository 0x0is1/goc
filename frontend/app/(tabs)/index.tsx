import React, { useCallback } from 'react';
import { View, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeFeed() {
    const { tokens } = useTheme();
    const { posts, loading, error, refresh, loadMore } = useFeed();
    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const [isOffline, setIsOffline] = React.useState(false);
    const insets = useSafeAreaInsets();

    React.useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state) => {
            setIsOffline(!state.isConnected);
        });
        return unsubscribe;
    }, []);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await refresh();
        setIsRefreshing(false);
    }, [refresh]);

    const appBarStyle = {
        backgroundColor: tokens.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: tokens.colors.border,
        paddingHorizontal: tokens.spacing.lg,
        paddingTop: insets.top + tokens.spacing.sm,
        paddingBottom: tokens.spacing.md,
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: tokens.spacing.sm,
    };

    const screenStyle = {
        flex: 1,
        backgroundColor: tokens.colors.background,
    };

    const renderItem = useCallback(({ item }: { item: Post }) => <FeedCard post={item} />, []);
    const keyExtractor = useCallback((item: Post) => item.id, []);
    const separator = useCallback(() => <View style={{ height: 0 }} />, []);

    if (loading && posts.length === 0) {
        return (
            <View style={screenStyle}>
                <View style={appBarStyle}>
                    <Ionicons name="search" size={22} color={tokens.colors.accent} />
                    <DSText size="md" weight="bold" color="textPrimary">Gems of Congress</DSText>
                </View>
                <DSSkeletonCard />
                <DSSkeletonCard />
                <DSSkeletonCard />
            </View>
        );
    }

    if (error && posts.length === 0) {
        return (
            <View style={screenStyle}>
                <View style={appBarStyle}>
                    <Ionicons name="search" size={22} color={tokens.colors.accent} />
                    <DSText size="md" weight="bold" color="textPrimary">Gems of Congress</DSText>
                </View>
                <ErrorState message={error} onRetry={refresh} />
            </View>
        );
    }

    return (
        <View style={screenStyle}>
            <View style={appBarStyle}>
                <Ionicons name="search" size={22} color={tokens.colors.accent} />
                <DSText size="md" weight="bold" color="textPrimary">Gems of Congress</DSText>
            </View>
            {isOffline && <OfflineBanner />}
            <FlatList
                data={posts}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                ItemSeparatorComponent={separator}
                ListEmptyComponent={<EmptyState />}
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
                contentContainerStyle={{ flexGrow: 1 }}
            />
            <FAB />
        </View>
    );
}

