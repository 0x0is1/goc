import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Switch, ActivityIndicator, Platform, Alert, Modal, FlatList, Pressable, KeyboardAvoidingView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@contexts/ThemeContext';
import { NavBar } from '@components/common/NavBar';
import { DSText } from '@ds/Text';
import { DSButton } from '@ds/Button';
import { DSInput } from '@ds/Input';
import { MarkdownEditor } from '@components/post/MarkdownEditor';
import { useAuthContext } from '@contexts/AuthContext';
import { useToastContext } from '@contexts/ToastContext';
import { useFeedback } from '@contexts/FeedbackContext';
import { getCancelledPerson, createCancelledPerson, updateCancelledPerson, createEditSuggestion } from '@services/api';

const PROFESSIONS = [
    { label: 'Celebrity', value: 'Celebrity', icon: 'star' },
    { label: 'Influenza', value: 'Influencer', icon: 'megaphone' },
    { label: 'Cricketer', value: 'Cricketer', icon: 'baseball' },
    { label: 'Sportsman', value: 'Sportsman', icon: 'trophy' },
    { label: 'Politician', value: 'Politician', icon: 'business' },
    { label: 'Journalist', value: 'Journalist', icon: 'newspaper' },
    { label: 'Other', value: 'Other', icon: 'ellipsis-horizontal' },
];

