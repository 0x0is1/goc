import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '@contexts/ThemeContext';
import { NavBar } from '@components/common/NavBar';
import { EmptyState } from '@components/common/EmptyState';
import { FAB } from '@components/common/FAB';
import { SnakeCard } from '@components/snakes/SnakeCard';
import { getCancelledPersons } from '@services/api';
import { CancelledPerson } from '@appTypes/index';
import { DSText } from '@ds/Text';
import { DSSkeletonCard } from '@ds/Skeleton';
import { router, useFocusEffect } from 'expo-router';
import { useFeedback } from '@contexts/FeedbackContext';

export default function SnakesScreen() {
    const { tokens, colorMode } = useTheme();
    const { playTick } = useFeedback();
    const initialLoad = useRef(true);
    const [persons, setPersons] = useState<CancelledPerson[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [sort, setSort] = useState<'latest' | 'top'>('latest');
    const [cursor, setCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);

    const fetchData = useCallback(async (isRefreshing = false) => {
        if (isRefreshing) setRefreshing(true);
        else setLoading(true);

        try {
            const currentCursor = isRefreshing ? undefined : cursor || undefined;
            const result = await getCancelledPersons(currentCursor, sort, undefined, isRefreshing);

            if (isRefreshing) {
                setPersons(result.persons);
            } else {
                setPersons(prev => [...prev, ...result.persons]);
            }

            setCursor(result.cursor);
            setHasMore(result.hasMore);
        } catch (err) {
            console.error('Failed to fetch snakes:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [cursor, sort]);

    // Initial load and sort-change reload
    useEffect(() => {
        setPersons([]);
        setCursor(null);
        initialLoad.current = true; // Mark as just mounted so focus doesn't double-fetch
        fetchData(true);
    }, [sort]);

    // Re-fetch when returning from snake-enlist (create/edit)
    useFocusEffect(
        useCallback(() => {
            if (initialLoad.current) {
                initialLoad.current = false;
                return; // Skip on initial mount - useEffect above already fetches
            }
            setPersons([]);
            setCursor(null);
            fetchData(true);
        }, [sort])
    );

    const handleRefresh = () => fetchData(true);
    const handleLoadMore = () => {
        if (hasMore && !loading) fetchData();
    };

    const renderHeader = () => (
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
                    onPress={() => {
                        playTick();
                        setSort('latest');
                    }}
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
                    onPress={() => {
                        playTick();
                        setSort('top');
                    }}
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
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: tokens.colors.background }}>
            <NavBar title="Snakes in the Ganges" showInfo={true} />

            {loading && persons.length === 0 ? (
                <View style={{ gap: 0 }}>
                    {renderHeader()}
                    <DSSkeletonCard />
                    <DSSkeletonCard />
                    <DSSkeletonCard />
                </View>
            ) : (
                <FlatList
                    data={persons}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <SnakeCard
                            person={item}
                            onRefresh={handleRefresh}
                        />
                    )}
                    ListHeaderComponent={renderHeader}
                    ListEmptyComponent={
                        <View style={{ marginTop: 100 }}>
                            <EmptyState
                                message="No snakes found in the archive."
                            />
                        </View>
                    }
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor={tokens.colors.accent}
                        />
                    }
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={
                        <View style={{ paddingVertical: 20 }}>
                            {loading && persons.length > 0 && (
                                <ActivityIndicator size="small" color={tokens.colors.accent} />
                            )}
                        </View>
                    }
                />
            )}

            <FAB
                onPress={() => router.push('/snake-enlist')}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    listContent: {
        paddingBottom: 100,
    },
    filterBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
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
});
