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
const HABITS=['💧 Вода','🏃 Спорт','📚 Чтение','🧘 Медитация','🥗 Питание','😴 Сон 8ч','📵 Без соцсетей','✍️ Дневник'];
const HCOLORS=['#6C8EBF','#82B366','#D6A520','#A569BD','#E07B7B','#45B8AC','#C9A84C','#7FB3D3'];
const AREAS=[
  {key:'career',label:'Карьера',icon:'💼',color:'#6C8EBF'},
  {key:'finance',label:'Финансы',icon:'💰',color:'#82B366'},
  {key:'creative',label:'Творчество',icon:'🎨',color:'#D6A520'},
  {key:'growth',label:'Развитие',icon:'📚',color:'#A569BD'},
  {key:'relations',label:'Отношения',icon:'❤️',color:'#E07B7B'},
  {key:'spirit',label:'Духовность',icon:'🧘',color:'#45B8AC'},
];
const getDays=(y,m)=>new Date(y,m+1,0).getDate();

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
    width:size,height:size,borderRadius:4,borderWidth:1.5,
    borderColor:done?color:'#2e2e2e',backgroundColor:done?color:'transparent',
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
  const overall=Math.round(stats.reduce((a,s)=>a+s.pct,0)/stats.length);
  const totalDone=stats.reduce((a,s)=>a+s.done,0);
  const dayScores=nums.map(d=>Math.round(HABITS.filter(h=>checks[`${month}-${h}-${d}`]).length/HABITS.length*100));
  const today=now.getDate(); const isCur=month===now.getMonth();
  return (
    <ScrollView style={{flex:1}} showsVerticalScrollIndicator={false}>
      <View style={{flexDirection:'row',alignItems:'center',justifyContent:'center',padding:16,gap:12}}>
        <TouchableOpacity onPress={()=>setMonth(m=>Math.max(0,m-1))} style={S.navBtn}>
          <Text style={{color:C.muted,fontSize:22,lineHeight:28}}>‹</Text>
        </TouchableOpacity>
        <Text style={{fontSize:20,color:'#E8D8BC',fontStyle:'italic',minWidth:170,textAlign:'center'}}>
          {MONTHS[month]} {YEAR}
        </Text>
        <TouchableOpacity onPress={()=>setMonth(m=>Math.min(11,m+1))} style={S.navBtn}>
          <Text style={{color:C.muted,fontSize:22,lineHeight:28}}>›</Text>
        </TouchableOpacity>
      </View>
      <View style={[S.card,{flexDirection:'row',justifyContent:'space-around',marginHorizontal:14,marginBottom:14}]}>
        <View style={{alignItems:'center'}}>
          <Text style={{fontSize:28,color:C.accent,fontStyle:'italic'}}>{totalDone}</Text>
          <Text style={{fontSize:9,color:C.muted,letterSpacing:1,marginTop:2}}>ВЫПОЛНЕНО</Text>
        </View>
        <View style={{width:1,backgroundColor:C.border}}/>
        <View style={{alignItems:'center'}}>
          <Text style={{fontSize:28,color:overall>=70?C.teal:C.accent,fontStyle:'italic'}}>{overall}%</Text>
          <Text style={{fontSize:9,color:C.muted,letterSpacing:1,marginTop:2}}>ПРОДУКТИВНОСТЬ</Text>
        </View>
      </View>
      <View style={[S.card,{marginHorizontal:14,marginBottom:14,padding:0,overflow:'hidden'}]}>
        <View style={{padding:14,paddingBottom:8}}><SLabel t="ТРЕКЕР ПРИВЫЧЕК"/></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            <View style={{flexDirection:'row',paddingLeft:108,paddingBottom:4}}>
              {nums.map(d=>(
                <View key={d} style={{width:24,alignItems:'center'}}>
                  <Text style={{fontSize:8,color:isCur&&d===today?C.accent:C.dim}}>{d}</Text>
                </View>
              ))}
              <View style={{width:58}}/><View style={{width:28}}/>
            </View>
            {HABITS.map((h,hi)=>{
              const st=stats[hi];
              return (
                <View key={h} style={{flexDirection:'row',alignItems:'center',
                  borderTopWidth:1,borderTopColor:'rgba(255,255,255,0.04)',paddingVertical:5}}>
                  <Text style={{width:108,fontSize:10,color:'#B8B0A0',paddingHorizontal:10}} numberOfLines={1}>{h}</Text>
                  {nums.map(d=>{
                    const on=checks[`${month}-${h}-${d}`];
                    return (
                      <TouchableOpacity key={d} onPress={()=>toggle(h,d)}
                        style={{width:24,alignItems:'center',justifyContent:'center'}} activeOpacity={0.7}>
                        <View style={{width:14,height:14,borderRadius:3,
                          borderWidth:1.5,borderColor:on?st.col:'#2a2a2a',
                          backgroundColor:on?st.col:'transparent',
                          alignItems:'center',justifyContent:'center'}}>
                          {on&&<Text style={{fontSize:8,color:'#111',fontWeight:'bold'}}>✓</Text>}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                  <View style={{width:58,paddingHorizontal:6}}><Bar pct={st.pct} color={st.col}/></View>
                  <Text style={{width:28,fontSize:10,fontWeight:'bold',color:st.col,textAlign:'right',paddingRight:10}}>{st.pct}</Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
      <View style={[S.card,{marginHorizontal:14,marginBottom:14}]}>
        <SLabel t="ГРАФИК ДИСЦИПЛИНЫ"/>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{flexDirection:'row',alignItems:'flex-end',height:72,paddingBottom:16,gap:2}}>
            {dayScores.map((sc,i)=>{
              const d=i+1; const isT=isCur&&d===today;
              const col=sc>=80?C.teal:sc>=50?C.accent:'#2e2e2c';
              return (
                <View key={d} style={{alignItems:'center',width:16}}>
                  <View style={{width:11,height:Math.max(sc*0.55,2),
                    backgroundColor:isT?col:col+'99',borderRadius:2,marginBottom:3}}/>
                  <Text style={{fontSize:6.5,color:isT?C.accent:C.dim}}>{d}</Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
      <View style={[S.card,{marginHorizontal:14,marginBottom:28}]}>
        <SLabel t="ТОП ПРИВЫЧЕК"/>
        {[...stats].sort((a,b)=>b.pct-a.pct).slice(0,4).map((s,i)=>(
          <View key={s.h} style={{flexDirection:'row',alignItems:'center',paddingVertical:8,
            borderBottomWidth:1,borderBottomColor:'rgba(255,255,255,0.04)'}}>
            <Text style={{fontSize:11,color:C.accent,width:24}}>#{i+1}</Text>
            <Text style={{fontSize:12,color:'#B0A898',flex:1}}>{s.h}</Text>
            <Text style={{fontSize:11,color:C.muted,marginRight:10}}>{s.done}д</Text>
            <Text style={{fontSize:12,fontWeight:'bold',color:s.pct>=70?C.teal:C.accent}}>{s.pct}%</Text>
          </View>
        ))}
        <View style={{marginTop:12,padding:12,backgroundColor:'rgba(255,255,255,0.03)',borderRadius:8}}>
          <Text style={{fontSize:13,color:C.muted,lineHeight:20}}>
            {overall>=80?'🏆 Ты — машина дисциплины!':overall>=50?'💪 Хороший прогресс!':'🌱 Начало пути. Каждый шаг важен.'}
          </Text>
        </View>
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
                    <TextInput value={wIn[w.idx]||''} onChangeText={v=>setWIn(p=>({...p,[w.idx]:v}))}
                      onSubmitEditing={()=>addW(w.idx)} placeholder="Добавить задачу..."
                      placeholderTextColor={C.dim} style={S.input}/>
                    <TouchableOpacity onPress={()=>addW(w.idx)} style={S.addBtn}>
                      <Text style={{fontSize:22,color:'#111',fontWeight:'bold',lineHeight:30}}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        ):(
          <View style={{padding:14}}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:14}}>
              <View style={{flexDirection:'row',gap:5}}>
                {nums.map(d=>{
                  const isT=d===now.getDate()&&month===now.getMonth();
                  const k=`${month}-${d}`;
                  const tasks=daily[k]||[];
                  const allDone=tasks.length>0&&tasks.every(t=>t.done);
                  return (
                    <TouchableOpacity key={d} onPress={()=>setSelDay(d)} activeOpacity={0.7}
                      style={{width:38,height:44,borderRadius:8,alignItems:'center',justifyContent:'center',
                        backgroundColor:selDay===d?C.accent:'rgba(255,255,255,0.05)',
                        borderWidth:isT&&selDay!==d?1:0,borderColor:C.accent}}>
                      <Text style={{fontSize:13,color:selDay===d?'#111':isT?C.accent:C.muted}}>{d}</Text>
                      {tasks.length>0&&<View style={{width:4,height:4,borderRadius:2,marginTop:2,
                        backgroundColor:allDone?C.teal:C.accent}}/>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            <View style={S.card}>
              <Text style={{fontSize:12,color:C.accent,marginBottom:12}}>{selDay} {MONTHS[month]}</Text>
              {(daily[dk]||[]).length===0&&
                <Text style={{fontSize:13,color:C.dim,fontStyle:'italic',marginBottom:10}}>Нет целей на этот день</Text>}
              {(daily[dk]||[]).map(t=>(
                <View key={t.id} style={{flexDirection:'row',alignItems:'center',paddingVertical:8,gap:10,
                  borderBottomWidth:1,borderBottomColor:'rgba(255,255,255,0.04)'}}>
                  <Checkbox done={t.done} color={C.teal} onPress={()=>togD(t.id)}/>
                  <Text style={{flex:1,fontSize:14,color:t.done?C.dim:'#C8C0B0',
                    textDecorationLine:t.done?'line-through':'none'}}>{t.text}</Text>
                  <TouchableOpacity onPress={()=>delD(t.id)}>
                    <Text style={{fontSize:18,color:C.dim}}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <View style={{flexDirection:'row',gap:8,marginTop:10}}>
                <TextInput value={dIn} onChangeText={setDIn} onSubmitEditing={addD}
                  placeholder="Добавить цель..." placeholderTextColor={C.dim} style={S.input}/>
                <TouchableOpacity onPress={addD} style={S.addBtn}>
                  <Text style={{fontSize:22,color:'#111',fontWeight:'bold',lineHeight:30}}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        <View style={{height:20}}/>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function OverviewScreen({userId}) {
  const now=new Date(); const YEAR=2026;
  const [checks]=useCloudStore('checks',{},userId);
  const [focus,setFocus]=useState(now.getMonth());
  const monthlyPct=MONTHS.map((_,mi)=>{
    const d=getDays(YEAR,mi); const total=HABITS.length*d;
    const done=HABITS.reduce((acc,h)=>acc+Array.from({length:d},(_,i)=>checks[`${mi}-${h}-${i+1}`]?1:0).reduce((a,b)=>a+b,0),0);
    return total?Math.round(done/total*100):0;
  });
  const fd=getDays(YEAR,focus);
  const fnums=Array.from({length:fd},(_,i)=>i+1);
  const fStats=HABITS.map((h,i)=>{
    const done=fnums.filter(d=>checks[`${focus}-${h}-${d}`]).length;
    return {h,done,pct:Math.round(done/fd*100),col:HCOLORS[i]};
  });
  const overall=Math.round(fStats.reduce((a,s)=>a+s.pct,0)/fStats.length);
  const total=fStats.reduce((a,s)=>a+s.done,0);
  const dayScores=fnums.map(d=>Math.round(HABITS.filter(h=>checks[`${focus}-${h}-${d}`]).length/HABITS.length*100));
  const great=dayScores.filter(s=>s>=80).length;
  return (
    <ScrollView style={{flex:1}} showsVerticalScrollIndicator={false}>
      <View style={{padding:14}}>
        <Text style={{fontSize:20,color:'#E8D8BC',fontStyle:'italic',marginBottom:16}}>Годовой обзор — {YEAR}</Text>
        <View style={[S.card,{marginBottom:16}]}>
          <SLabel t="% ВЫПОЛНЕНИЯ ПО МЕСЯЦАМ"/>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{flexDirection:'row',alignItems:'flex-end',height:130,paddingBottom:18,gap:4}}>
              {monthlyPct.map((p,i)=>{
                const col=p>=80?C.teal:p>=50?C.accent:'#2a2a28'; const isA=i===focus;
                return (
                  <TouchableOpacity key={i} onPress={()=>setFocus(i)} activeOpacity={0.7}
                    style={{width:30,alignItems:'center',justifyContent:'flex-end'}}>
                    {p>0&&<Text style={{fontSize:8,color:col,marginBottom:3,fontWeight:'bold'}}>{p}%</Text>}
                    <View style={{width:22,height:Math.max(p*1.1,4),backgroundColor:isA?col:col+'66',
                      borderRadius:2,borderWidth:isA?1:0,borderColor:col,marginBottom:4}}/>
                    <Text style={{fontSize:8,color:isA?C.accent:C.dim}}>{MSHORT[i]}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
        <Text style={{fontSize:15,color:C.accent,fontStyle:'italic',marginBottom:12}}>{MONTHS[focus]}</Text>
        <View style={{flexDirection:'row',gap:10,marginBottom:16}}>
          {[[total,'действий',C.accent],[`${overall}%`,'продуктивность',overall>=70?C.teal:C.accent],[great,'отл. дней','#A569BD']].map(([v,l,col],i)=>(
            <View key={i} style={[S.card,{flex:1,alignItems:'center',borderTopWidth:2,borderTopColor:col,padding:12}]}>
              <Text style={{fontSize:22,color:col,fontStyle:'italic',fontWeight:'bold'}}>{v}</Text>
              <Text style={{fontSize:9,color:C.muted,marginTop:3,textAlign:'center'}}>{l}</Text>
            </View>
          ))}
        </View>
        <View style={[S.card,{marginBottom:28}]}>
          <SLabel t="ПРИВЫЧКИ — СВОДКА"/>
          {fStats.map(s=>(
            <View key={s.h} style={{flexDirection:'row',alignItems:'center',gap:8,
              paddingVertical:10,borderBottomWidth:1,borderBottomColor:'rgba(255,255,255,0.04)'}}>
              <Text style={{width:110,fontSize:11,color:'#B8B0A0'}} numberOfLines={1}>{s.h}</Text>
              <View style={{flex:1}}><Bar pct={s.pct} color={s.col}/></View>
              <Text style={{fontSize:10,color:C.muted,width:34,textAlign:'right'}}>{s.done}/{fd}</Text>
              <Text style={{fontSize:11,fontWeight:'bold',color:s.col,width:32,textAlign:'right'}}>{s.pct}%</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function GoalsScreen({userId}) {
  const [goals,setGoals]=useCloudStore('goals',{},userId);
  const [inputs,setInputs]=useState({});
  const [open,setOpen]=useState('career');
  const addG=(area)=>{const t=(inputs[area]||'').trim();if(!t)return;
    setGoals({...goals,[area]:[...(goals[area]||[]),{id:Date.now(),text:t,done:false}]});
    setInputs(p=>({...p,[area]:''}));};
  const togG=(area,id)=>setGoals({...goals,[area]:(goals[area]||[]).map(g=>g.id===id?{...g,done:!g.done}:g)});
  const delG=(area,id)=>setGoals({...goals,[area]:(goals[area]||[]).filter(g=>g.id!==id)});
  const totalG=AREAS.reduce((a,ar)=>a+(goals[ar.key]||[]).length,0);
  const totalD=AREAS.reduce((a,ar)=>a+(goals[ar.key]||[]).filter(g=>g.done).length,0);
  const op=totalG?Math.round(totalD/totalG*100):0;
  return (
    <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={{padding:14}}>
          <Text style={{fontSize:20,color:'#E8D8BC',fontStyle:'italic',marginBottom:4}}>Годовые цели — 2026</Text>
          <Text style={{fontSize:13,color:C.muted,marginBottom:16}}>Намерения по сферам жизни</Text>
          {totalG>0&&(
            <View style={[S.card,{marginBottom:16}]}>
              <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:8}}>
                <Text style={{fontSize:12,color:C.muted}}>Общий прогресс</Text>
                <Text style={{fontSize:12,fontWeight:'bold',color:op>=70?C.teal:C.accent}}>{totalD}/{totalG} · {op}%</Text>
              </View>
              <Bar pct={op} color={op>=70?C.teal:C.accent} h={5}/>
            </View>
          )}
          {AREAS.map(area=>{
            const ag=goals[area.key]||[];
            const done=ag.filter(g=>g.done).length;
            const pct=ag.length?Math.round(done/ag.length*100):0;
            const isOpen=open===area.key;
            return (
              <View key={area.key} style={[S.card,{marginBottom:10,borderTopWidth:2,
                borderTopColor:area.color,padding:0,overflow:'hidden'}]}>
                <TouchableOpacity onPress={()=>setOpen(isOpen?null:area.key)} activeOpacity={0.7}
                  style={{flexDirection:'row',alignItems:'center',padding:14,gap:10}}>
                  <Text style={{fontSize:20}}>{area.icon}</Text>
                  <Text style={{fontSize:14,color:'#E0D8C8',flex:1}}>{area.label}</Text>
                  {ag.length>0&&<Text style={{fontSize:11,fontWeight:'bold',color:area.color,marginRight:6}}>{done}/{ag.length}</Text>}
                  <Text style={{fontSize:18,color:C.dim,transform:[{rotate:isOpen?'90deg':'0deg'}]}}>›</Text>
                </TouchableOpacity>
                {ag.length>0&&<View style={{paddingHorizontal:14,paddingBottom:4}}>
                  <Bar pct={pct} color={area.color} h={3}/>
                </View>}
                {isOpen&&(
                  <View style={{padding:14,paddingTop:8}}>
                    {ag.length===0&&<Text style={{fontSize:13,color:C.dim,fontStyle:'italic',marginBottom:8}}>Добавь первую цель</Text>}
                    {ag.map(g=>(
                      <View key={g.id} style={{flexDirection:'row',alignItems:'flex-start',paddingVertical:8,gap:10,
                        borderBottomWidth:1,borderBottomColor:'rgba(255,255,255,0.04)'}}>
                        <View style={{marginTop:1}}>
                          <Checkbox done={g.done} color={area.color} onPress={()=>togG(area.key,g.id)}/>
                        </View>
                        <Text style={{flex:1,fontSize:14,color:g.done?C.dim:'#C8C0B0',lineHeight:22,
                          textDecorationLine:g.done?'line-through':'none'}}>{g.text}</Text>
                        <TouchableOpacity onPress={()=>delG(area.key,g.id)} style={{paddingTop:2}}>
                          <Text style={{fontSize:18,color:C.dim}}>×</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                    <View style={{flexDirection:'row',gap:8,marginTop:10}}>
                      <TextInput value={inputs[area.key]||''} onChangeText={v=>setInputs(p=>({...p,[area.key]:v}))}
                        onSubmitEditing={()=>addG(area.key)}
                        placeholder={'Цель — '+area.label.toLowerCase()+'...'}
                        placeholderTextColor={C.dim} style={S.input}/>
                      <TouchableOpacity onPress={()=>addG(area.key)} style={[S.addBtn,{backgroundColor:area.color}]}>
                        <Text style={{fontSize:22,color:'#111',fontWeight:'bold',lineHeight:30}}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
        <View style={{height:28}}/>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const TABS=[
  {key:'tracker',label:'Трекер',icon:'📅'},
  {key:'tasks',label:'Задачи',icon:'📋'},
  {key:'overview',label:'Обзор',icon:'📊'},
  {key:'goals',label:'Цели',icon:'🎯'},
];

export default function App() {
  const [tab,setTab]=useState('tracker');
  const [user,setUser]=useState(null);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{
      setUser(session?.user??null);
      setLoading(false);
    });
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>{
      setUser(session?.user??null);
    });
    return ()=>subscription.unsubscribe();
  },[]);
  const logout=()=>{
    Alert.alert('Выйти?','Данные останутся в облаке',[
      {text:'Отмена',style:'cancel'},
      {text:'Выйти',style:'destructive',onPress:()=>supabase.auth.signOut()}
    ]);
  };
  if(loading) return (
    <View style={{flex:1,backgroundColor:C.bg,alignItems:'center',justifyContent:'center'}}>
      <ActivityIndicator color={C.accent} size="large"/>
    </View>
  );
  if(!user) return <AuthScreen/>;
  return (
    <SafeAreaView style={{flex:1,backgroundColor:C.bg}}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg}/>
      <View style={{backgroundColor:'rgba(10,10,8,0.98)',borderBottomWidth:1,borderBottomColor:C.border,
        paddingHorizontal:18,paddingVertical:12,flexDirection:'row',alignItems:'center'}}>
        <Text style={{fontSize:17,color:C.accent,fontStyle:'italic',letterSpacing:0.5,flex:1}}>
          Productivity Tracker
        </Text>
        <View style={{flexDirection:'row',alignItems:'center',gap:8}}>
          <View style={{width:6,height:6,borderRadius:3,backgroundColor:C.teal}}/>
          <Text style={{fontSize:10,color:C.muted}} numberOfLines={1}>{user.email?.split('@')[0]}</Text>
          <TouchableOpacity onPress={logout} style={{paddingLeft:8}}>
            <Text style={{fontSize:11,color:C.dim}}>выйти</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={{flex:1,backgroundColor:C.bg}}>
        {tab==='tracker'&&<TrackerScreen userId={user.id}/>}
        {tab==='tasks'&&<TasksScreen userId={user.id}/>}
        {tab==='overview'&&<OverviewScreen userId={user.id}/>}
        {tab==='goals'&&<GoalsScreen userId={user.id}/>}
      </View>
      <View style={{flexDirection:'row',backgroundColor:'#0A0A08',
        borderTopWidth:1,borderTopColor:C.border,
        paddingBottom:Platform.OS==='ios'?16:8,paddingTop:8}}>
        {TABS.map(t=>{
          const active=tab===t.key;
          return (
            <TouchableOpacity key={t.key} onPress={()=>setTab(t.key)}
              style={{flex:1,alignItems:'center',gap:3}} activeOpacity={0.7}>
              <Text style={{fontSize:20,opacity:active?1:0.35}}>{t.icon}</Text>
              <Text style={{fontSize:10,color:active?C.accent:C.dim,
                letterSpacing:0.4,fontWeight:active?'600':'400'}}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const S=StyleSheet.create({
  card:{backgroundColor:C.card,borderRadius:12,borderWidth:1,borderColor:C.border,padding:14},
  navBtn:{width:34,height:34,borderRadius:8,backgroundColor:'rgba(255,255,255,0.06)',alignItems:'center',justifyContent:'center'},
  input:{flex:1,backgroundColor:'rgba(255,255,255,0.05)',borderWidth:1,borderColor:C.border,borderRadius:10,padding:10,color:C.text,fontSize:14},
  addBtn:{width:42,backgroundColor:C.accent,borderRadius:10,alignItems:'center',justifyContent:'center'},
});
