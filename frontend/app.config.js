/* eslint-disable */
const fs = require('fs');
require('dotenv').config();

if (process.env.GOOGLE_SERVICES_JSON) {
    try {
        const jsonStr = Buffer.from(process.env.GOOGLE_SERVICES_JSON, 'base64').toString('utf8');
        fs.writeFileSync('./google-services.json', jsonStr);
        console.log("✅ Successfully injected google-services.json from Base64 GitHub Action secret.");
    } catch (e) {
        console.error("❌ Failed to decode GOOGLE_SERVICES_JSON secret", e);
    }
} else {
    console.log("⚠️ No GOOGLE_SERVICES_JSON environment variable provided. Proceeding without dynamic injection.");
}

module.exports = {
    expo: {
        name: "Gems of Congress",
        slug: "gems-of-congress",
        version: "0.1.4",
        orientation: "portrait",
        userInterfaceStyle: "automatic",
        icon: "./assets/icon.png",
        scheme: "gemsofcongress",
        owner: "0x0is1",
        splash: {
            image: "./assets/splash-icon.png",
            resizeMode: "contain",
            backgroundColor: "#0A0A0A"
        },
        ios: {
            supportsTablet: false,
            bundleIdentifier: "com.nys.gemsofcongress"
        },
        android: {
            package: "com.nys.gemsofcongress",
            adaptiveIcon: {
                foregroundImage: "./assets/android-icon-foreground.png",
                backgroundColor: "#0A0A0A"
            },
            googleServicesFile: "./google-services.json"
        },
        plugins: [
            "expo-router",
            "expo-font",
            [
                "expo-notifications",
                {
                    "icon": "./assets/android-icon-monochrome.png",
                    "color": "#E63946"
                }
            ],
            ["expo-background-fetch", {}],
            ["expo-task-manager", {}],
            "@react-native-google-signin/google-signin"
        ],
        runtimeVersion: {
            policy: "appVersion"
        },
        extra: {
            apiUrl: "http://localhost:3000",
            router: {},
            eas: {
                projectId: "7bcc063d-09b8-4a12-a726-91c5bb3e97be"
            },
            firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
            firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
            firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
            firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
            firebaseMessagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
            firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
        },
        updates: {
            url: "https://u.expo.dev/7bcc063d-09b8-4a12-a726-91c5bb3e97be"
        }
    }
};
