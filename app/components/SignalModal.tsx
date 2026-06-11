import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { API_BASE_URL } from '../constants';

const PURPLE = '#5B4FE9';

interface Signal { itstId: string; name: string; }
interface Phase {
  status: string;
  remainingSeconds: number;
  cycleSeconds: number;
  greenSeconds: number;
}
interface Props {
  signal: Signal | null;
  onClose: () => void;
  onDelete: (itstId: string) => void;
}

const fmt = (sec: number) => {
  const s = Math.max(0, Math.ceil(sec));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

const nowKST = () => {
  const n = new Date();
  const h = (n.getUTCHours() + 9) % 24;
  return `${String(h).padStart(2,'0')}:${String(n.getUTCMinutes()).padStart(2,'0')}:${String(n.getUTCSeconds()).padStart(2,'0')}`;
};

export default function SignalModal({ signal, onClose, onDelete }: Props) {
  const [phase, setPhase] = useState<Phase | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [cycleInput, setCycleInput] = useState('');
  const [greenInput, setGreenInput] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!signal) { setPhase(null); setShowSettings(false); return; }

    const poll = async () => {
      try {
        const r = await fetch(`${API_BASE_URL}/api/signals/${signal.itstId}/remaining`);
        const data = await r.json();
        const sig = data.signals?.[0];
        const ci = data.cycleInfo ?? { cycleSeconds: 170, greenSeconds: 40 };
        if (sig) {
          setPhase({ status: sig.statusName, remainingSeconds: sig.remainingSeconds, ...ci });
          setCycleInput(String(ci.cycleSeconds));
          setGreenInput(String(ci.greenSeconds));
        }
      } catch {}
    };

    poll();
    const t = setInterval(poll, 1000);
    return () => clearInterval(t);
  }, [signal]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  const postCycle = async (body: object) => {
    await fetch(`${API_BASE_URL}/api/signals/${signal!.itstId}/cycle`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  };

  const setNowRef = async () => {
    const c = parseInt(cycleInput) || phase?.cycleSeconds || 170;
    const g = parseInt(greenInput) || phase?.greenSeconds || 40;
    const ref = nowKST();
    await postCycle({ cycleSeconds: c, greenSeconds: g, referenceGreenStartKST: ref });
    showToast(`${ref} KST 기준 설정됨`);
    setShowSettings(false);
  };

  const saveCycle = async () => {
    const c = parseInt(cycleInput);
    const g = parseInt(greenInput);
    if (!c || !g) { showToast('값을 입력해주세요'); return; }
    await postCycle({ cycleSeconds: c, greenSeconds: g });
    showToast('저장됐어요');
    setShowSettings(false);
  };

  const handleDelete = () => {
    Alert.alert(
      '신호등 삭제',
      `"${signal?.name}"을(를) 삭제할까요?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제', style: 'destructive',
          onPress: async () => {
            await fetch(`${API_BASE_URL}/api/signals/${signal!.itstId}`, { method: 'DELETE' });
            onDelete(signal!.itstId);
            onClose();
          },
        },
      ],
    );
  };

  const isGreen = phase?.status === 'green';
  const total = phase ? (isGreen ? phase.greenSeconds : phase.cycleSeconds - phase.greenSeconds) : 1;
  const pct = phase ? Math.min(100, (phase.remainingSeconds / total) * 100) : 0;

  return (
    <Modal visible={!!signal} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={s.card} activeOpacity={1} onPress={() => {}}>

          {/* 헤더 */}
          <View style={s.header}>
            <Text style={s.title} numberOfLines={1}>{signal?.name}</Text>
            <TouchableOpacity onPress={handleDelete} style={s.deleteBtn}>
              <Text style={s.deleteTxt}>🗑️</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <Text style={s.closeTxt}>✕</Text>
            </TouchableOpacity>
          </View>

          {!showSettings ? (
            <>
              {/* 신호 상태 */}
              <View style={s.statusRow}>
                <View style={[s.circle, isGreen ? s.green : s.red]}>
                  <Text style={s.circleEmoji}>{phase ? (isGreen ? '🟢' : '🔴') : '🚦'}</Text>
                </View>
                <View style={s.info}>
                  <Text style={[s.statusTxt, { color: isGreen ? '#16a34a' : '#dc2626' }]}>
                    {phase ? (isGreen ? '초록불' : '빨간불') : '로딩 중...'}
                  </Text>
                  <Text style={s.remaining}>{phase ? fmt(phase.remainingSeconds) : '--:--'}</Text>
                  <Text style={s.unit}>남음</Text>
                </View>
              </View>

              {/* 진행 바 */}
              <View style={s.progressBg}>
                <View style={[s.progressFill, {
                  width: `${pct}%` as any,
                  backgroundColor: isGreen ? '#22c55e' : '#ef4444',
                }]} />
              </View>

              <TouchableOpacity style={s.settingsBtn} onPress={() => setShowSettings(true)}>
                <Text style={s.settingsTxt}>⚙️ 신호 주기 설정</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* 설정 화면 */}
              <TouchableOpacity onPress={() => setShowSettings(false)} style={s.backBtn}>
                <Text style={s.backTxt}>← 돌아가기</Text>
              </TouchableOpacity>
              <View style={s.inputRow}>
                <Text style={s.label}>신호 주기 (초)</Text>
                <TextInput style={s.input} value={cycleInput} onChangeText={setCycleInput} keyboardType="number-pad" placeholder="예: 170" />
              </View>
              <View style={s.inputRow}>
                <Text style={s.label}>초록불 유지 시간 (초)</Text>
                <TextInput style={s.input} value={greenInput} onChangeText={setGreenInput} keyboardType="number-pad" placeholder="예: 40" />
              </View>
              <TouchableOpacity style={[s.btn, s.btnGreen]} onPress={setNowRef}>
                <Text style={s.btnTxt}>🟢 지금 초록불 시작 시각으로 설정</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btn, s.btnPurple]} onPress={saveCycle}>
                <Text style={s.btnTxt}>저장</Text>
              </TouchableOpacity>
            </>
          )}

          {!!toast && (
            <View style={s.toast}>
              <Text style={s.toastTxt}>{toast}</Text>
            </View>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  title: { flex: 1, fontSize: 17, fontWeight: '700', color: '#111' },
  deleteBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  deleteTxt: { fontSize: 13 },
  closeBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  closeTxt: { fontSize: 12, color: '#666' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12 },
  circle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  green: { backgroundColor: '#22c55e' },
  red: { backgroundColor: '#ef4444' },
  circleEmoji: { fontSize: 28 },
  info: { flex: 1 },
  statusTxt: { fontSize: 16, fontWeight: '700' },
  remaining: { fontSize: 40, fontWeight: '800', color: '#111', lineHeight: 46 },
  unit: { fontSize: 13, color: '#666' },
  progressBg: { height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, overflow: 'hidden', marginBottom: 16 },
  progressFill: { height: '100%', borderRadius: 3 },
  settingsBtn: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  settingsTxt: { fontSize: 14, color: '#555' },
  backBtn: { marginBottom: 12 },
  backTxt: { color: '#007AFF', fontSize: 14 },
  inputRow: { marginBottom: 10 },
  label: { fontSize: 12, color: '#888', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, fontSize: 15 },
  btn: { borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
  btnGreen: { backgroundColor: '#22c55e' },
  btnPurple: { backgroundColor: PURPLE },
  btnTxt: { color: '#fff', fontSize: 14, fontWeight: '600' },
  toast: { backgroundColor: '#111', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, alignSelf: 'center', marginTop: 12 },
  toastTxt: { color: '#fff', fontSize: 13 },
});
