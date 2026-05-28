import React, { useRef, useState } from 'react';
import {
  View, StyleSheet, Animated, PanResponder, Dimensions, StatusBar,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import HomeScreen from './screens/HomeScreen';
import SignalModal from './components/SignalModal';
import { MAP_URL } from './constants';

const { height: H } = Dimensions.get('window');
const EXPANDED_TOP = 80;
const COLLAPSED_TOP = H - 220;

interface SelectedSignal { itstId: string; name: string; }

export default function App() {
  const [expanded, setExpanded] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState<SelectedSignal | null>(null);
  const isExpanded = useRef(false);
  const scrollY = useRef(0);

  // top을 직접 애니메이션 → 레이아웃이 실제로 이동 → 터치 영역도 함께 이동
  const sheetTop = useRef(new Animated.Value(COLLAPSED_TOP)).current;
  const curTop = useRef(COLLAPSED_TOP);

  const snapTo = (target: number) => {
    const exp = target === EXPANDED_TOP;
    curTop.current = target;
    isExpanded.current = exp;
    setExpanded(exp);
    Animated.spring(sheetTop, {
      toValue: target,
      useNativeDriver: false, // top은 layout 속성 → native driver 불가
      tension: 65,
      friction: 11,
    }).start();
  };

  const panResponder = useRef(PanResponder.create({
    // 접힘 상태: 시트 어디서나 스와이프 캡처 (capture = ScrollView보다 먼저)
    onMoveShouldSetPanResponderCapture: (_, { dy }) =>
      !isExpanded.current && Math.abs(dy) > 8,
    // 펼침 상태: 스크롤 최상단에서 아래로 당기면 접기
    onMoveShouldSetPanResponder: (_, { dy }) =>
      isExpanded.current && dy > 10 && scrollY.current <= 0,
    onPanResponderGrant: () => {
      sheetTop.setOffset(curTop.current);
      sheetTop.setValue(0);
    },
    onPanResponderMove: (_, { dy }) => {
      const min = EXPANDED_TOP - curTop.current;
      const max = COLLAPSED_TOP - curTop.current;
      sheetTop.setValue(Math.max(min, Math.min(max, dy)));
    },
    onPanResponderRelease: (_, { dy, vy }) => {
      sheetTop.flattenOffset();
      const curr = Math.max(EXPANDED_TOP, Math.min(COLLAPSED_TOP, curTop.current + dy));
      const mid = (EXPANDED_TOP + COLLAPSED_TOP) / 2;
      const goExpand = vy < -0.5 || (Math.abs(vy) < 0.5 && curr < mid);
      snapTo(goExpand ? EXPANDED_TOP : COLLAPSED_TOP);
    },
  })).current;

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'markerClick') {
        setSelectedSignal(data.signal);
      }
    } catch {}
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <WebView
        source={{ uri: MAP_URL }}
        style={StyleSheet.absoluteFill}
        javaScriptEnabled
        allowsInlineMediaPlayback
        originWhitelist={['*']}
        onMessage={handleMessage}
      />
      {/* top 애니메이션 → 접힘 시 layout이 하단만 차지 → 지도 터치 통과 */}
      <Animated.View style={[styles.sheet, { top: sheetTop }]}>
        <View style={styles.inner} {...panResponder.panHandlers}>
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>
          <HomeScreen
            scrollEnabled={expanded}
            onScroll={(y) => { scrollY.current = y; }}
          />
        </View>
      </Animated.View>
      <SignalModal
        signal={selectedSignal}
        onClose={() => setSelectedSignal(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 12,
  },
  inner: { flex: 1 },
  handleWrap: { paddingTop: 10, paddingBottom: 6, alignItems: 'center' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#d1d5db' },
});