export default function EnlistSnakeScreen() {
    const { tokens } = useTheme();
    const { showToast } = useToastContext();
    const { playTick, playSuccess } = useFeedback();
    const { editId, suggestId } = useLocalSearchParams<{ editId?: string, suggestId?: string }>();

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
    const [showProfessionModal, setShowProfessionModal] = useState(false);
    const [fields, setFields] = useState({
        name: '',
        profession: '',
        description: '',
        avatar: null as string | null,
        images: [] as string[],
        postLinks: [''],
        isIndian: true,
        isAnonymous: false,
    });

    useEffect(() => {
        if (editId) {
            loadData(editId);
        } else if (suggestId) {
            loadData(suggestId);
        }
    }, [editId, suggestId]);

    const loadData = async (id: string) => {
        setLoading(true);
        try {
            const data = await getCancelledPerson(id, true);
            setFields({
                name: data.name,
                profession: data.profession,
                description: data.description,
                avatar: data.avatar || null,
                images: data.images || [],
                postLinks: data.postLinks && data.postLinks.length > 0 ? data.postLinks : [''],
                isIndian: typeof data.isIndian === 'boolean' ? data.isIndian : true,
                isAnonymous: typeof data.isAnonymous === 'boolean' ? data.isAnonymous : false,
            });
        } catch {
            showToast('Failed to load entry data.', 'error');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Resiliently process image using lazy-loaded Expo modules.
     */
    const processImage = async (uri: string) => {
        try {
            const ImageManipulator = require('expo-image-manipulator');
            const result = await ImageManipulator.manipulateAsync(
                uri,
                [{ resize: { width: 700 } }],
                { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true }
            );
            return `data:image/jpeg;base64,${result.base64}`;
        } catch (err) {
            console.error('Image processing failed:', err);
            Alert.alert(
                "Feature Unavailable",
                "Image processing requires a native rebuild. Please run 'npx expo run:android' to fix this.",
                [{ text: "OK" }]
            );
            return null;
        }
    };

    const pickAvatar = async () => {
        try {
            const ImagePicker = require('expo-image-picker');
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1,
            });

            if (!result.canceled) {
                const b64 = await processImage(result.assets[0].uri);
                if (b64) setFields(prev => ({ ...prev, avatar: b64 }));
            }
        } catch (err) {
            Alert.alert("Error", "Image Picker native module not found during runtime. Rebuild required.");
        }
    };

    const addProofImage = async () => {
        if (fields.images.length >= 5) {
            showToast('Maximum 5 proof images allowed.', 'info');
            return;
        }

        try {
            const ImagePicker = require('expo-image-picker');
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 1,
            });

            if (!result.canceled) {
                const b64 = await processImage(result.assets[0].uri);
                if (b64) setFields(prev => ({ ...prev, images: [...prev.images, b64] }));
            }
        } catch (err) {
            Alert.alert("Error", "Image Picker native module not found during runtime. Rebuild required.");
        }
    };

    const handleSubmit = async () => {
        if (!fields.name || !fields.profession || !fields.description) {
            showToast('Please fill in all required fields.', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const links = fields.postLinks.filter(l => l.trim().length > 0);
            const payload = {
                ...fields,
                postLinks: links,
                avatar: fields.avatar || undefined,
                isIndian: !!fields.isIndian,
                isAnonymous: !!fields.isAnonymous,
            };

            if (suggestId) {
                const original = await getCancelledPerson(suggestId);
                await createEditSuggestion({
                    targetId: suggestId,
                    targetType: 'snake',
                    opId: original.authorId,
                    originalData: {
                        name: original.name,
                        description: original.description,
                        profession: original.profession,
                        avatar: original.avatar,
                        images: original.images,
                        postLinks: original.postLinks,
                        isIndian: original.isIndian,
                    },
                    suggestedData: payload
                });
                showToast('Suggestion submitted for review!', 'success');
            } else if (editId) {
                await updateCancelledPerson(editId, payload);
                showToast('Archive entry updated!', 'success');
            } else {
                await createCancelledPerson(payload);
                showToast('Person added to archive!', 'success');
            }
            playSuccess();
            router.back();
        } catch {
            showToast('Failed to save entry. Try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const selectedProf = PROFESSIONS.find(p => p.value === fields.profession);

    const activeTabStyle = (active: boolean) => ({
        flex: 1,
        paddingVertical: tokens.spacing.md,
        alignItems: 'center' as const,
        borderBottomWidth: active ? 2 : 0,
        borderBottomColor: tokens.colors.accent,
    });

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: tokens.colors.background }}>
                <ActivityIndicator size="large" color={tokens.colors.accent} />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: tokens.colors.background }}>
            <NavBar title={editId ? "Edit Snake" : "Expose a Snake"} showBack />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    {/* Header Section */}
                    <View style={styles.headerRow}>
                        <TouchableOpacity onPress={pickAvatar} style={styles.avatarPicker}>
                            {fields.avatar ? (
                                <Image source={{ uri: fields.avatar }} style={styles.avatarImage} />
                            ) : (
                                <View style={[styles.avatarPlaceholder, { backgroundColor: tokens.colors.surface2 }]}>
                                    <Ionicons name="camera-outline" size={24} color={tokens.colors.textMuted} />
                                    <DSText size="xs" color="textMuted">AVATAR</DSText>
                                </View>
                            )}
                        </TouchableOpacity>
                        <View style={{ flex: 1 }}>
                            <DSText size="xs" weight="bold" color="textMuted" style={{ marginBottom: 4, letterSpacing: 1 }}>FULL NAME</DSText>
                            <DSInput
                                placeholder="e.g. John Doe"
                                value={fields.name}
                                onChangeText={(val: string) => setFields(p => ({ ...p, name: val }))}
                            />
                        </View>
                    </View>

                    {/* Profession Dropdown */}
                    <View style={styles.sectionHeader}>
                        <DSText size="xs" weight="bold" color="textMuted" style={{ letterSpacing: 1 }}>PROFESSION</DSText>
                    </View>
                    <TouchableOpacity
                        style={[styles.selectBox, { borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface }]}
                        onPress={() => {
                            playTick();
                            setShowProfessionModal(true);
                        }}
                    >
                        <View style={styles.selectContent}>
                            {selectedProf ? (
                                <>
                                    <Ionicons name={selectedProf.icon as any} size={18} color={tokens.colors.accent} />
                                    <DSText weight="medium">{selectedProf.label}</DSText>
                                </>
                            ) : (
                                <DSText color="textMuted">Select Profession...</DSText>
                            )}
                        </View>
                        <Ionicons name="chevron-down" size={18} color={tokens.colors.textMuted} />
                    </TouchableOpacity>

                    {/* Markdown Editor Section */}
                    <View style={styles.sectionHeader}>
                        <DSText size="xs" weight="bold" color="textMuted" style={{ letterSpacing: 1 }}>ACTIONS / DESCRIPTION</DSText>
                    </View>
                    <View style={{ gap: 10 }}>
                        <View style={styles.tabBar}>
                            <TouchableOpacity
                                style={activeTabStyle(!previewMode)}
                                onPress={() => {
                                    playTick();
                                    setPreviewMode(false);
                                }}
                            >
                                <DSText size="sm" weight="semiBold" color={!previewMode ? 'accent' : 'textMuted'}>Write</DSText>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={activeTabStyle(previewMode)}
                                onPress={() => {
                                    playTick();
                                    setPreviewMode(true);
                                }}
                            >
                                <DSText size="sm" weight="semiBold" color={previewMode ? 'accent' : 'textMuted'}>Preview</DSText>
                            </TouchableOpacity>
                        </View>
                        <View style={[styles.editorContainer, { borderColor: tokens.colors.border, backgroundColor: tokens.colors.surface }]}>
                            <MarkdownEditor
                                value={fields.description}
                                onChange={(val) => setFields(p => ({ ...p, description: val }))}
                                previewMode={previewMode}
                                minHeight={150}
                            />
                        </View>
                    </View>

                    {/* Proof Gallery */}
                    <View style={styles.sectionHeader}>
                        <DSText size="xs" weight="bold" color="textMuted" style={{ letterSpacing: 1 }}>PROOF IMAGES (MAX 5)</DSText>
                    </View>
                    <View style={styles.proofGallery}>
                        {fields.images.map((img, idx) => (
                            <View key={idx} style={styles.proofImageWrapper}>
                                <Image source={{ uri: img }} style={styles.proofImage} />
                                <TouchableOpacity
                                    style={[styles.removeImage, { backgroundColor: tokens.colors.surface }]}
                                    onPress={() => setFields(p => ({ ...p, images: p.images.filter((_, i) => i !== idx) }))}
                                >
                                    <Ionicons name="close" size={16} color="red" />
                                </TouchableOpacity>
                            </View>
                        ))}
                        {fields.images.length < 5 && (
                            <TouchableOpacity onPress={addProofImage} style={[styles.addImageBtn, { borderColor: tokens.colors.border, borderStyle: 'dashed' }]}>
                                <Ionicons name="add" size={32} color={tokens.colors.textMuted} />
                                <DSText size="xs" color="textMuted">ADD PROOF</DSText>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Settings Section */}
                    <View style={styles.settingsSection}>
                        <View style={styles.toggleRow}>
                            <View style={{ flex: 1 }}>
                                <DSText size="sm" weight="semiBold">Nationality: Indian</DSText>
                                <DSText size="xs" color="textMuted">Is this person an Indian citizen?</DSText>
                            </View>
                            <Switch
                                value={fields.isIndian}
                                onValueChange={(val) => {
                                    playTick();
                                    setFields(p => ({ ...p, isIndian: val }));
                                }}
                                trackColor={{ false: tokens.colors.border, true: tokens.colors.accent }}
                                thumbColor="#ffffff"
                            />
                        </View>

                        <View style={styles.toggleRow}>
                            <View style={{ flex: 1 }}>
                                <DSText size="sm" weight="semiBold">Post Anonymously</DSText>
                                <DSText size="xs" color="textMuted">Hide your identity as the contributor.</DSText>
                            </View>
                            <Switch
                                value={fields.isAnonymous}
                                onValueChange={(val) => {
                                    playTick();
                                    setFields(p => ({ ...p, isAnonymous: val }));
                                }}
                                trackColor={{ false: tokens.colors.border, true: tokens.colors.accent }}
                                thumbColor="#ffffff"
                            />
                        </View>
                    </View>

                    <DSButton
                        label={suggestId ? "Submit Suggestion" : editId ? "Update Entry" : "Expose Snake"}
                        onPress={handleSubmit}
                        variant="solid"
                        fullWidth
                        loading={submitting}
                    />
                </ScrollView>

                {/* Custom Profession Modal */}
                <Modal
                    visible={showProfessionModal}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowProfessionModal(false)}
                >
                    <Pressable
                        style={styles.modalOverlay}
                        onPress={() => setShowProfessionModal(false)}
                    >
                        <View style={[styles.modalContent, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>
                            <View style={styles.modalHeader}>
                                <DSText weight="bold" size="lg">Select Profession</DSText>
                                <TouchableOpacity onPress={() => setShowProfessionModal(false)}>
                                    <Ionicons name="close" size={24} color={tokens.colors.textPrimary} />
                                </TouchableOpacity>
                            </View>
                            <FlatList
                                data={PROFESSIONS}
                                keyExtractor={item => item.value}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[
                                            styles.modalItem,
                                            fields.profession === item.value && { backgroundColor: tokens.colors.surface2 }
                                        ]}
                                        onPress={() => {
                                            playTick();
                                            setFields(p => ({ ...p, profession: item.value }));
                                            setShowProfessionModal(false);
                                        }}
                                    >
                                        <Ionicons name={item.icon as any} size={20} color={fields.profession === item.value ? tokens.colors.accent : tokens.colors.textMuted} />
                                        <DSText weight={fields.profession === item.value ? "bold" : "medium"}>{item.label}</DSText>
                                        {fields.profession === item.value && (
                                            <Ionicons name="checkmark" size={18} color={tokens.colors.accent} style={{ marginLeft: 'auto' }} />
                                        )}
                                    </TouchableOpacity>
                                )}
                                contentContainerStyle={{ paddingVertical: 10 }}
                            />
                        </View>
                    </Pressable>
                </Modal>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    content: {
        padding: 20,
        gap: 20,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 16,
    },
    avatarPicker: {
        width: 72,
        height: 72,
        borderRadius: 36,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionHeader: {
        marginTop: 4,
    },
    selectBox: {
        height: 54,
        borderRadius: 12,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    selectContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    tabBar: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    editorContainer: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
    },
    proofGallery: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    proofImageWrapper: {
        width: 80,
        height: 80,
        position: 'relative',
    },
    proofImage: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
    },
    removeImage: {
        position: 'absolute',
        top: -6,
        right: -6,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    addImageBtn: {
        width: 80,
        height: 80,
        borderRadius: 12,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
    },
    settingsSection: {
        gap: 8,
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingTop: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        maxHeight: '60%',
        borderTopWidth: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        gap: 16,
    },
});
