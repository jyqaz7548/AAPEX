import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Modal,
} from 'react-native';
import { API_BASE_URL } from '../constants';

const PURPLE = '#5B4FE9';

interface Signal { itstId: string; name: string; }
interface PhaseInfo { isGreen: boolean; greenTime: number; redTime: number; }

const fmt = (sec: number): string => {
  const s = Math.max(0, Math.ceil(sec));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

interface Props {
  scrollEnabled: boolean;
  onScroll: (y: number) => void;
}

export default function HomeScreen({ scrollEnabled, onScroll }: Props) {
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
        } catch { /* keep previous */ }
      }
    };
    poll();
    const t = setInterval(poll, 1000);
    return () => clearInterval(t);
  }, [signals]);

  const toggleFav = (id: string) =>
    setFavorites(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const favSignals = signals.filter(s => favorites.has(s.itstId));

  const renderRows = (sig: Signal) => {
    const p = phases[sig.itstId];
    return (
      <View key={sig.itstId} style={styles.sigBlock}>
        <Text style={styles.sigName}>{sig.name}</Text>
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
    <View style={styles.container}>
      {/* Fixed header — always visible even when sheet is collapsed */}
      <View style={styles.header}>
        <Text style={styles.title}>MoveSync</Text>
      </View>
      <View style={styles.locBar}>
        <Text style={styles.locLabel}>현재 위치</Text>
        <Text style={styles.locAddr}>일원역 사거리</Text>
      </View>

      {/* Scrollable signal cards */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        scrollEnabled={scrollEnabled}
        scrollEventThrottle={16}
        onScroll={(e) => onScroll(e.nativeEvent.contentOffset.y)}
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>근처 신호등</Text>
            <Text style={styles.cardCount}>{signals.length}건</Text>
          </View>
          {signals.length === 0
            ? <Text style={styles.empty}>신호등 정보를 불러오는 중...</Text>
            : signals.map(renderRows)}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>즐겨찾기 한 신호등</Text>
            <Text style={styles.cardCount}>{favSignals.length}건</Text>
          </View>
          {favSignals.length === 0
            ? <Text style={styles.empty}>즐겨찾기한 신호등이 없습니다</Text>
            : favSignals.map(renderRows)}
        </View>

        <TouchableOpacity style={styles.btnSecondary} onPress={() => setShowFavModal(true)}>
          <Text style={styles.btnSecondaryTxt}>신호등 즐겨찾기 추가</Text>
        </TouchableOpacity>
      </ScrollView>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { backgroundColor: PURPLE, paddingVertical: 14, alignItems: 'center' },
  title: { color: '#fff', fontSize: 20, fontWeight: '700' },
  locBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  locLabel: { fontSize: 14, color: '#333' },
  locAddr: { fontSize: 14, color: '#666' },
  scroll: { padding: 14, gap: 12, paddingBottom: 36 },
  card: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, padding: 14 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#111' },
  cardCount: { fontSize: 14, color: '#888' },
  sigBlock: { marginBottom: 4 },
  sigName: { fontSize: 11, color: '#aaa', marginBottom: 2 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, gap: 10, borderRadius: 8, paddingHorizontal: 4 },
  rowActive: { backgroundColor: '#f9fafb' },
  dot: { width: 16, height: 16, borderRadius: 8 },
  dotGreen: { backgroundColor: '#22c55e' },
  dotRed: { backgroundColor: '#ef4444' },
  rowLabel: { flex: 1, fontSize: 14, color: '#333' },
  rowTime: { fontSize: 16, fontWeight: '700', color: '#111' },
  empty: { fontSize: 13, color: '#aaa', paddingVertical: 6 },
  btnSecondary: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  btnSecondaryTxt: { color: '#333', fontSize: 15 },
  btnPrimary: { backgroundColor: PURPLE, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  btnPrimaryTxt: { color: '#fff', fontSize: 15, fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modal: { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  favRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  favName: { fontSize: 14, color: '#111' },
  favStar: { fontSize: 20, color: PURPLE },
});
