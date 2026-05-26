import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';
import HomeScreen from './screens/HomeScreen';
import { MAP_URL } from './constants';

const PURPLE = '#5B4FE9';

export default function App() {
  const [showMap, setShowMap] = useState(false);

  if (showMap) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <SafeAreaView style={styles.mapHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setShowMap(false)}>
            <Text style={styles.backTxt}>← 홈</Text>
          </TouchableOpacity>
        </SafeAreaView>
        <WebView
          source={{ uri: MAP_URL }}
          style={styles.webview}
          originWhitelist={['*']}
          allowsInlineMediaPlayback
          javaScriptEnabled
        />
      </View>
    );
  }

  return <HomeScreen onOpenMap={() => setShowMap(true)} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  mapHeader: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  backBtn: { paddingHorizontal: 16, paddingVertical: 10 },
  backTxt: { fontSize: 16, color: PURPLE, fontWeight: '600' },
  webview: { flex: 1 },
});
