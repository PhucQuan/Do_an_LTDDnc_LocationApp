import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, Modal, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Gift, Plus, Trash2, X, ShoppingBag, History } from 'lucide-react-native';
import { adminService } from '../../../infrastructure/firebase/adminService';

const A = {
  bg: '#0A0E1A', card: 'rgba(255,255,255,0.07)', border: 'rgba(255,255,255,0.1)',
  text: '#F1F5F9', sub: '#94A3B8', muted: '#475569',
  accent: '#7C3AED', red: '#EF4444', green: '#10B981', yellow: '#F59E0B',
};

const TABS = ['Catalog', 'Transactions'];

function AddGiftModal({ visible, onClose, onAdd }) {
  const [form, setForm] = useState({ title: '', price: '', category: 'Food', subtitle: '', image: '' });
  const CATS = ['Food', 'Cute', 'Top-up', 'Voucher'];

  const handleAdd = async () => {
    if (!form.title || !form.price) { Alert.alert('Fill title and price.'); return; }
    await onAdd({
      ...form,
      image: form.image || 'https://cdn-icons-png.flaticon.com/512/4949/4949857.png',
      accent: '#FFE7D6',
    });
    setForm({ title: '', price: '', category: 'Food', subtitle: '', image: '' });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Gift Item</Text>
            <TouchableOpacity onPress={onClose}><X color={A.sub} size={20} /></TouchableOpacity>
          </View>

          {[
            { key: 'title', ph: 'Gift title *' },
            { key: 'price', ph: 'Price (e.g. 29.000đ) *' },
            { key: 'subtitle', ph: 'Short description' },
            { key: 'image', ph: 'Image URL (optional)' },
          ].map(({ key, ph }) => (
            <TextInput
              key={key}
              style={styles.input}
              placeholder={ph}
              placeholderTextColor={A.muted}
              value={form[key]}
              onChangeText={v => setForm(f => ({ ...f, [key]: v }))}
            />
          ))}

          {/* Category */}
          <Text style={styles.inputLabel}>Category</Text>
          <View style={styles.catRow}>
            {CATS.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.catChip, form.category === cat && styles.catChipActive]}
                onPress={() => setForm(f => ({ ...f, category: cat }))}
              >
                <Text style={[styles.catText, form.category === cat && { color: '#fff' }]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
            <Plus color="#fff" size={16} />
            <Text style={styles.addBtnText}>Add to Catalog</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function AdminGiftsScreen() {
  const [tab, setTab] = useState('Catalog');
  const [catalog, setCatalog] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [cat, txns] = await Promise.all([
        adminService.getGiftCatalog(),
        adminService.getRecentGifts(30),
      ]);
      setCatalog(cat);
      setTransactions(txns);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleDelete = (item) => {
    Alert.alert('Remove gift', `Remove "${item.title}" from catalog?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          try {
            await adminService.deleteGiftItem(item.id);
            setCatalog(prev => prev.filter(g => g.id !== item.id));
          } catch { Alert.alert('Error', 'Could not delete gift.'); }
        },
      },
    ]);
  };

  const handleAdd = async (gift) => {
    try {
      const docRef = await adminService.addGiftItem(gift);
      setCatalog(prev => [...prev, { id: docRef.id, ...gift }]);
    } catch { Alert.alert('Error', 'Could not add gift.'); }
  };

  const formatDate = (ts) => {
    if (!ts?.toDate) return '';
    const d = ts.toDate();
    return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const totalRevenue = transactions.reduce((sum, t) => {
    const n = parseInt((t.giftPrice || '0').replace(/[^0-9]/g, ''));
    return sum + n;
  }, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#0A0E1A', '#111827']} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <Text style={styles.kicker}>admin · gift management</Text>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Gifts</Text>
          {tab === 'Catalog' && (
            <TouchableOpacity style={styles.addGiftBtn} onPress={() => setShowAdd(true)}>
              <Plus color="#fff" size={16} />
              <Text style={styles.addGiftText}>Add</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t} style={[styles.tabBtn, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            {t === 'Catalog' ? <ShoppingBag color={tab === t ? '#fff' : A.muted} size={14} /> : <History color={tab === t ? '#fff' : A.muted} size={14} />}
            <Text style={[styles.tabText, tab === t && { color: '#fff' }]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={A.accent} style={{ marginTop: 60 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {/* Transactions tab header */}
          {tab === 'Transactions' && (
            <LinearGradient colors={['#064e3b', '#065f46']} style={styles.revBanner}>
              <Gift color="#34d399" size={22} />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.revLabel}>Total Simulated Revenue</Text>
                <Text style={styles.revValue}>{totalRevenue.toLocaleString('vi-VN')}đ</Text>
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={styles.revCount}>{transactions.length} txns</Text>
              </View>
            </LinearGradient>
          )}

          {/* Catalog */}
          {tab === 'Catalog' && catalog.map((item) => (
            <View key={item.id} style={styles.giftCard}>
              <View style={[styles.giftArt, { backgroundColor: item.accent || '#FFE7D6' }]}>
                <Image source={{ uri: item.image }} style={styles.giftImg} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.giftTitle}>{item.title}</Text>
                <Text style={styles.giftSub}>{item.subtitle}</Text>
                <View style={styles.giftMeta}>
                  <Text style={styles.giftPrice}>{item.price}</Text>
                  <View style={styles.catPill}>
                    <Text style={styles.catPillText}>{item.category}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity style={styles.delBtn} onPress={() => handleDelete(item)}>
                <Trash2 color={A.red} size={15} />
              </TouchableOpacity>
            </View>
          ))}

          {/* Transactions */}
          {tab === 'Transactions' && transactions.map((t) => (
            <View key={t.id} style={styles.txnCard}>
              <View style={styles.txnLeft}>
                <Text style={styles.txnSender} numberOfLines={1}>📤 {t.senderName || 'User'}</Text>
                <Text style={styles.txnArrow}>→</Text>
                <Text style={styles.txnRecipient} numberOfLines={1}>📥 {t.recipientName || 'Friend'}</Text>
              </View>
              <View style={styles.txnRight}>
                <Text style={styles.txnGift}>{t.giftTitle}</Text>
                <Text style={styles.txnPrice}>{t.giftPrice}</Text>
                <Text style={styles.txnDate}>{formatDate(t.createdAt)}</Text>
              </View>
            </View>
          ))}

          {((tab === 'Catalog' && catalog.length === 0) || (tab === 'Transactions' && transactions.length === 0)) && (
            <Text style={styles.empty}>No {tab.toLowerCase()} data found.</Text>
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      <AddGiftModal visible={showAdd} onClose={() => setShowAdd(false)} onAdd={handleAdd} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: A.bg },
  header: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 6 },
  kicker: { color: A.accent, fontSize: 11, fontWeight: '900', letterSpacing: 1.4, textTransform: 'uppercase' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: A.text, fontSize: 28, fontWeight: '900', marginTop: 2 },
  addGiftBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: A.accent, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 14 },
  addGiftText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  tabRow: { flexDirection: 'row', marginHorizontal: 18, marginBottom: 12, gap: 10 },
  tabBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, backgroundColor: A.card, borderWidth: 1, borderColor: A.border },
  tabActive: { backgroundColor: A.accent, borderColor: A.accent },
  tabText: { color: A.muted, fontSize: 13, fontWeight: '800' },
  list: { paddingHorizontal: 18, gap: 10 },
  revBanner: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, padding: 18, marginBottom: 6 },
  revLabel: { color: '#a7f3d0', fontSize: 12, fontWeight: '700' },
  revValue: { color: '#34d399', fontSize: 22, fontWeight: '900' },
  revCount: { color: '#a7f3d0', fontSize: 13 },
  giftCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: A.card, borderRadius: 20, padding: 12, borderWidth: 1, borderColor: A.border },
  giftArt: { width: 58, height: 58, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  giftImg: { width: 40, height: 40, resizeMode: 'contain' },
  giftTitle: { color: A.text, fontSize: 15, fontWeight: '800' },
  giftSub: { color: A.sub, fontSize: 12, marginTop: 2 },
  giftMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  giftPrice: { color: A.yellow, fontWeight: '900', fontSize: 13 },
  catPill: { backgroundColor: 'rgba(124,58,237,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  catPillText: { color: '#a78bfa', fontSize: 11, fontWeight: '700' },
  delBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.12)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
  txnCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: A.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: A.border },
  txnLeft: { flex: 1, gap: 2 },
  txnSender: { color: '#a78bfa', fontSize: 13, fontWeight: '700' },
  txnArrow: { color: A.muted, fontSize: 13 },
  txnRecipient: { color: '#34d399', fontSize: 13, fontWeight: '700' },
  txnRight: { alignItems: 'flex-end', gap: 2 },
  txnGift: { color: A.text, fontSize: 13, fontWeight: '800' },
  txnPrice: { color: A.yellow, fontSize: 13, fontWeight: '900' },
  txnDate: { color: A.muted, fontSize: 10 },
  empty: { color: A.muted, textAlign: 'center', paddingVertical: 60, fontSize: 14 },
  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#141824', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: 36, borderWidth: 1, borderColor: A.border, gap: 12 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  modalTitle: { color: A.text, fontSize: 20, fontWeight: '900' },
  input: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, color: A.text, fontSize: 14, borderWidth: 1, borderColor: A.border },
  inputLabel: { color: A.muted, fontSize: 12, fontWeight: '700', marginBottom: -4 },
  catRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  catChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: A.card, borderWidth: 1, borderColor: A.border },
  catChipActive: { backgroundColor: A.accent, borderColor: A.accent },
  catText: { color: A.sub, fontSize: 13, fontWeight: '700' },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: A.accent, borderRadius: 16, paddingVertical: 14, marginTop: 4 },
  addBtnText: { color: '#fff', fontSize: 15, fontWeight: '900' },
});
