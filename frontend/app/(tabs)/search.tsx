import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useTheme } from '@contexts/ThemeContext';
import { NavBar } from '@components/common/NavBar';
import { EmptyState } from '@components/common/EmptyState';
import { FeedCard } from '@components/feed/FeedCard';
import { SnakeListItem } from '@components/snakes/SnakeListItem';
import { getFeed, getCancelledPersons } from '@services/api';
import { Post, CancelledPerson } from '@appTypes/index';
import { DSText } from '@ds/Text';
import { Ionicons } from '@expo/vector-icons';
import { useFeedback } from '@contexts/FeedbackContext';
import Animated, { FadeIn } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

type SearchTab = 'archives' | 'snakes';

export default function SearchScreen() {
    const { tokens } = useTheme();
    const { playTick } = useFeedback();
    const [query, setQuery] = useState('');
    const [activeTab, setActiveTab] = useState<SearchTab>('archives');

    // Archives state
    const [posts, setPosts] = useState<Post[]>([]);
    const [archiveCursor, setArchiveCursor] = useState<string | null>(null);
    const [archiveHasMore, setArchiveHasMore] = useState(false);

    // Snakes state
    const [snakes, setSnakes] = useState<CancelledPerson[]>([]);
    const [snakeCursor, setSnakeCursor] = useState<string | null>(null);
    const [snakeHasMore, setSnakeHasMore] = useState(false);

    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    const searchArchives = async (q: string, cursor?: string) => {
        if (!cursor) setSearching(true);
        else setLoading(true);

        try {
            const result = await getFeed(cursor, 'latest', undefined, true, q);
            if (!cursor) setPosts(result.posts);
            else setPosts(prev => [...prev, ...result.posts]);
            setArchiveCursor(result.cursor);
            setArchiveHasMore(result.hasMore);
        } catch (err) {
            console.log('Archive search failed:', err);
        } finally {
            setSearching(false);
            setLoading(false);
        }
    };

    const searchSnakes = async (q: string, cursor?: string) => {
        if (!cursor) setSearching(true);
        else setLoading(true);

        try {
            const result = await getCancelledPersons(cursor, 'latest', undefined, true, q);
            if (!cursor) setSnakes(result.persons);
            else setSnakes(prev => [...prev, ...result.persons]);
            setSnakeCursor(result.cursor);
            setSnakeHasMore(result.hasMore);
        } catch (err) {
            console.log('Snake search failed:', err);
        } finally {
            setSearching(false);
            setLoading(false);
        }
    };

    const handleSearch = (text: string) => {
        setQuery(text);
        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current as any);
        }

        if (!text.trim()) {
            setPosts([]);
            setSnakes([]);
            setSearching(false);
            return;
        }

        searchTimeout.current = setTimeout(() => {
            if (activeTab === 'archives') searchArchives(text);
            else searchSnakes(text);
        }, 500);
    };

    useEffect(() => {
        if (query.trim()) {
            if (activeTab === 'archives' && posts.length === 0) searchArchives(query);
            if (activeTab === 'snakes' && snakes.length === 0) searchSnakes(query);
        }
    }, [activeTab]);

    const handleLoadMore = () => {
        if (loading || searching || !query.trim()) return;
        if (activeTab === 'archives' && archiveHasMore) {
            searchArchives(query, archiveCursor!);
        } else if (activeTab === 'snakes' && snakeHasMore) {
            searchSnakes(query, snakeCursor!);
        }
    };

    const renderTabButton = (tab: SearchTab, label: string) => (
        <TouchableOpacity
            onPress={() => {
                playTick();
                setActiveTab(tab);
            }}
            style={[
                styles.tabButton,
                { borderBottomColor: activeTab === tab ? tokens.colors.accent : 'transparent' }
            ]}
        >
            <DSText
                size="sm"
                weight="bold"
                color={activeTab === tab ? 'textPrimary' : 'textMuted'}
            >
                {label.toUpperCase()}
            </DSText>
        </TouchableOpacity>
    );

    return (
        <View style={{ flex: 1, backgroundColor: tokens.colors.background }}>
            <NavBar title="Search Knowledge" />

            <View style={styles.searchHeader}>
                <View style={[styles.searchBar, { backgroundColor: tokens.colors.surface2 }]}>
                    <Ionicons name="search" size={20} color={tokens.colors.textMuted} />
                    <TextInput
                        value={query}
                        onChangeText={handleSearch}
                        placeholder="Search archives or snakes..."
                        placeholderTextColor={tokens.colors.textMuted}
                        style={[styles.input, { color: tokens.colors.textPrimary }]}
                        autoFocus
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => handleSearch('')}>
                            <Ionicons name="close-circle" size={20} color={tokens.colors.textMuted} />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.tabs}>
                    {renderTabButton('archives', `Archives (${posts.length})`)}
                    {renderTabButton('snakes', `Snakes (${snakes.length})`)}
                </View>
            </View>

            {searching ? (
                <View style={styles.center}>
                    <ActivityIndicator color={tokens.colors.accent} />
                    <DSText size="sm" color="textMuted" style={{ marginTop: 12 }}>
                        Searching globally...
                    </DSText>
                </View>
            ) : (
                <FlatList
                    data={(activeTab === 'archives' ? posts : snakes) as any[]}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item, index }) => (
                        <Animated.View entering={FadeIn}>
                            {activeTab === 'archives' ? (
                                <FeedCard post={item as Post} />
                            ) : (
                                <SnakeListItem person={item as CancelledPerson} rank={index + 1} />
                            )}
                        </Animated.View>
                    )}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    ListEmptyComponent={
                        !searching ? (
                            <View style={{ marginTop: 60 }}>
                                <EmptyState
                                    message={query.trim() ? "No results found for your search." : "Start typing to search across the database."}
                                    icon={query.trim() ? "search-outline" : "rocket-outline"}
                                />
                            </View>
                        ) : null
                    }
                    ListFooterComponent={
                        loading ? (
                            <View style={{ padding: 20 }}>
                                <ActivityIndicator color={tokens.colors.accent} />
                            </View>
                        ) : null
                    }
                    contentContainerStyle={styles.listContent}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    searchHeader: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 4,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        height: 48,
        borderRadius: 12,
        gap: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontFamily: 'PlusJakartaSans_500Medium',
    },
    tabs: {
        flexDirection: 'row',
        marginTop: 16,
        gap: 24,
    },
    tabButton: {
        paddingBottom: 8,
        borderBottomWidth: 2,
    },
    listContent: {
        paddingTop: 12,
        paddingBottom: 100,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
