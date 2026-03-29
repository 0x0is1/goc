import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@contexts/ThemeContext';
import { useAuthContext } from '@contexts/AuthContext';
import { useToastContext } from '@contexts/ToastContext';
import { DSText } from '@ds/Text';
import { DSInput } from '@ds/Input';
import { DSButton } from '@ds/Button';
import { DSDivider } from '@ds/Divider';
import { GoogleSignInButton } from '@components/auth/GoogleSignInButton';
import { loginSchema } from '@utils/validators';
import { NavBar } from '@components/common/NavBar';

interface FormErrors {
    email?: string;
    password?: string;
    general?: string;
}

export default function LoginScreen() {
    const { tokens } = useTheme();
    const { signInWithEmail, signInWithGoogle } = useAuthContext();
    const { showToast } = useToastContext();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    const screenStyle = {
        flex: 1,
        backgroundColor: tokens.colors.background,
    };

    async function handleLogin() {
        const result = loginSchema.safeParse({ email, password });
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
        const err = await signInWithEmail(email, password);
        setLoading(false);
        if (err) {
            setErrors({ general: err.message });
            showToast(err.message, 'error');
        } else {
            showToast('Signed in successfully', 'success');
            router.replace('/(tabs)/');
        }
    }

    async function handleGoogle() {
        setGoogleLoading(true);
        const err = await signInWithGoogle();
        setGoogleLoading(false);
        if (err) {
            showToast(err.message, 'error');
        } else {
            showToast('Signed in with Google', 'success');
            router.replace('/(tabs)/');
        }
    }

    return (
        <View style={screenStyle}>
            <NavBar />
            <ScrollView
                contentContainerStyle={[
                    styles.content,
                    { paddingBottom: tokens.layout.screenPaddingBottom + 32, paddingTop: 32 }
                ]}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.header}>
                    <DSText size="2xl" weight="extraBold" color="textPrimary">Welcome Back</DSText>
                    <DSText size="base" color="textMuted">Sign in to share your post</DSText>
                </View>

                <View style={styles.form}>
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
                                <TouchableOpacity onPress={() => setShowPassword((v) => !v)} accessibilityLabel="Toggle password visibility" accessibilityRole="button">
                                    <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={18} color={tokens.colors.textMuted} />
                                </TouchableOpacity>
                            }
                            accessibilityLabel="Password input"
                        />
                        {errors.password && <DSText size="sm" color="danger" style={styles.fieldError}>{errors.password}</DSText>}
                    </View>

                    {errors.general && <DSText size="sm" color="danger">{errors.general}</DSText>}

                    <DSButton
                        label="Sign In"
                        onPress={handleLogin}
                        variant="solid"
                        fullWidth
                        loading={loading}
                        accessibilityLabel="Sign in"
                    />

                    <View style={styles.dividerRow}>
                        <DSDivider style={styles.dividerLine} />
                        <DSText size="sm" color="textMuted" style={styles.orLabel}>or</DSText>
                        <DSDivider style={styles.dividerLine} />
                    </View>

                    <GoogleSignInButton onPress={handleGoogle} loading={googleLoading} />

                    <TouchableOpacity
                        onPress={() => router.push('/register')}
                        accessibilityLabel="Go to register"
                        accessibilityRole="button"
                        style={styles.linkRow}
                    >
                        <DSText size="base" color="accent">Create an account</DSText>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    content: {
        paddingHorizontal: 24
    },
    header: {
        alignItems: 'center',
        gap: 8,
        marginBottom: 32
    },
    form: {
        gap: 16
    },
    fieldError: {
        marginTop: 4
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    dividerLine: {
        flex: 1
    },
    orLabel: {
        paddingHorizontal: 4
    },
    linkRow: {
        alignItems: 'center',
        marginTop: 8
    },
});
