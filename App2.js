import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, SafeAreaView, StatusBar, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://juvutpigrmynfcmdlsem.supabase.co';
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
  '.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1dnV0cGlncm15bmZjbWRsc2VtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2OTQ2NzEsImV4cCI6MjA4OTI3MDY3MX0' +
  '.wAgg02hPSDbvDIHvet6plIkop9AXzMXoW2jEaXdDnh4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true }
});

const C = {
  bg:'#0F0F0D', card:'#191917', border:'rgba(255,255,255,0.07)',
  accent:'#C9A84C', text:'#F0EBE0', muted:'#777', dim:'#383836',
  teal:'#4ECDC4', red:'#E07B7B',
};

const MONTHS=['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const MSHORT=['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
const WEEKDAYS=['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];

const HABITS=[
  'Спорт','Чтение','Сон 8ч','Запуск проекта',
  'Доброе дело','Закаливание','Новые идеи',
  'Практика навыка','Утро без телефона','Мысль дня','Итоги дня'
];
const HCOLORS=['#6C8EBF','#82B366','#D6A520','#A569BD','#E07B7B','#45B8AC','#C9A84C','#7FB3D3','#E07B7B','#82B366','#6C8EBF'];

const AREAS=[
  {key:'career',label:'Карьера',icon:'💼',color:'#6C8EBF'},
  {key:'finance',label:'Финансы',icon:'💰',color:'#82B366'},
  {key:'creative',label:'Творчество',icon:'🎨',color:'#D6A520'},
  {key:'growth',label:'Развитие',icon:'📚',color:'#A569BD'},
  {key:'relations',label:'Отношения',icon:'❤️',color:'#E07B7B'},
  {key:'spirit',label:'Духовность',icon:'🧘',color:'#45B8AC'},
];

const getDays=(y,m)=>new Date(y,m+1,0).getDate();
const getWeekday=(y,m,d)=>new Date(y,m,d).getDay();

function useCloudStore(key, init, userId) {
  const [val, setVal] = useState(init);
  useEffect(() => {
    AsyncStorage.getItem(key).then(r => {
      if (r) try { setVal(JSON.parse(r)); } catch (e) {}
    });
    if (userId) {
      supabase.from('tracker_data')
        .select('data_value')
        .eq('user_id', userId)
        .eq('data_key', key)
        .single()
        .then(({ data }) => {
          if (data && data.data_value) {
            setVal(data.data_value);
            AsyncStorage.setItem(key, JSON.stringify(data.data_value));
          }
        });
    }
  }, [userId, key]);
  const save = useCallback((v) => {
    setVal(v);
    AsyncStorage.setItem(key, JSON.stringify(v));
    if (userId) {
      supabase.from('tracker_data').upsert({
        user_id: userId, data_key: key,
        data_value: v, updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,data_key' });
    }
  }, [userId, key]);
  return [val, save];
}

const SLabel = ({t}) => (
  <Text style={{fontSize:9,color:'#444',letterSpacing:2,marginBottom:10,fontWeight:'600'}}>{t}</Text>
);
const Bar = ({pct,color,h=4}) => (
  <View style={{height:h,backgroundColor:'rgba(255,255,255,0.07)',borderRadius:h/2,overflow:'hidden'}}>
    <View style={{height:'100%',width:`${Math.min(pct,100)}%`,backgroundColor:color,borderRadius:h/2}}/>
  </View>
);
const Checkbox = ({done,color,onPress,size=18}) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{
    width:size,height:size,borderRadius:3,borderWidth:1.5,
    borderColor:done?color:'#333',backgroundColor:done?color:'transparent',
    alignItems:'center',justifyContent:'center',flexShrink:0
  }}>
    {done&&<Text style={{fontSize:size*0.6,color:'#111',fontWeight:'bold',lineHeight:size*0.8}}>✓</Text>}
  </TouchableOpacity>
);

function AuthScreen() {
  const [email,setEmail]=useState('');
  const [pass,setPass]=useState('');
  const [mode,setMode]=useState('login');
  const [loading,setLoading]=useState(false);
  const [msg,setMsg]=useState('');
  const submit=async()=>{
    if(!email.trim()||!pass.trim()){setMsg('Заполни все поля');return;}
    setLoading(true);setMsg('');
    try{
      let res;
      if(mode==='login') res=await supabase.auth.signInWithPassword({email,password:pass});
      else res=await supabase.auth.signUp({email,password:pass});
      if(res.error) setMsg(res.error.message);
      else if(mode==='register') setMsg('✅ Проверь email — подтверди регистрацию');
    } finally {setLoading(false);}
  };
  return (
    <KeyboardAvoidingView style={{flex:1,backgroundColor:C.bg}} behavior={Platform.OS==='ios'?'padding':undefined}>
      <ScrollView contentContainerStyle={{flexGrow:1,justifyContent:'center',padding:28}}>
        <Text style={{fontSize:30,color:C.accent,fontStyle:'italic',textAlign:'center',marginBottom:4}}>Productivity</Text>
        <Text style={{fontSize:30,color:'#E8D8BC',fontStyle:'italic',textAlign:'center',marginBottom:48}}>Tracker</Text>
        <View style={{flexDirection:'row',backgroundColor:C.card,borderRadius:12,
          borderWidth:1,borderColor:C.border,padding:4,marginBottom:24}}>
          {[['login','Войти'],['register','Регистрация']].map(([k,l])=>(
            <TouchableOpacity key={k} onPress={()=>{setMode(k);setMsg('');}} activeOpacity={0.8}
              style={{flex:1,paddingVertical:12,borderRadius:8,alignItems:'center',
                backgroundColor:mode===k?C.accent:'transparent'}}>
              <Text style={{fontSize:14,color:mode===k?'#111':C.muted,fontWeight:mode===k?'600':'400'}}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={{fontSize:11,color:C.muted,letterSpacing:1,marginBottom:8}}>EMAIL</Text>
        <TextInput value={email} onChangeText={setEmail} placeholder="your@email.com"
          placeholderTextColor={C.dim} keyboardType="email-address" autoCapitalize="none"
          style={[S.input,{marginBottom:16,fontSize:15}]}/>
        <Text style={{fontSize:11,color:C.muted,letterSpacing:1,marginBottom:8}}>ПАРОЛЬ</Text>
        <TextInput value={pass} onChangeText={setPass} placeholder="Минимум 6 символов"
          placeholderTextColor={C.dim} secureTextEntry style={[S.input,{marginBottom:24,fontSize:15}]}/>
        {msg?<Text style={{fontSize:13,color:msg.startsWith('✅')?C.teal:C.red,
          textAlign:'center',marginBottom:16,lineHeight:20}}>{msg}</Text>:null}
        <TouchableOpacity onPress={submit} disabled={loading} activeOpacity={0.8}
          style={{backgroundColor:C.accent,borderRadius:12,padding:16,alignItems:'center'}}>
          {loading?<ActivityIndicator color="#111"/>:
            <Text style={{fontSize:16,color:'#111',fontWeight:'700'}}>{mode==='login'?'Войти':'Создать аккаунт'}</Text>}
        </TouchableOpacity>
        <Text style={{fontSize:12,color:C.dim,textAlign:'center',marginTop:28,lineHeight:18}}>
          {'Данные синхронизируются между\nвсеми твоими устройствами ☁️'}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function TrackerScreen({userId}) {
  const now=new Date(); const YEAR=2026;
  const [month,setMonth]=useState(now.getMonth());
  const [checks,setChecks]=useCloudStore('checks',{},userId);
  const days=getDays(YEAR,month);
  const nums=Array.from({length:days},(_,i)=>i+1);
  const toggle=(h,d)=>{const k=`${month}-${h}-${d}`;setChecks({...checks,[k]:!checks[k]});};

  const stats=HABITS.map((h,i)=>{
    const done=nums.filter(d=>checks[`${month}-${h}-${d}`]).length;
    return {h,done,pct:Math.round(done/days*100),col:HCOLORS[i]};
  });

  const dayScores=nums.map(d=>HABITS.filter(h=>checks[`${month}-${h}-${d}`]).length);
  const overall=Math.round(stats.reduce((a,s)=>a+s.pct,0)/stats.length);
  const today=now.getDate(); const isCur=month===now.getMonth();

  const whoAreYou=()=>{
    if(overall>=80) return {text:'🏆 Чемпион дисциплины!\nТы системный человек.',color:C.teal};
    if(overall>=60) return {text:'💪 Боец!\nТы стараешься каждый день.',color:C.accent};
    if(overall>=40) return {text:'🌱 Новичок!\nТы на верном пути.',color:'#82B366'};
    return {text:'😴 Спящий!\nПора просыпаться.',color:C.red};
  };
  const who=whoAreYou();

  return (
    <ScrollView style={{flex:1}} showsVerticalScrollIndicator={false}>
      {/* Month nav */}
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'center',padding:16,gap:12}}>
        <TouchableOpacity onPress={()=>setMonth(m=>Math.max(0,m-1))} style={S.navBtn}>
          <Text style={{color:C.muted,fontSize:22,lineHeight:28}}>‹</Text>
        </TouchableOpacity>
        <Text style={{fontSize:22,color:'#E8D8BC',fontStyle:'italic',minWidth:170,textAlign:'center'}}>
          {MONTHS[month]}
        </Text>
        <TouchableOpacity onPress={()=>setMonth(m=>Math.min(11,m+1))} style={S.navBtn}>
          <Text style={{color:C.muted,fontSize:22,lineHeight:28}}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Habit grid */}
      <View style={[S.card,{marginHorizontal:14,marginBottom:14,padding:0,overflow:'hidden'}]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* Header: weekdays */}
            <View style={{flexDirection:'row',backgroundColor:'#141412'}}>
              <View style={{width:130,padding:8,justifyContent:'center'}}>
                <Text style={{fontSize:9,color:C.muted,letterSpacing:1}}>ПОВСЕДНЕВНЫЕ ПРИВЫЧКИ</Text>
              </View>
              {nums.map(d=>{
                const wd=getWeekday(YEAR,month,d);
                const isToday=isCur&&d===today;
                const isSun=wd===0; const isSat=wd===6;
                return (
                  <View key={d} style={{width:28,alignItems:'center',paddingVertical:6,
                    backgroundColor:isToday?'rgba(201,168,76,0.15)':'transparent'}}>
                    <Text style={{fontSize:7,color:isSun||isSat?C.accent:C.muted,marginBottom:2}}>
                      {WEEKDAYS[wd]}
                    </Text>
                    <Text style={{fontSize:10,color:isToday?C.accent:isSun||isSat?C.accent:'#777',
                      fontWeight:isToday?'bold':'normal'}}>{d}</Text>
                  </View>
                );
              })}
            </View>

            {/* Habit rows */}
            {HABITS.map((h,hi)=>{
              const st=stats[hi];
              return (
                <View key={h} style={{flexDirection:'row',alignItems:'center',
                  borderTopWidth:1,borderTopColor:'rgba(255,255,255,0.05)'}}>
                  <View style={{width:130,paddingHorizontal:10,paddingVertical:8,flexDirection:'row',alignItems:'center',gap:6}}>
                    <View style={{width:3,height:16,borderRadius:2,backgroundColor:st.col}}/>
                    <Text style={{fontSize:11,color:'#C0B8A8',flex:1}} numberOfLines={1}>{h}</Text>
                  </View>
                  {nums.map(d=>{
                    const on=checks[`${month}-${h}-${d}`];
                    const isToday=isCur&&d===today;
                    return (
                      <TouchableOpacity key={d} onPress={()=>toggle(h,d)}
                        style={{width:28,height:36,alignItems:'center',justifyContent:'center',
                          backgroundColor:isToday?'rgba(201,168,76,0.08)':'transparent'}}
                        activeOpacity={0.7}>
                        <View style={{width:16,height:16,borderRadius:3,
                          borderWidth:1.5,borderColor:on?st.col:'#2a2a2a',
                          backgroundColor:on?st.col:'transparent',
                          alignItems:'center',justifyContent:'center'}}>
                          {on&&<Text style={{fontSize:9,color:'#111',fontWeight:'bold'}}>✓</Text>}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })}

            {/* Stats rows */}
            {[
              {label:'Прогресс%', vals:nums.map(d=>{
                const done=HABITS.filter(h=>checks[`${month}-${h}-${d}`]).length;
                return done===0?'':Math.round(done/HABITS.length*100)+'%';
              }), color:C.teal},
              {label:'Заполнено', vals:nums.map(d=>
                HABITS.filter(h=>checks[`${month}-${h}-${d}`]).length||''), color:'#82B366'},
              {label:'Незаполнено', vals:nums.map(d=>{
                const done=HABITS.filter(h=>checks[`${month}-${h}-${d}`]).length;
                return done===0&&!nums.includes(d)?'':HABITS.length-done||'';
              }), color:C.red},
            ].map(row=>(
              <View key={row.label} style={{flexDirection:'row',alignItems:'center',
                borderTopWidth:1,borderTopColor:'rgba(255,255,255,0.08)',
                backgroundColor:'rgba(255,255,255,0.02)'}}>
                <View style={{width:130,paddingHorizontal:10,paddingVertical:6}}>
                  <Text style={{fontSize:10,color:row.color,fontWeight:'600'}}>{row.label}</Text>
                </View>
                {row.vals.map((v,i)=>(
                  <View key={i} style={{width:28,alignItems:'center',paddingVertical:6}}>
                    <Text style={{fontSize:9,color:v?row.color:C.dim}}>{v}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Chart + Who are you */}
      <View style={{flexDirection:'row',marginHorizontal:14,marginBottom:14,gap:12}}>
        {/* Who are you */}
        <View style={[S.card,{flex:1,justifyContent:'center',alignItems:'center',minHeight:120}]}>
          <Text style={{fontSize:11,color:C.muted,letterSpacing:2,marginBottom:8}}>КТО ТЫ ЕСТЬ?</Text>
          <Text style={{fontSize:13,color:who.color,textAlign:'center',lineHeight:20,fontStyle:'italic'}}>
            {who.text}
          </Text>
          <View style={{marginTop:12,width:'100%'}}>
            <Bar pct={overall} color={who.color} h={5}/>
            <Text style={{fontSize:10,color:who.color,textAlign:'center',marginTop:4}}>{overall}%</Text>
          </View>
        </View>

        {/* Bar chart with numbers */}
        <View style={[S.card,{flex:2,paddingHorizontal:8}]}>
          <SLabel t="ГРАФИК"/>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{flexDirection:'row',alignItems:'flex-end',height:80,paddingBottom:14,gap:2}}>
              {dayScores.map((sc,i)=>{
                const d=i+1; const isT=isCur&&d===today;
                const maxH=60;
                const barH=sc>0?Math.max(sc/HABITS.length*maxH,4):2;
                const col=sc>=HABITS.length*0.8?C.teal:sc>=HABITS.length*0.5?C.accent:'#2e2e2c';
                return (
                  <View key={d} style={{alignItems:'center',width:18}}>
                    {sc>0&&<Text style={{fontSize:7,color:col,marginBottom:2}}>{sc}</Text>}
                    <View style={{width:12,height:barH,
                      backgroundColor:isT?col:col+'99',borderRadius:2,marginBottom:2}}/>
                    <Text style={{fontSize:6,color:isT?C.accent:C.dim}}>{d}</Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Top habits */}
      <View style={[S.card,{marginHorizontal:14,marginBottom:28}]}>
        <SLabel t="ТОП ПРИВЫЧЕК"/>
        {[...stats].sort((a,b)=>b.pct-a.pct).slice(0,5).map((s,i)=>(
          <View key={s.h} style={{flexDirection:'row',alignItems:'center',paddingVertical:7,
            borderBottomWidth:1,borderBottomColor:'rgba(255,255,255,0.04)'}}>
            <Text style={{fontSize:11,color:C.accent,width:24}}>#{i+1}</Text>
            <Text style={{fontSize:12,color:'#B0A898',flex:1}}>{s.h}</Text>
            <Text style={{fontSize:11,color:C.muted,marginRight:8}}>{s.done}д</Text>
            <Text style={{fontSize:12,fontWeight:'bold',color:s.pct>=70?C.teal:C.accent}}>{s.pct}%</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function TasksScreen({userId}) {
  const now=new Date(); const YEAR=2026;
  const [mode,setMode]=useState('weekly');
  const [month]=useState(now.getMonth());
  const [selDay,setSelDay]=useState(now.getDate());
  const [weekly,setWeekly]=useCloudStore('weekly',{},userId);
  const [daily,setDaily]=useCloudStore('daily',{},userId);
  const [wIn,setWIn]=useState({});
  const [dIn,setDIn]=useState('');
  const days=getDays(YEAR,month);
  const nums=Array.from({length:days},(_,i)=>i+1);
  const weeks=Array.from({length:Math.ceil(days/7)},(_,i)=>({idx:i,s:i*7+1,e:Math.min((i+1)*7,days)}));
  const addW=(wi)=>{const t=(wIn[wi]||'').trim();if(!t)return;
    setWeekly({...weekly,[wi]:[...(weekly[wi]||[]),{id:Date.now(),text:t,done:false}]});
    setWIn(p=>({...p,[wi]:''}));};
  const togW=(wi,id)=>setWeekly({...weekly,[wi]:(weekly[wi]||[]).map(t=>t.id===id?{...t,done:!t.done}:t)});
  const delW=(wi,id)=>setWeekly({...weekly,[wi]:(weekly[wi]||[]).filter(t=>t.id!==id)});
  const dk=`${month}-${selDay}`;
  const addD=()=>{const t=dIn.trim();if(!t)return;
    setDaily({...daily,[dk]:[...(daily[dk]||[]),{id:Date.now(),text:t,done:false}]});
    setDIn('');};
  const togD=(id)=>setDaily({...daily,[dk]:(daily[dk]||[]).map(t=>t.id===id?{...t,done:!t.done}:t)});
  const delD=(id)=>setDaily({...daily,[dk]:(daily[dk]||[]).filter(t=>t.id!==id)});
  return (
    <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}>
      <View style={{flexDirection:'row',margin:14,backgroundColor:C.card,
        borderRadius:10,borderWidth:1,borderColor:C.border,padding:4}}>
        {[['weekly','📋 По неделям'],['daily','🎯 На день']].map(([k,l])=>(
          <TouchableOpacity key={k} onPress={()=>setMode(k)} activeOpacity={0.8}
            style={{flex:1,paddingVertical:10,borderRadius:8,alignItems:'center',
              backgroundColor:mode===k?C.accent:'transparent'}}>
            <Text style={{fontSize:13,color:mode===k?'#111':C.muted,fontWeight:mode===k?'600':'400'}}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {mode==='weekly'?(
          <View style={{padding:14}}>
            {weeks.map(w=>{
              const tasks=weekly[w.idx]||[];
              const done=tasks.filter(t=>t.done).length;
              return (
                <View key={w.idx} style={[S.card,{marginBottom:12}]}>
                  <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:8}}>
                    <Text style={{fontSize:11,color:C.accent}}>Неделя {w.idx+1} · {w.s}–{w.e} {MSHORT[month]}</Text>
                    {tasks.length>0&&<Text style={{fontSize:11,fontWeight:'bold',
                      color:done===tasks.length?C.teal:C.accent}}>{done}/{tasks.length}</Text>}
                  </View>
                  {tasks.length>0&&<><Bar pct={tasks.length?done/tasks.length*100:0} color={done===tasks.length?C.teal:C.accent} h={3}/><View style={{height:8}}/></>}
                  {tasks.map(t=>(
                    <View key={t.id} style={{flexDirection:'row',alignItems:'center',paddingVertical:8,gap:10}}>
                      <Checkbox done={t.done} color={C.accent} onPress={()=>togW(w.idx,t.id)}/>
                      <Text style={{flex:1,fontSize:14,color:t.done?C.dim:'#C8C0B0',
                        textDecorationLine:t.done?'line-through':'none'}}>{t.text}</Text>
                      <TouchableOpacity onPress={()=>delW(w.idx,t.id)}>
                        <Text style={{fontSize:18,color:C.dim}}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  <View style={{flexDirection:'row',gap:8,marginTop:6}}>
                    <TextInput value={wIn[w.idx]||''} onChangeTe
