// Native entry. The background task must be defined before the app starts so iOS and Android can
// run it while the app is closed; then Expo Router boots the app from src/app.
import './src/scheduling/backgroundTask';
import 'expo-router/entry';
