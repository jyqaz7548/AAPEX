import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, StatusBar, Modal,
} from 'react-native';
import { API_BASE_URL } from '../constants';

const PURPLE = '#5B4FE9';

interface Signal { itstId: string; name: string; }
interface PhaseInfo { isGreen: boolean; greenTime: number; redTime: number; }

const fmt = (sec: number): string => {
  const s = Math.max(0, Math.ceil(sec));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

interface Props { onOpenMap: () => void; }

export default function HomeScreen({ onOpenMap }: Props) {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [phases, setPhases] = useState<Record<string, PhaseInfo>>({});
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavModal, setShowFavModal] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/signals`)
      .then(r => r.json())
      .then(({ signals: list }: { signals: Signal[] }) => setSignals(list))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (signals.length === 0) return;
    const poll = async () => {
      for (const sig of signals) {
        try {
          const r = await fetch(`${API_BASE_URL}/api/signals/${sig.itstId}/remaining`);
          const data = await r.json() as {
            cycleInfo?: { cycleSeconds: number; greenSeconds: number };
            signals?: Array<{ statusName: string; remainingSeconds: number }>;
          };
          const phase = data.signals?.[0];
          const ci = data.cycleInfo ?? { cycleSeconds: 170, greenSeconds: 40 };
          if (phase) {
            const isGreen = phase.statusName === 'green';
            setPhases(prev => ({
              ...prev,
              [sig.itstId]: {
                isGreen,
                greenTime: isGreen ? phase.remainingSeconds : ci.greenSeconds,
                redTime: isGreen ? ci.cycleSeconds - ci.greenSeconds : phase.remainingSeconds,
              },
            }));
          }
        } catch { /* network error – keep previous state */ }
      }
    };
    poll();
    const t = setInterval(poll, 1000);
    return () => clearInterval(t);
  }, [signals]);

  const toggleFav = (id: string) =>
    setFavorites(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const favSignals = signals.filter(s => favorites.has(s.itstId));

  const renderSignalRows = (sig: Signal) => {
    const p = phases[sig.itstId];
    return (
      <View key={sig.itstId} style={styles.signalBlock}>
        <Text style={styles.signalName}>{sig.name}</Text>
        <View style={[styles.row, p?.isGreen && styles.rowActive]}>
          <View style={[styles.dot, styles.dotGreen]} />
          <Text style={styles.rowLabel}>초록불 남은 시간</Text>
          <Text style={styles.rowTime}>{p ? fmt(p.greenTime) : '--:--'}</Text>
        </View>
        <View style={[styles.row, p && !p.isGreen && styles.rowActive]}>
          <View style={[styles.dot, styles.dotRed]} />
          <Text style={styles.rowLabel}>빨간불 남은 시간</Text>
          <Text style={styles.rowTime}>{p ? fmt(p.redTime) : '--:--'}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PURPLE} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>MoveSync</Text>
      </View>

      <View style={styles.locBar}>
        <Text style={styles.locLabel}>현재 위치</Text>
        <Text style={styles.locAddr}>일원역 사거리</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>근처 신호등</Text>
            <Text style={styles.cardCount}>{signals.length}건</Text>
          </View>
          {signals.length === 0
            ? <Text style={styles.empty}>신호등 정보를 불러오는 중...</Text>
            : signals.map(renderSignalRows)}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>즐겨찾기 한 신호등</Text>
            <Text style={styles.cardCount}>{favSignals.length}건</Text>
          </View>
          {favSignals.length === 0
            ? <Text style={styles.empty}>즐겨찾기한 신호등이 없습니다</Text>
            : favSignals.map(renderSignalRows)}
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        <TouchableOpacity style={styles.btnPrimary} onPress={onOpenMap}>
          <Text style={styles.btnPrimaryTxt}>지도 보기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnSecondary} onPress={() => setShowFavModal(true)}>
          <Text style={styles.btnSecondaryTxt}>신호등 즐겨찾기 추가</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showFavModal} transparent animationType="fade" onRequestClose={() => setShowFavModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>즐겨찾기 추가</Text>
            {signals.map(sig => (
              <TouchableOpacity key={sig.itstId} style={styles.favRow} onPress={() => toggleFav(sig.itstId)}>
                <Text style={styles.favName}>{sig.name}</Text>
                <Text style={styles.favStar}>{favorites.has(sig.itstId) ? '★' : '☆'}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[styles.btnPrimary, { marginTop: 16 }]} onPress={() => setShowFavModal(false)}>
              <Text style={styles.btnPrimaryTxt}>완료</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { backgroundColor: PURPLE, paddingVertical: 16, alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '700' },
  locBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  locLabel: { fontSize: 15, color: '#333' },
  locAddr: { fontSize: 15, color: '#666' },
  scroll: { padding: 16, gap: 14 },
  card: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, padding: 16 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#111' },
  cardCount: { fontSize: 15, color: '#888' },
  signalBlock: { marginBottom: 4 },
  signalName: { fontSize: 12, color: '#999', marginBottom: 2 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10, borderRadius: 8, paddingHorizontal: 4 },
  rowActive: { backgroundColor: '#f9fafb' },
  dot: { width: 18, height: 18, borderRadius: 9 },
  dotGreen: { backgroundColor: '#22c55e' },
  dotRed: { backgroundColor: '#ef4444' },
  rowLabel: { flex: 1, fontSize: 14, color: '#333' },
  rowTime: { fontSize: 17, fontWeight: '700', color: '#111' },
  empty: { fontSize: 13, color: '#aaa', paddingVertical: 6 },
  bottom: { padding: 16, paddingBottom: 28, gap: 10, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  btnPrimary: { backgroundColor: PURPLE, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  btnPrimaryTxt: { color: '#fff', fontSize: 16, fontWeight: '600' },
  btnSecondary: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  btnSecondaryTxt: { color: '#333', fontSize: 16 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modal: { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 17, fontWeight: '700', marginBottom: 12 },
  favRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  favName: { fontSize: 15, color: '#111' },
  favStar: { fontSize: 20, color: PURPLE },
});
