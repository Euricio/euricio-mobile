import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Switch, Alert, ActivityIndicator, RefreshControl, ViewStyle,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../../../lib/i18n';
import {
  useCalendarEvents, useCreateCalendarEvent, useUpdateCalendarEvent,
  useDeleteCalendarEvent, CalendarEvent, RedirectMode,
} from '../../../lib/api/busyStatus';
import { BusyRedirectOptions } from '../../../components/voice/BusyRedirectOptions';
import { Card } from '../../../components/ui/Card';
import { LoadingScreen } from '../../../components/ui/LoadingScreen';
import { EmptyState } from '../../../components/ui/EmptyState';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../../../constants/theme';

type FormState = {
  title: string; description: string; start_time: string; end_time: string;
  blocks_calls: boolean; announcement: string;
  redirect_mode: RedirectMode; redirect_agent_id: string | null; redirect_number: string;
};
const EMPTY: FormState = {
  title: '', description: '', start_time: '', end_time: '',
  blocks_calls: false, announcement: '',
  redirect_mode: 'next_in_flow', redirect_agent_id: null, redirect_number: '',
};

function isoToLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function BusyCalendarScreen() {
  const { t } = useI18n();
  const { data: events = [], isLoading, refetch } = useCalendarEvents();
  const createEvent = useCreateCalendarEvent();
  const updateEvent = useUpdateCalendarEvent();
  const deleteEvent = useDeleteCalendarEvent();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [refreshing, setRefreshing] = useState(false);

  function openNew() { setEditId(null); setForm(EMPTY); setShowForm(true); }
  function openEdit(ev: CalendarEvent) {
    setEditId(ev.id);
    setForm({
      title: ev.title, description: ev.description ?? '',
      start_time: isoToLocal(ev.start_time), end_time: isoToLocal(ev.end_time),
      blocks_calls: ev.blocks_calls, announcement: ev.announcement ?? '',
      redirect_mode: ev.redirect_mode ?? 'next_in_flow',
      redirect_agent_id: ev.redirect_agent_id, redirect_number: ev.redirect_number ?? '',
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.title || !form.start_time || !form.end_time) {
      Alert.alert(t('error'), t('required')); return;
    }
    const payload = {
      title: form.title, description: form.description || null,
      start_time: new Date(form.start_time).toISOString(),
      end_time: new Date(form.end_time).toISOString(),
      blocks_calls: form.blocks_calls, announcement: form.announcement || null,
      redirect_mode: form.redirect_mode, redirect_agent_id: form.redirect_agent_id,
      redirect_number: form.redirect_number || null,
    } as Omit<CalendarEvent, 'id' | 'created_at'>;
    try {
      if (editId) await updateEvent.mutateAsync({ id: editId, ...payload });
      else await createEvent.mutateAsync(payload);
      setShowForm(false);
    } catch (err) { Alert.alert(t('error'), err instanceof Error ? err.message : 'Error'); }
  }

  async function handleDelete(id: string) {
    Alert.alert(t('delete'), t('confirm_delete') || 'Löschen?', [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: async () => {
        try { await deleteEvent.mutateAsync(id); }
        catch (err) { Alert.alert(t('error'), err instanceof Error ? err.message : 'Error'); }
      }},
    ]);
  }

  async function onRefresh() { setRefreshing(true); await refetch(); setRefreshing(false); }
  if (isLoading) return <LoadingScreen />;
  const isMutating = createEvent.isPending || updateEvent.isPending;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{
        title: t('calendar_title'),
        headerRight: () => (
          <TouchableOpacity onPress={openNew} style={styles.headerBtn}>
            <Ionicons name="add" size={24} color={colors.primary} />
          </TouchableOpacity>
        ),
      }} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {showForm && (
          <Card style={styles.formCard}>
            <Text style={styles.formTitle}>{editId ? t('edit') : t('calendar_new_event')}</Text>
            <FieldLabel label={t('calendar_event_title')} required>
              <TextInput value={form.title} onChangeText={v => setForm(f=>({...f,title:v}))}
                placeholder={t('calendar_event_title')} style={styles.input} placeholderTextColor={colors.textTertiary} />
            </FieldLabel>
            <FieldLabel label={t('calendar_event_description')}>
              <TextInput value={form.description} onChangeText={v => setForm(f=>({...f,description:v}))}
                multiline numberOfLines={2} style={[styles.input,{textAlignVertical:'top',minHeight:56}]}
                placeholderTextColor={colors.textTertiary} />
            </FieldLabel>
            <FieldLabel label={t('calendar_event_start')} required>
              <TextInput value={form.start_time} onChangeText={v => setForm(f=>({...f,start_time:v}))}
                placeholder="YYYY-MM-DDTHH:MM" style={styles.input} placeholderTextColor={colors.textTertiary} />
            </FieldLabel>
            <FieldLabel label={t('calendar_event_end')} required>
              <TextInput value={form.end_time} onChangeText={v => setForm(f=>({...f,end_time:v}))}
                placeholder="YYYY-MM-DDTHH:MM" style={styles.input} placeholderTextColor={colors.textTertiary} />
            </FieldLabel>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>{t('calendar_blocks_calls')}</Text>
              <Switch value={form.blocks_calls} onValueChange={v => setForm(f=>({...f,blocks_calls:v}))}
                trackColor={{false:colors.border,true:colors.primaryLight}} thumbColor={form.blocks_calls?colors.primary:colors.surface} />
            </View>
            {form.blocks_calls && (
              <BusyRedirectOptions
                values={{announcement:form.announcement,redirect_mode:form.redirect_mode,redirect_agent_id:form.redirect_agent_id,redirect_number:form.redirect_number}}
                onChange={v => setForm(f=>({...f,...v}))}
              />
            )}
            <View style={styles.formButtons}>
              <TouchableOpacity style={[styles.btn,styles.btnPrimary]} onPress={handleSave} disabled={isMutating}>
                {isMutating ? <ActivityIndicator color="#fff" size="small"/> : <Text style={styles.btnPrimaryText}>{t('save')}</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn,styles.btnSecondary]} onPress={()=>setShowForm(false)}>
                <Text style={styles.btnSecondaryText}>{t('cancel')}</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}
        {events.length === 0 && !showForm
          ? <EmptyState icon="calendar-outline" title={t('calendar_no_events')} message="" />
          : events.map(ev => <EventCard key={ev.id} ev={ev} t={t} onEdit={openEdit} onDelete={handleDelete} />)
        }
      </ScrollView>
    </View>
  );
}

