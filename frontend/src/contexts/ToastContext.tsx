import React, { createContext, useContext, useState, useRef, ReactNode } from 'react';
import { StyleSheet, Animated } from 'react-native';
import { TOAST_DURATION_MS } from '@utils/constants';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextValue {
    showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    function showToast(message: string, type: ToastType) {
        const id = `${Date.now()}_${Math.random()}`;
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, TOAST_DURATION_MS);
    }

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toasts.map((toast) => (
                <ToastView key={toast.id} toast={toast} />
            ))}
        </ToastContext.Provider>
    );
}

function ToastView({ toast }: { toast: ToastItem }) {
    const opacity = useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        Animated.sequence([
            Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
            Animated.delay(TOAST_DURATION_MS - 400),
            Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start();
    }, [opacity]);

    const borderColor = toast.type === 'success' ? '#22C55E' : toast.type === 'error' ? '#E63946' : '#888888';

    return (
        <Animated.View style={[styles.toast, { opacity, borderColor }]}>
            <Animated.Text style={styles.text}>{toast.message}</Animated.Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    toast: {
        position: 'absolute',
        bottom: 100,
        left: 16,
        right: 16,
        backgroundColor: '#1E1E1E',
        borderWidth: 1,
        borderRadius: 0,
        paddingHorizontal: 16,
        paddingVertical: 12,
        zIndex: 9999,
    },
    text: {
        color: '#F5F5F5',
        fontSize: 14,
        fontFamily: 'PlusJakartaSans_500Medium',
    },
});

export function useToastContext(): ToastContextValue {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToastContext must be used inside ToastProvider');
    return ctx;
}

