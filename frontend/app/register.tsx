import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@contexts/ThemeContext';
import { useAuthContext } from '@contexts/AuthContext';
import { useToastContext } from '@contexts/ToastContext';
import { DSText } from '@ds/Text';
import { DSInput } from '@ds/Input';
import { DSButton } from '@ds/Button';
import { registerSchema } from '@utils/validators';

interface FormErrors {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
}

export default function RegisterScreen() {
    const { tokens } = useTheme();
    const { register } = useAuthContext();
    const { showToast } = useToastContext();
    const insets = useSafeAreaInsets();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [loading, setLoading] = useState(false);

    const screenStyle = {
        flex: 1,
        backgroundColor: tokens.colors.background,
    };

    async function handleRegister() {
        const result = registerSchema.safeParse({ name, email, password, confirmPassword });
        if (!result.success) {
            const errs: FormErrors = {};
            result.error.issues.forEach((issue) => {
                const key = issue.path[0] as keyof FormErrors;
                errs[key] = issue.message;
            });
            setErrors(errs);
            return;
        }
        setErrors({});
        setLoading(true);
        const err = await register(name, email, password);
        setLoading(false);
        if (err) {
            setErrors({ general: err.message });
            showToast(err.message, 'error');
        } else {
            showToast('Account created!', 'success');
            router.replace('/(tabs)/');
        }
    }

    return (
        <ScrollView
            style={screenStyle}
            contentContainerStyle={[styles.content, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 }]}
            keyboardShouldPersistTaps="handled"
        >
            <View style={{ alignItems: 'center', gap: tokens.spacing.sm, marginBottom: tokens.spacing['3xl'] }}>
                <Ionicons name="search" size={48} color={tokens.colors.accent} />
                <DSText size="2xl" weight="extraBold" color="textPrimary">Create Account</DSText>
                <DSText size="base" color="textMuted">Join and start curating Gems</DSText>
            </View>
            <View style={{ gap: tokens.spacing.lg }}>
                <View>
                    <DSInput
                        value={name}
                        onChangeText={setName}
                        placeholder="Full Name"
                        leftIcon={<Ionicons name="person-outline" size={18} color={tokens.colors.textMuted} />}
                        accessibilityLabel="Full name input"
                    />
                    {errors.name && <DSText size="sm" color="danger" style={styles.fieldError}>{errors.name}</DSText>}
                </View>
                <View>
                    <DSInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Email"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        leftIcon={<Ionicons name="mail-outline" size={18} color={tokens.colors.textMuted} />}
                        accessibilityLabel="Email address input"
                    />
                    {errors.email && <DSText size="sm" color="danger" style={styles.fieldError}>{errors.email}</DSText>}
                </View>
                <View>
                    <DSInput
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Password"
                        secureTextEntry={!showPassword}
                        leftIcon={<Ionicons name="lock-closed-outline" size={18} color={tokens.colors.textMuted} />}
                        rightIcon={
                            <TouchableOpacity onPress={() => setShowPassword((v) => !v)} accessibilityLabel="Toggle password" accessibilityRole="button">
                                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={18} color={tokens.colors.textMuted} />
                            </TouchableOpacity>
                        }
                        accessibilityLabel="Password input"
                    />
                    {errors.password && <DSText size="sm" color="danger" style={styles.fieldError}>{errors.password}</DSText>}
                </View>
                <View>
                    <DSInput
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Confirm Password"
                        secureTextEntry={!showPassword}
                        leftIcon={<Ionicons name="lock-closed-outline" size={18} color={tokens.colors.textMuted} />}
                        accessibilityLabel="Confirm password input"
                    />
                    {errors.confirmPassword && <DSText size="sm" color="danger" style={styles.fieldError}>{errors.confirmPassword}</DSText>}
                </View>
                {errors.general && <DSText size="sm" color="danger">{errors.general}</DSText>}
                <DSButton label="Create Account" onPress={handleRegister} variant="solid" fullWidth loading={loading} accessibilityLabel="Create new account" />
                <TouchableOpacity onPress={() => router.push('/login')} accessibilityLabel="Go to sign in" accessibilityRole="button" style={styles.linkRow}>
                    <DSText size="base" color="accent">Already have an account? Sign In</DSText>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    content: { paddingHorizontal: 24 },
    fieldError: { marginTop: 4 },
    linkRow: { alignItems: 'center' },
});