function FieldLabel({label,children,required}:{label:string;children:React.ReactNode;required?:boolean}) {
  return (
    <View style={{marginBottom:spacing.sm}}>
      <Text style={{fontSize:fontSize.xs,color:colors.textSecondary,marginBottom:4,fontWeight:fontWeight.medium}}>
        {label}{required && <Text style={{color:colors.error}}> *</Text>}
      </Text>
      {children}
    </View>
  );
}

function EventCard({ev,t,onEdit,onDelete}:{ev:CalendarEvent;t:(k:string)=>string;onEdit:(ev:CalendarEvent)=>void;onDelete:(id:string)=>void}) {
  const start=new Date(ev.start_time); const end=new Date(ev.end_time); const now=new Date();
  const isNow = start<=now && now<=end;
  const fmt=(d:Date)=>d.toLocaleString(undefined,{dateStyle:'short',timeStyle:'short'});
  return (
    <Card style={StyleSheet.flatten([styles.eventCard,ev.blocks_calls&&isNow&&styles.eventCardBusy]) as ViewStyle}>
      <View style={styles.eventHeader}>
        <Text style={styles.eventTitle} numberOfLines={1}>{ev.title}</Text>
        {ev.blocks_calls && <View style={[styles.badge,isNow&&styles.badgeActive]}><Ionicons name="call-outline" size={10} color={isNow?colors.error:colors.textSecondary}/></View>}
      </View>
      <Text style={styles.eventTime}>{fmt(start)} → {fmt(end)}</Text>
      {ev.description?<Text style={styles.eventDesc} numberOfLines={1}>{ev.description}</Text>:null}
      <View style={styles.eventActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={()=>onEdit(ev)}><Text style={styles.actionBtnText}>{t('edit')}</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn,styles.actionBtnDelete]} onPress={()=>onDelete(ev.id)}><Text style={styles.actionBtnDeleteText}>{t('delete')}</Text></TouchableOpacity>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:colors.background},
  content:{padding:spacing.md,gap:spacing.sm,paddingBottom:spacing.lg*2},
  headerBtn:{paddingRight:spacing.sm},
  formCard:{padding:spacing.lg,gap:spacing.xs,marginBottom:spacing.sm},
  formTitle:{fontSize:fontSize.lg,fontWeight:fontWeight.bold,color:colors.text,marginBottom:spacing.sm},
  input:{borderWidth:1,borderColor:colors.border,borderRadius:borderRadius.md,padding:spacing.sm,fontSize:fontSize.sm,color:colors.text,backgroundColor:colors.surface},
  toggleRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingVertical:spacing.xs},
  toggleLabel:{fontSize:fontSize.sm,color:colors.text,flex:1},
  formButtons:{flexDirection:'row',gap:spacing.sm,marginTop:spacing.md},
  btn:{flex:1,padding:spacing.md,borderRadius:borderRadius.md,alignItems:'center',justifyContent:'center'},
  btnPrimary:{backgroundColor:colors.primary},
  btnPrimaryText:{color:'#fff',fontWeight:fontWeight.bold,fontSize:fontSize.sm},
  btnSecondary:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},
  btnSecondaryText:{color:colors.text,fontSize:fontSize.sm},
  eventCard:{padding:spacing.md},
  eventCardBusy:{borderColor:colors.error,borderWidth:1},
  eventHeader:{flexDirection:'row',alignItems:'center',gap:spacing.xs,marginBottom:4},
  eventTitle:{fontSize:fontSize.md,fontWeight:fontWeight.semibold,color:colors.text,flex:1},
  badge:{width:18,height:18,borderRadius:9,backgroundColor:colors.borderLight,alignItems:'center',justifyContent:'center'},
  badgeActive:{backgroundColor:colors.errorLight},
  eventTime:{fontSize:fontSize.xs,color:colors.textSecondary},
  eventDesc:{fontSize:fontSize.xs,color:colors.textTertiary,marginTop:2},
  eventActions:{flexDirection:'row',gap:spacing.sm,marginTop:spacing.sm},
  actionBtn:{paddingHorizontal:spacing.sm,paddingVertical:spacing.xs,borderRadius:borderRadius.sm,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface},
  actionBtnText:{fontSize:fontSize.xs,color:colors.text},
  actionBtnDelete:{borderColor:'rgba(239,68,68,0.3)',backgroundColor:colors.errorLight},
  actionBtnDeleteText:{fontSize:fontSize.xs,color:colors.error},
});
