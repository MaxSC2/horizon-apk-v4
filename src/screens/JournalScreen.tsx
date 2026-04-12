// src/screens/JournalScreen.tsx
import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BedDouble, Plus, Minus, Camera, X, TrendingUp, TrendingDown } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../AppContext';
import { Card, Lbl, Badge, ProgressBar } from '../components';
import { uid, TODAY, fmt, getMonday, fmtSleep } from '../helpers';
import { MOODS, ENERGY, PAIN_ZONES } from '../data';
import { loadPhotos, savePhotos } from '../storage';

const SLEEP_LABELS = [
  { h: 0, label: 'Не записан' }, { h: 4, label: '4ч — мало' }, { h: 5, label: '5ч — мало' },
  { h: 6, label: '6ч — норм' }, { h: 7, label: '7ч — хорошо' }, { h: 8, label: '8ч — отлично' }, { h: 9, label: '9ч+ — много' },
];
const sleepLabel = (h: number) => SLEEP_LABELS.reduce((b, c) => h >= c.h ? c : b, SLEEP_LABELS[0]).label;

export default function JournalScreen() {
  const { state, setState, T } = useApp();
  const { journal, bodyLog, reflections, painLog } = state;
  const [sub, setSub] = useState<'journal' | 'body' | 'pain' | 'reflection'>('journal');

  // Journal state
  const [adding, setAdding] = useState(false);
  const [jText, setJText] = useState('');
  const [jMood, setJMood] = useState(3);
  const [jEnergy, setJEnergy] = useState(3);
  const [jSleep, setJSleep] = useState(7);
  const [search, setSearch] = useState('');

  // Body state
  const [addBody, setAddBody] = useState(false);
  const [bodyForm, setBodyForm] = useState<Record<string, string>>({ weight: '', height: '', chest: '', waist: '', arms: '', hips: '' });
  const [photos, setPhotos] = useState<any[]>([]);
  const [photosLoaded, setPhotosLoaded] = useState(false);

  // Pain state
  const [addPain, setAddPain] = useState(false);
  const [painForm, setPainForm] = useState({ zone: 'shoulder', intensity: 2, isRight: true, note: '' });

  // Reflection state
  const [refForm, setRefForm] = useState({ went: '', didnt: '', focus: '' });

  React.useEffect(() => {
    if (!photosLoaded) { loadPhotos().then(p => { setPhotos(p); setPhotosLoaded(true); }); }
  }, [photosLoaded]);

  // ── Journal
  const saveJournal = () => {
    if (!jText.trim()) return;
    setState(s => ({ ...s, journal: [{ id: uid(), date: TODAY, text: jText.trim(), mood: jMood, energy: jEnergy, sleep: jSleep, waterGlasses: 0, createdAt: new Date().toISOString() }, ...s.journal] }));
    setJText(''); setJMood(3); setJEnergy(3); setJSleep(7); setAdding(false);
  };
  const filtered = useMemo(() => journal.filter(j => !search || j.text.toLowerCase().includes(search.toLowerCase())).sort((a, b) => b.date > a.date ? 1 : -1), [journal, search]);

  // ── Body
  const saveBody = () => {
    if (!bodyForm.weight && !bodyForm.chest) return;
    setState(s => ({ ...s, bodyLog: [{ id: uid(), date: TODAY, ...bodyForm, createdAt: new Date().toISOString() }, ...(s.bodyLog || [])] }));
    setBodyForm({ weight: '', height: '', chest: '', waist: '', arms: '', hips: '' }); setAddBody(false);
  };
  const bmi = bodyForm.weight && bodyForm.height
    ? parseFloat(bodyForm.weight) / Math.pow(parseFloat(bodyForm.height) / 100, 2)
    : null;
  const bmiCat = bmi ? (bmi < 18.5 ? 'Дефицит' : bmi < 25 ? 'Норма' : bmi < 30 ? 'Избыток' : 'Ожирение') : '';
  const bmiColor = bmi ? (bmi < 18.5 ? T.primary : bmi < 25 ? T.success : bmi < 30 ? T.warn : T.danger) : T.muted;

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Нужен доступ к галерее'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7, base64: false });
    if (!result.canceled && result.assets[0]) {
      const newPhoto = { id: uid(), date: TODAY, uri: result.assets[0].uri };
      const updated = [newPhoto, ...photos].slice(0, 20);
      setPhotos(updated); savePhotos(updated);
    }
  };
  const removePhoto = (id: string) => {
    const updated = photos.filter(p => p.id !== id);
    setPhotos(updated); savePhotos(updated);
  };

  // Body chart data
  const bodyChartEntries = (bodyLog || []).slice().sort((a: any, b: any) => a.date > b.date ? 1 : -1).slice(-10);
  const weightTrend = bodyChartEntries.filter((e: any) => e.weight).map((e: any) => parseFloat(e.weight) || 0);
  const weightChange = weightTrend.length >= 2 ? (weightTrend[weightTrend.length - 1] - weightTrend[0]).toFixed(1) : null;

  // ── Pain
  const savePain = () => {
    setState(s => ({ ...s, painLog: [{ id: uid(), date: TODAY, ...painForm, createdAt: new Date().toISOString() }, ...(s.painLog || [])] }));
    setPainForm({ zone: 'shoulder', intensity: 2, isRight: true, note: '' }); setAddPain(false);
  };
  const painFrequency = useMemo(() => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 30);
    const recent = (painLog || []).filter((p: any) => new Date(p.date + 'T12:00:00') >= cutoff);
    return PAIN_ZONES.map(z => ({ ...z, count: recent.filter((p: any) => p.zone === z.id).length })).filter(z => z.count > 0).sort((a, b) => b.count - a.count);
  }, [painLog]);

  // ── Reflection
  const thisWeekRef = (reflections || []).find((r: any) => new Date(r.date + 'T12:00:00') >= getMonday());
  const saveReflection = () => {
    if (!refForm.went.trim() && !refForm.didnt.trim() && !refForm.focus.trim()) return;
    setState(s => ({ ...s, reflections: [{ id: uid(), date: TODAY, ...refForm, createdAt: new Date().toISOString() }, ...(s.reflections || [])] }));
    setRefForm({ went: '', didnt: '', focus: '' });
  };

  const TABS = [
    { id: 'journal' as const, l: '📓 Дневник' },
    { id: 'body' as const, l: '⚖️ Тело' },
    { id: 'pain' as const, l: '🩺 Боль' },
    { id: 'reflection' as const, l: '🧘 Рефл.' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      {/* Sub-tabs */}
      <View style={{ backgroundColor: T.surf, borderBottomWidth: 1, borderBottomColor: T.bord }}>
        <View style={{ flexDirection: 'row' }}>
          {TABS.map(t => (
            <View key={t.id} style={{ flex: 1 }}>
              <TouchableOpacity onPress={() => setSub(t.id)} style={{ paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: sub === t.id ? T.primary : 'transparent' }}>
                <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 13, color: sub === t.id ? T.primary : T.muted }}>{t.l}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>

        {/* ═══ JOURNAL ═══ */}
        {sub === 'journal' && (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 22, color: T.txt }}>Дневник</Text>
              <TouchableOpacity onPress={() => setAdding(!adding)} style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 9, backgroundColor: T.primary }}>
                <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 13, color: '#000' }}>{adding ? 'Закрыть' : '+ Запись'}</Text>
              </TouchableOpacity>
            </View>

            {adding && (
              <Card T={T} style={{ marginBottom: 12, borderWidth: 1, borderColor: T.primary + '55' }}>
                {/* Mood */}
                <Lbl T={T} style={{ marginBottom: 6 }}>Настроение</Lbl>
                <View style={{ flexDirection: 'row', gap: 5, marginBottom: 12 }}>
                  {MOODS.map(m => (
                    <TouchableOpacity key={m.v} onPress={() => setJMood(m.v)} style={{ flex: 1, paddingVertical: 7, borderRadius: 8, borderWidth: 2, borderColor: jMood === m.v ? T.primary : T.bord, backgroundColor: jMood === m.v ? T.primary + '22' : T.lo, alignItems: 'center' }}>
                      <Text style={{ fontSize: 20 }}>{m.e}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {/* Energy */}
                <Lbl T={T} style={{ marginBottom: 6 }}>Энергия</Lbl>
                <View style={{ flexDirection: 'row', gap: 5, marginBottom: 12 }}>
                  {ENERGY.map(e => (
                    <TouchableOpacity key={e.v} onPress={() => setJEnergy(e.v)} style={{ flex: 1, paddingVertical: 7, borderRadius: 8, borderWidth: 2, borderColor: jEnergy === e.v ? T.success : T.bord, backgroundColor: jEnergy === e.v ? T.success + '22' : T.lo, alignItems: 'center' }}>
                      <Text style={{ fontSize: 18 }}>{e.e}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {/* Sleep */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Lbl T={T}>Сон прошлой ночью</Lbl>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <BedDouble size={13} color={jSleep >= 7 ? T.primary : jSleep >= 6 ? T.warn : T.danger} />
                    <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 13, color: jSleep >= 7 ? T.primary : jSleep >= 6 ? T.warn : T.danger }}>{jSleep}ч — {sleepLabel(jSleep)}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 4, marginBottom: 12 }}>
                  {[4, 5, 6, 7, 8, 9].map(h => (
                    <TouchableOpacity key={h} onPress={() => setJSleep(h)} style={{ flex: 1, paddingVertical: 5, borderRadius: 7, borderWidth: 1.5, borderColor: jSleep === h ? T.primary : T.bord, backgroundColor: jSleep === h ? T.primary + '22' : T.lo, alignItems: 'center' }}>
                      <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 12, color: jSleep === h ? T.primary : T.muted }}>{h}ч</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {/* Text */}
                <TextInput value={jText} onChangeText={setJText} placeholder="Мысли, идеи, наблюдения…" placeholderTextColor={T.muted} multiline numberOfLines={5}
                  style={{ borderRadius: 10, borderWidth: 1.5, borderColor: T.bord, backgroundColor: T.lo, color: T.txt, fontFamily: 'Barlow_400Regular', fontSize: 14, padding: 12, lineHeight: 21, minHeight: 100, marginBottom: 12, textAlignVertical: 'top' }} />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity onPress={() => setAdding(false)} style={{ flex: 1, height: 40, borderRadius: 9, borderWidth: 1, borderColor: T.bord, backgroundColor: T.lo, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 13, color: T.muted }}>Отмена</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={saveJournal} disabled={!jText.trim()} style={{ flex: 2, height: 40, borderRadius: 9, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center', opacity: !jText.trim() ? 0.5 : 1 }}>
                    <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 13, color: '#000' }}>Сохранить</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            )}

            {journal.length > 0 && (
              <TextInput value={search} onChangeText={setSearch} placeholder="🔍 Поиск…" placeholderTextColor={T.muted}
                style={{ height: 38, borderRadius: 8, borderWidth: 1.5, borderColor: T.bord, backgroundColor: T.lo, color: T.txt, fontFamily: 'Barlow_400Regular', fontSize: 14, paddingHorizontal: 12, marginBottom: 12 }} />
            )}

            {filtered.length === 0 && (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Text style={{ fontSize: 36, marginBottom: 10 }}>📝</Text>
                <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 14, color: T.muted }}>{search ? 'Ничего не найдено' : 'Начни вести дневник'}</Text>
              </View>
            )}

            {filtered.map(entry => {
              const m = MOODS.find(x => x.v === entry.mood);
              const en = ENERGY.find(x => x.v === entry.energy);
              return (
                <Card key={entry.id} T={T} style={{ marginBottom: 10, borderLeftWidth: 3, borderLeftColor: m?.v && m.v >= 4 ? T.success : m?.v && m.v <= 2 ? T.danger : T.muted }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <Text style={{ fontSize: 20 }}>{m?.e}</Text>
                      {entry.energy && <Text style={{ fontSize: 16, opacity: 0.7 }}>{en?.e}</Text>}
                      {entry.sleep && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: T.lo, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                          <BedDouble size={10} color={T.muted} />
                          <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 10, color: T.muted }}>{fmtSleep(entry.sleep)}</Text>
                        </View>
                      )}
                      <View>
                        <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 12, color: entry.date === TODAY ? T.primary : T.muted }}>
                          {entry.date === TODAY ? 'Сегодня' : new Date(entry.date + 'T12:00:00').toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </Text>
                        <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 11, color: T.muted }}>{m?.l}{entry.energy ? ' · ' + en?.l : ''}</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => setState(s => ({ ...s, journal: s.journal.filter(x => x.id !== entry.id) }))} style={{ opacity: 0.5, padding: 4 }}>
                      <X size={14} color={T.muted} />
                    </TouchableOpacity>
                  </View>
                  {entry.text && <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 14, color: T.txt, lineHeight: 21 }}>{entry.text}</Text>}
                </Card>
              );
            })}
          </>
        )}

        {/* ═══ BODY ═══ */}
        {sub === 'body' && (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 22, color: T.txt }}>Трекер тела</Text>
              <TouchableOpacity onPress={() => setAddBody(!addBody)} style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 9, backgroundColor: T.primary }}>
                <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 13, color: '#000' }}>+ Замер</Text>
              </TouchableOpacity>
            </View>

            {/* Weight trend summary */}
            {weightChange !== null && (
              <Card T={T} style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {parseFloat(weightChange) < 0 ? <TrendingDown size={22} color={T.success} /> : <TrendingUp size={22} color={T.warn} />}
                <View>
                  <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 18, color: parseFloat(weightChange) < 0 ? T.success : T.warn }}>{parseFloat(weightChange) > 0 ? '+' : ''}{weightChange} кг</Text>
                  <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 12, color: T.muted }}>за последние {bodyChartEntries.length} замеров</Text>
                </View>
              </Card>
            )}

            {addBody && (
              <Card T={T} style={{ marginBottom: 12, borderWidth: 1, borderColor: T.primary + '55' }}>
                <Lbl T={T} style={{ marginBottom: 10 }}>Новые замеры</Lbl>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                  {([['weight', '⚖️ Вес (кг)', '70'], ['height', '📐 Рост (см)', '175'], ['chest', '📏 Грудь (см)', '90'], ['waist', '📏 Талия (см)', '80'], ['arms', '💪 Бицепс (см)', '30'], ['hips', '📏 Бёдра (см)', '95']] as [string, string, string][]).map(([k, l, ph]) => (
                    <View key={k} style={{ width: '47%' }}>
                      <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 11, color: T.muted, marginBottom: 4 }}>{l}</Text>
                      <TextInput keyboardType="numeric" value={bodyForm[k] || ''} onChangeText={v => setBodyForm(f => ({ ...f, [k]: v }))} placeholder={ph} placeholderTextColor={T.muted}
                        style={{ height: 40, borderRadius: 8, borderWidth: 1.5, borderColor: T.bord, backgroundColor: T.lo, color: T.txt, fontFamily: 'BarlowCondensed_900Black', fontSize: 20, paddingHorizontal: 10, textAlign: 'center' }} />
                    </View>
                  ))}
                </View>
                {/* BMI preview */}
                {bmi && (
                  <View style={{ padding: 10, backgroundColor: bmiColor + '15', borderWidth: 1, borderColor: bmiColor + '44', borderRadius: 9, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 13, color: T.txt }}>ИМТ (BMI)</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 24, color: bmiColor }}>{bmi.toFixed(1)}</Text>
                      <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 14, color: bmiColor }}>{bmiCat}</Text>
                    </View>
                  </View>
                )}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity onPress={() => setAddBody(false)} style={{ flex: 1, height: 40, borderRadius: 9, borderWidth: 1, borderColor: T.bord, backgroundColor: T.lo, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 13, color: T.muted }}>Отмена</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={saveBody} style={{ flex: 2, height: 40, borderRadius: 9, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 13, color: '#000' }}>Сохранить</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            )}

            {(bodyLog || []).length === 0 && !addBody && (
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <Text style={{ fontSize: 40, marginBottom: 10 }}>⚖️</Text>
                <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 14, color: T.muted }}>Начни отслеживать тело</Text>
              </View>
            )}

            {(bodyLog || []).slice(0, 10).map((entry: any) => (
              <Card key={entry.id} T={T} style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 13, color: T.muted }}>
                    {new Date(entry.date + 'T12:00:00').toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </Text>
                  <TouchableOpacity onPress={() => setState(s => ({ ...s, bodyLog: (s.bodyLog || []).filter((x: any) => x.id !== entry.id) }))} style={{ opacity: 0.5 }}>
                    <X size={14} color={T.muted} />
                  </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {entry.weight && <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 15, color: T.primary }}>⚖️ {entry.weight} кг</Text>}
                  {entry.chest && <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 15, color: T.success }}>📏 {entry.chest} грудь</Text>}
                  {entry.waist && <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 15, color: T.warn }}>📏 {entry.waist} талия</Text>}
                  {entry.arms && <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 15, color: T.muted }}>💪 {entry.arms} бицепс</Text>}
                </View>
              </Card>
            ))}

            {/* Photo progress */}
            <View style={{ marginTop: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <View>
                  <Lbl T={T}>📸 Фото прогресса</Lbl>
                  <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 11, color: T.muted, marginTop: 2 }}>До 20 фото · локально на устройстве</Text>
                </View>
                <TouchableOpacity onPress={pickPhoto} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9, borderWidth: 1, borderColor: T.primary + '55', backgroundColor: T.primary + '15' }}>
                  <Camera size={13} color={T.primary} />
                  <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 12, color: T.primary }}>Добавить</Text>
                </TouchableOpacity>
              </View>
              {photos.length > 0 ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {photos.map((photo, i) => (
                    <View key={photo.id} style={{ width: '31%', aspectRatio: 1, borderRadius: 10, overflow: 'hidden', backgroundColor: T.lo, borderWidth: 1, borderColor: T.bord, position: 'relative' }}>
                      <Image source={{ uri: photo.uri || photo.src }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.55)', padding: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 9, color: '#fff' }}>{photo.date?.slice(5)}</Text>
                        <TouchableOpacity onPress={() => removePhoto(photo.id)}>
                          <X size={10} color="rgba(255,255,255,0.8)" />
                        </TouchableOpacity>
                      </View>
                      {i === 0 && <View style={{ position: 'absolute', top: 4, left: 4, backgroundColor: T.success, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 }}>
                        <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 8, color: '#000' }}>НОВОЕ</Text>
                      </View>}
                    </View>
                  ))}
                </View>
              ) : (
                <TouchableOpacity onPress={pickPhoto} style={{ padding: 30, backgroundColor: T.lo, borderRadius: 12, borderWidth: 2, borderColor: T.bord, borderStyle: 'dashed', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 32 }}>📸</Text>
                  <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 13, color: T.muted, textAlign: 'center' }}>Добавь первое фото прогресса{'\n'}Снимай раз в 2-4 недели</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        {/* ═══ PAIN ═══ */}
        {sub === 'pain' && (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <View>
                <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 22, color: T.txt }}>Боль и асимметрия</Text>
                <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 12, color: T.muted }}>Фиксируй дискомфорт — замечай паттерны</Text>
              </View>
              <TouchableOpacity onPress={() => setAddPain(!addPain)} style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 9, backgroundColor: addPain ? T.lo : T.danger, borderWidth: addPain ? 1 : 0, borderColor: T.bord }}>
                <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 13, color: addPain ? T.muted : '#fff' }}>{addPain ? 'Отмена' : '+ Запись'}</Text>
              </TouchableOpacity>
            </View>

            {addPain && (
              <Card T={T} style={{ marginBottom: 12, borderWidth: 1, borderColor: T.danger + '55' }}>
                <Lbl T={T} style={{ marginBottom: 10 }}>Где болит?</Lbl>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {PAIN_ZONES.map(z => (
                    <TouchableOpacity key={z.id} onPress={() => setPainForm(f => ({ ...f, zone: z.id }))}
                      style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9, borderWidth: 1.5, borderColor: painForm.zone === z.id ? z.color : T.bord, backgroundColor: painForm.zone === z.id ? z.color + '22' : T.lo, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Text style={{ fontSize: 14 }}>{z.emoji}</Text>
                      <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 13, color: painForm.zone === z.id ? z.color : T.muted }}>{z.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {/* Side */}
                <Lbl T={T} style={{ marginBottom: 8 }}>Сторона</Lbl>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                  {[{ v: true, l: 'Правая' }, { v: false, l: 'Левая' }].map(s => (
                    <TouchableOpacity key={String(s.v)} onPress={() => setPainForm(f => ({ ...f, isRight: s.v }))}
                      style={{ flex: 1, height: 38, borderRadius: 9, borderWidth: 1.5, borderColor: painForm.isRight === s.v ? T.primary : T.bord, backgroundColor: painForm.isRight === s.v ? T.primary + '22' : T.lo, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 14, color: painForm.isRight === s.v ? T.primary : T.muted }}>{s.l}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {/* Intensity */}
                <Lbl T={T} style={{ marginBottom: 8 }}>Интенсивность: {['', 'Лёгкая', 'Умеренная', 'Сильная', 'Нестерпимая'][painForm.intensity]}</Lbl>
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
                  {[1, 2, 3, 4].map(n => (
                    <TouchableOpacity key={n} onPress={() => setPainForm(f => ({ ...f, intensity: n }))}
                      style={{ flex: 1, height: 36, borderRadius: 8, borderWidth: 1.5, borderColor: painForm.intensity === n ? [T.warn, T.warn, T.danger, T.danger][n - 1] : T.bord, backgroundColor: painForm.intensity === n ? [T.warn, T.warn, T.danger, T.danger][n - 1] + '22' : T.lo, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 15, color: painForm.intensity === n ? [T.warn, T.warn, T.danger, T.danger][n - 1] : T.muted }}>{n}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {/* Note */}
                <TextInput value={painForm.note} onChangeText={v => setPainForm(f => ({ ...f, note: v }))} placeholder="Описание (необязательно)…" placeholderTextColor={T.muted} multiline numberOfLines={2}
                  style={{ borderRadius: 8, borderWidth: 1.5, borderColor: T.bord, backgroundColor: T.lo, color: T.txt, fontFamily: 'Barlow_400Regular', fontSize: 14, padding: 10, minHeight: 60, textAlignVertical: 'top', marginBottom: 12 }} />
                <TouchableOpacity onPress={savePain} style={{ height: 40, borderRadius: 9, backgroundColor: T.danger, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 14, color: '#fff' }}>Сохранить запись</Text>
                </TouchableOpacity>
              </Card>
            )}

            {/* Frequency chart */}
            {painFrequency.length > 0 && (
              <Card T={T} style={{ marginBottom: 12 }}>
                <Lbl T={T} style={{ marginBottom: 10 }}>Частота за 30 дней</Lbl>
                {painFrequency.map(z => (
                  <View key={z.id} style={{ marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 13, color: T.txt }}>{z.emoji} {z.name}</Text>
                      <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 13, color: z.color }}>{z.count}×</Text>
                    </View>
                    <ProgressBar pct={(z.count / Math.max(...painFrequency.map(x => x.count))) * 100} color={z.color} T={T} height={5} />
                  </View>
                ))}
              </Card>
            )}

            {/* History */}
            {(painLog || []).length === 0 && !addPain && (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Text style={{ fontSize: 40, marginBottom: 10 }}>🩺</Text>
                <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 14, color: T.muted }}>Записей о боли нет</Text>
                <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 12, color: T.muted, marginTop: 4, textAlign: 'center' }}>Фиксируй дискомфорт чтобы{'\n'}замечать паттерны и избегать травм</Text>
              </View>
            )}
            {(painLog || []).slice(0, 10).map((entry: any) => {
              const zone = PAIN_ZONES.find(z => z.id === entry.zone) || PAIN_ZONES[0];
              return (
                <Card key={entry.id} T={T} style={{ marginBottom: 8, borderLeftWidth: 3, borderLeftColor: zone.color }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <Text style={{ fontSize: 18 }}>{zone.emoji}</Text>
                        <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 15, color: T.txt }}>{zone.name}</Text>
                        <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 12, color: T.muted }}>{entry.isRight ? 'Правая' : 'Левая'}</Text>
                        <View style={{ paddingHorizontal: 7, paddingVertical: 2, backgroundColor: zone.color + '22', borderRadius: 6 }}>
                          <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 11, color: zone.color }}>{entry.intensity}/4</Text>
                        </View>
                      </View>
                      <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 12, color: T.muted }}>{new Date(entry.date + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</Text>
                      {entry.note && <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 13, color: T.txt, marginTop: 4 }}>{entry.note}</Text>}
                    </View>
                    <TouchableOpacity onPress={() => setState(s => ({ ...s, painLog: (s.painLog || []).filter((x: any) => x.id !== entry.id) }))} style={{ opacity: 0.5, padding: 4 }}>
                      <X size={14} color={T.muted} />
                    </TouchableOpacity>
                  </View>
                </Card>
              );
            })}
          </>
        )}

        {/* ═══ REFLECTION ═══ */}
        {sub === 'reflection' && (
          <>
            <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 22, color: T.txt, marginBottom: 4 }}>Еженедельная рефлексия</Text>
            <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 13, color: T.muted, marginBottom: 14 }}>Воскресный чек-ин — ключ к настоящему росту</Text>

            {thisWeekRef && (
              <View style={{ padding: 10, paddingHorizontal: 14, backgroundColor: T.success + '15', borderWidth: 1, borderColor: T.success + '44', borderRadius: 10, marginBottom: 14 }}>
                <Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 13, color: T.success }}>✓ Рефлексия этой недели уже заполнена</Text>
              </View>
            )}

            <Card T={T} style={{ marginBottom: 12, borderWidth: 1, borderColor: T.primary + '44' }}>
              <Lbl T={T} style={{ marginBottom: 14 }}>📝 Чек-ин</Lbl>
              {([
                { key: 'went', emoji: '✅', label: 'Что получилось на этой неделе?' },
                { key: 'didnt', emoji: '🔧', label: 'Что можно улучшить?' },
                { key: 'focus', emoji: '🎯', label: 'Фокус следующей недели' },
              ] as { key: keyof typeof refForm; emoji: string; label: string }[]).map(({ key, emoji, label }) => (
                <View key={key} style={{ marginBottom: 14 }}>
                  <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 14, color: T.txt, marginBottom: 6 }}>{emoji} {label}</Text>
                  <TextInput value={refForm[key]} onChangeText={v => setRefForm(f => ({ ...f, [key]: v }))} placeholder="Напиши свои мысли…" placeholderTextColor={T.muted} multiline numberOfLines={3}
                    style={{ borderRadius: 10, borderWidth: 1.5, borderColor: T.bord, backgroundColor: T.lo, color: T.txt, fontFamily: 'Barlow_400Regular', fontSize: 14, padding: 12, minHeight: 80, textAlignVertical: 'top', lineHeight: 20 }} />
                </View>
              ))}
              <TouchableOpacity onPress={saveReflection} disabled={!refForm.went.trim() && !refForm.didnt.trim() && !refForm.focus.trim()}
                style={{ height: 44, borderRadius: 10, backgroundColor: T.success, alignItems: 'center', justifyContent: 'center', opacity: (!refForm.went.trim() && !refForm.didnt.trim() && !refForm.focus.trim()) ? 0.5 : 1 }}>
                <Text style={{ fontFamily: 'BarlowCondensed_900Black', fontSize: 15, color: '#000' }}>Сохранить рефлексию</Text>
              </TouchableOpacity>
            </Card>

            {/* Past reflections */}
            {(reflections || []).length > 0 && (
              <>
                <Lbl T={T} style={{ marginBottom: 10 }}>История рефлексий</Lbl>
                {(reflections || []).slice(0, 5).map((r: any) => (
                  <Card key={r.id} T={T} style={{ marginBottom: 8, borderLeftWidth: 3, borderLeftColor: T.success }}>
                    <Text style={{ fontFamily: 'BarlowCondensed_700Bold', fontSize: 13, color: T.muted, marginBottom: 8 }}>
                      {new Date(r.date + 'T12:00:00').toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </Text>
                    {r.went && <View style={{ marginBottom: 6 }}><Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 11, color: T.success, marginBottom: 2 }}>✅ Получилось</Text><Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 13, color: T.txt }}>{r.went}</Text></View>}
                    {r.didnt && <View style={{ marginBottom: 6 }}><Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 11, color: T.warn, marginBottom: 2 }}>🔧 Улучшить</Text><Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 13, color: T.txt }}>{r.didnt}</Text></View>}
                    {r.focus && <View><Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 11, color: T.primary, marginBottom: 2 }}>🎯 Фокус</Text><Text style={{ fontFamily: 'Barlow_400Regular', fontSize: 13, color: T.txt }}>{r.focus}</Text></View>}
                  </Card>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
