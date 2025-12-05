/**
 * Director AI - Video Analysis & Director Notes
 * AI yönetmen: Video izler, analiz eder, öneriler sunar
 */

import OpenAI from 'openai';
import https from 'https';

// SSL bypass - ONLY for development
const httpsAgent = process.env.NODE_ENV === 'development' 
  ? new https.Agent({ rejectUnauthorized: false })
  : undefined;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  ...(httpsAgent && { httpAgent: httpsAgent }),
});

export interface DirectorNote {
  timestamp: string;
  visual: string;
  audio: string;
  speech: string;
  reasoning: string;
}

export interface ScriptRewrite {
  timestamp: string;
  original: string;
  rewritten: string;
  improvement: string;
}

export interface DirectorAnalysis {
  mode: 'scene_director' | 'script_rewrite' | 'full_rewrite';
  director_notes?: DirectorNote[];
  script_analysis?: {
    problems: string[];
    opportunities: string[];
  };
  rewritten_script?: ScriptRewrite[];
}

/**
 * Mode 1: Scene Director
 * Her sahne için KAPSAMLI yönetmenlik notları (Görsel + Ses + Konuşma)
 */
export async function generateSceneDirectorNotes(
  transcription: any,
  cinematicAnalysis?: any
): Promise<DirectorNote[]> {
  console.log('🎬 Director AI: Scene analysis başlıyor...');

  const cinematicInfo = cinematicAnalysis ? `

GÖRSEL ANALİZ (GPT-4 Vision):
🎥 KAMERA:
- Tip: ${cinematicAnalysis.camera_analysis?.type}
- Hareket: ${cinematicAnalysis.camera_analysis?.movement}
- Açılar: ${cinematicAnalysis.camera_analysis?.angles?.join(', ')}
- Stabilizasyon: ${cinematicAnalysis.camera_analysis?.stability_score}/100
- 🚁 DRONE TESPİTİ: ${cinematicAnalysis.camera_analysis?.drone_detected ? 'EVET - Havadan çekim var!' : 'Hayır'}

💡 IŞIK:
- Tip: ${cinematicAnalysis.lighting_analysis?.type}
- Kalite: ${cinematicAnalysis.lighting_analysis?.quality}
- Parlaklık: ${cinematicAnalysis.lighting_analysis?.brightness_score}/100
- Sorunlar: ${cinematicAnalysis.lighting_analysis?.issues?.join(', ') || 'Yok'}

🎨 KOMPOZİSYON:
- Framing: ${cinematicAnalysis.composition_analysis?.framing}
- Arka plan: ${cinematicAnalysis.composition_analysis?.background}
- Rule of thirds: ${cinematicAnalysis.composition_analysis?.rule_of_thirds ? 'Evet' : 'Hayır'}

📊 KALİTE:
- Genel skor: ${cinematicAnalysis.overall_score}/100
- Çözünürlük: ${cinematicAnalysis.quality_analysis?.resolution_quality}
- Renk dengesi: ${cinematicAnalysis.quality_analysis?.color_balance}
- Netlik: ${cinematicAnalysis.quality_analysis?.sharpness}
` : '';

  const prompt = `Sen bir PROFESYONEL VİDEO YÖNETMENİ ve SİNEMATOGRAFISIN. Video içeriğini analiz edip KAPSAMLI yönetmenlik notları veriyorsun.

TRANSKRIPT:
${JSON.stringify(transcription.segments, null, 2)}

TAM METİN:
${transcription.text}

ÖNEMLİ: Önce transkripti oku ve VİDEO TİPİNİ ANLA! (Gayrimenkul mi? Tarla mı? Ürün tanıtımı mı? Eğitim mi?)
VIDEO TİPİ: [Transkriptten anla - gayrimenkul, tarla, arazi, ürün, hizmet, eğitim, vlog, vb.]
${cinematicInfo}

SENİN UZMANLIKLARIN:
🎥 SİNEMATOGRAFİ:
- Kamera açısı ve kompozisyon
- Işık yönetimi (doğal ışık, yapay ışık)
- Kadraj ve framing
- Hareket ve stabilizasyon

🎭 PERFORMANS YÖNETİMİ:
- Mimik ve yüz ifadeleri
- Beden dili ve duruş
- Göz teması ve özgüven
- Enerji ve ton

🎨 GÖRSEL TASARIM:
- Arka plan düzenleme
- Renk paleti ve estetik
- Text overlay ve grafik
- Materyal ve dekorasyon

🎵 SES YÖNETİMİ:
- Müzik seçimi ve ritim
- Ses efektleri
- Voiceover kalitesi
- Ambient ses

💰 SATIŞ PSİKOLOJİSİ:
- Değer vurgusu
- Emotional triggers
- Social proof
- CTA optimizasyonu

GÖREV:
Her segment için KAPSAMLI yönetmenlik notları ver:

1. 📹 GÖRSEL (Kamera + Işık + Arka Plan):
   - Kamera açısı önerileri
   - Işık düzenleme (daha parlak, yumuşak, vb.)
   - Arka plan iyileştirme (düzenleme, minimalizm)
   - Text overlay, animasyon, grafik önerileri
   - Kadraj ve kompozisyon

2. 🎵 SES (Müzik + Efekt + Voiceover):
   - Müzik seçimi (tür, tempo, mood)
   - Ses efektleri (whoosh, ding, ambient)
   - Voiceover kalite iyileştirme
   - Ses seviyesi ayarları

3. 💬 KONUŞMA (Script + Delivery):
   - Eklenmesi/değiştirilmesi gereken cümleler
   - Ton ve vurgu önerileri
   - Mimik ve beden dili önerileri
   - Enerji seviyesi ayarları

4. 💡 NEDEN (Satış Psikolojisi):
   - Bu önerinin mantığı
   - Hangi satış tekniği kullanılıyor
   - Beklenen etki (engagement, conversion, vb.)

KURALLAR:
- HER SAHNE İÇİN KAPSAMLI ANALİZ
- Kamera, ışık, arka plan, mimik, ses - HER ŞEYİ değerlendir
- Satış odaklı düşün
- Profesyonel ama uygulanabilir öneriler
- Sosyal medya optimizasyonu

ÖRNEK:
{
  "timestamp": "00:04-00:07",
  "visual": "🎥 KAMERA: Mutfağı daha geniş göstermek için wide angle kullan, 10 derece yukarıdan çek (daha ferah görünür). 💡 IŞIK: Doğal ışık yetersiz, sol taraftan soft box ekle. 🎨 ARKA PLAN: Tezgahı düzenle, gereksiz eşyaları kaldır. 📊 OVERLAY: Sol üstte 'BOSCH ANKASTRE SET DAHİL' yazısı fade-in animasyonuyla çıksın.",
  "audio": "🎵 MÜZİK: Upbeat, modern house müzik ekle (mutfak = enerji). 🔊 EFEKT: Kapı açılırken hafif 'whoosh' efekti. 🎙️ VOICEOVER: Ses tonunu %20 yükselt, daha enerjik.",
  "speech": "💬 SCRIPT: 'Mutfağımız ankastre dahil' → 'Mutfağınız komple hazır - Bosch marka ankastre setiyle ilk günden yemek keyfi!' 🎭 DELIVERY: Gülümseyerek söyle, mutfağa doğru el hareketiyle işaret et. 💪 ENERJI: Daha heyecanlı ton, bu özellik satış için kritik!",
  "reasoning": "🎯 SATIŞ PSİKOLOJİSİ: Ankastre vurgusu + marka (güven) + 'komple hazır' (kolaylık) + 'ilk günden keyif' (dream outcome). 📱 SOSYAL MEDYA: Wide angle + enerji = scroll durdurucu. 💰 CONVERSION: Materyal vurgusu itirazları önler (ekstra maliyet yok)."
}

FORMAT (JSON):
{
  "director_notes": [
    {
      "timestamp": "00:00-00:03",
      "visual": "Kamera, ışık, arka plan, overlay - HER ŞEYİ yaz",
      "audio": "Müzik, efekt, voiceover - DETAYLI",
      "speech": "Script + delivery + mimik + beden dili",
      "reasoning": "Satış psikolojisi + beklenen etki"
    }
  ]
}

ÖNEMLİ: Her field'ı DOLU ve DETAYLI doldur! Kamera açısı, ışık, arka plan, mimik - HİÇBİRİNİ ATLAMA!

Sadece JSON döndür.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    console.log('✅ Director notes generated:', result.director_notes?.length);

    return result.director_notes || [];
  } catch (error) {
    console.error('Director AI error:', error);
    throw new Error('Director AI analizi başarısız oldu');
  }
}

/**
 * Mode 2: Script Rewrite
 * Konuşma metnini analiz edip yeniden yaz
 */
export async function generateScriptRewrite(
  transcription: any
): Promise<{
  analysis: { problems: string[]; opportunities: string[] };
  rewritten: ScriptRewrite[];
}> {
  console.log('🎬 Director AI: Script rewrite başlıyor...');

  const prompt = `Sen bir FUNNEL KURUCU, SOSYAL MEDYA UZMANI ve SATIŞ PATLATMA UZMANISSIN. Video içeriğini analiz edip konuşma metni İYİLEŞTİRİYORSUN.

ÖNEMLİ: 
1. Önce transkripti oku ve VİDEO TİPİNİ ANLA! (Gayrimenkul? Tarla? Ürün? Hizmet?)
2. O video tipine uygun SATIŞ STRATEJİSİ kullan
3. Mevcut içeriği KORU, sadece İYİLEŞTİR

MEVCUT KONUŞMA:
${transcription.text}

SEGMENTLER (ZAMAN DAMGALI):
${transcription.segments.map((s: any) => `[${Math.floor(s.start/60)}:${String(Math.floor(s.start%60)).padStart(2,'0')}-${Math.floor(s.end/60)}:${String(Math.floor(s.end%60)).padStart(2,'0')}] "${s.text}"`).join('\n')}

VIDEO TİPİ: [Transkriptten anla ve ona göre strateji belirle]

SENİN UZMANLIKLARIN:
🎯 FUNNEL STRATEJİSİ:
- AIDA (Attention, Interest, Desire, Action)
- Hook → Value → Proof → CTA
- Scarcity (kıtlık) ve Urgency (aciliyet)
- Social proof (sosyal kanıt)

📱 SOSYAL MEDYA PSİKOLOJİSİ:
- İlk 3 saniye kritik (scroll durdurucu)
- Pattern interrupt (beklenmedik başlangıç)
- Emotional triggers (duygusal tetikleyiciler)
- FOMO (Fear of Missing Out)

💰 SATIŞ TEKNİKLERİ:
- Özellik → Fayda → Değer
- Pain points (acı noktaları)
- Dream outcome (hayal edilen sonuç)
- Objection handling (itiraz yönetimi)

GÖREV:
1. Mevcut konuşmayı FUNNEL perspektifinden analiz et
2. Her segmenti SATIŞ PSİKOLOJİSİ ile İYİLEŞTİR
3. Aynı konuyu CONVERSION odaklı anlat

KURALLAR:
- MEVCUT İÇERİĞİ KORU: Aynı sahne, aynı konu, sadece daha iyi anlat
- Hook: İlk 3 saniye scroll durdurucu (pattern interrupt)
- Değer vurgusu: Özellik → Fayda → Yaşam kalitesi
- Social proof: "Nadir", "Özel", "Sadece burada" gibi vurgular
- Scarcity: "Sınırlı", "Hızlı gidiyor", "Son fırsat" vurguları
- **CTA ZORUNLU**: Eğer videoda CTA yoksa, MUTLAKA son segmente güçlü bir CTA ekle!
- Emotional connection: Hayallere hitap et

🚨 CTA KONTROLÜ (ÇOK ÖNEMLİ):
1. Transkripti oku ve CTA var mı kontrol et
2. CTA örnekleri: "DM'den yazın", "Linke tıklayın", "Arayın", "Mesaj atın", "Randevu alın"
3. Eğer CTA YOKSA → Son segmente MUTLAKA güçlü CTA ekle!
4. CTA varsa ama zayıfsa → Güçlendir (aciliyet + kolaylık + değer)

CTA ÖRNEKLERİ:
❌ CTA YOK: "İşte böyle bir daire" → KABUL EDİLEMEZ!
✅ GÜÇLÜ CTA: "Hemen DM'den yazın, bugün görüşelim - bu fırsat hızla gidiyor!"

❌ ZAYIF CTA: "Bilgi için mesaj atın"
✅ GÜÇLÜ CTA: "Şimdi DM'den 'FİYAT' yazın, 2 dakikada tüm detayları öğrenin!"

SATIŞ DİLİ ÖRNEKLERİ:
❌ Zayıf: "Mutfağımız ankastre dahil"
✅ Güçlü: "Mutfağınız komple hazır - Bosch marka ankastre setimizle ilk günden yemek keyfi"

❌ Zayıf: "Salon geniş"
✅ Güçlü: "35 m² salonunuzda ailenizle kaliteli zaman geçirin - gün ışığı her köşeye ulaşıyor"

❌ Zayıf: "Detaylı bilgi için DM"
✅ Güçlü: "Bu fırsatı kaçırmayın - DM'den yazın, 2 dakikada fiyat ve ödeme planını öğrenin"

FORMAT (JSON):
{
  "analysis": {
    "problems": [
      "Hook yok - izleyici ilk 3 saniyede kayıyor",
      "Özellikler listeleniyor ama değere çevrilmiyor",
      "CTA zayıf - aciliyet yok"
    ],
    "opportunities": [
      "Lokasyon vurgusu + scarcity (nadir bölge)",
      "Yaşam kalitesi vurgusu (dream outcome)",
      "Social proof eklenebilir (talep var, hızlı gidiyor)"
    ]
  },
  "rewritten_script": [
    {
      "timestamp": "00:00-00:03",
      "original": "GERÇEK ORİJİNAL METNİ BURAYA YAZ",
      "rewritten": "Aynı konuyu FUNNEL + SATIŞ PSİKOLOJİSİ ile anlat",
      "improvement": "Kullanıcı dostu Türkçe ile açıkla: Neden bu değişiklik yapıldı? Ne kazandırıyor? (Örnek: 'Dikkat çekici başlangıç ve duygusal bağ kurma')",
      "emotion": "Seslendirme tonu (energetic, calm, excited, confident, warm, urgent, professional)"
    }
  ]
}

ÖNEMLİ: 
- "improvement" field'ını KULLANICI DOSTU TÜRKÇE ile yaz! Teknik terim kullanma!
  ❌ Kötü: "Pattern interrupt ve emotional trigger kullanımı"
  ✅ İyi: "Dikkat çekici başlangıç ve duygusal bağ kurma"
  ❌ Kötü: "FOMO (komisyonsuz)"
  ✅ İyi: "Komisyonsuz vurgusuyla kaçırılmayacak fırsat hissi"
  ❌ Kötü: "Özellikten değere geçiş"
  ✅ İyi: "Teknik detay yerine size ne kazandıracağını anlattık"
- "emotion" field'ında seslendirme için ton bilgisi ekle

Sadece JSON döndür.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7, // Daha düşük temperature = daha tutarlı
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    console.log('✅ Script rewrite generated');

    return {
      analysis: result.analysis || { problems: [], opportunities: [] },
      rewritten: result.rewritten_script || [],
    };
  } catch (error) {
    console.error('Script rewrite error:', error);
    throw new Error('Script rewrite başarısız oldu');
  }
}

/**
 * Mode 3: Full Rewrite
 * Mevcut içeriği koruyarak SATIŞ PATLATMA script'i yaz
 */
export async function generateFullRewrite(
  transcription: any
): Promise<ScriptRewrite[]> {
  console.log('🎬 Director AI: Full rewrite başlıyor...');

  const prompt = `Sen bir FUNNEL KURUCU, SOSYAL MEDYA UZMANI ve SATIŞ PATLATMA UZMANISSIN. Video içeriğini analiz edip mevcut içeriği KORUYARAK CONVERSION odaklı script yazıyorsun.

ÖNEMLİ: 
1. Önce transkripti oku ve video konusunu ANLA! (Gayrimenkul? Tarla? Ürün? Eğitim? Ne?)
2. Mevcut sahneleri ve konuları KORU! Sadece SATIŞ PSİKOLOJİSİ ile daha güçlü anlat.

MEVCUT KONUŞMA:
${transcription.text}

SEGMENTLER (ZAMAN DAMGALI):
${transcription.segments.map((s: any) => `[${Math.floor(s.start/60)}:${String(Math.floor(s.start%60)).padStart(2,'0')}-${Math.floor(s.end/60)}:${String(Math.floor(s.end%60)).padStart(2,'0')}] "${s.text}"`).join('\n')}

VIDEO SÜRESİ: ${transcription.segments[transcription.segments.length - 1]?.end || 60} saniye

VIDEO KONUSU: Transkriptten otomatik belirle (gayrimenkul, tarla satışı, ürün tanıtımı, eğitim, vlog, vb.)

SENİN UZMANLIKLARIN:
🎯 FUNNEL MİMARİSİ:
- Hook (3 sn): Pattern interrupt + Curiosity gap
- Value Stack (orta): Özellik → Fayda → Dream outcome
- Social Proof: Scarcity, urgency, FOMO
- CTA (son 5 sn): Clear, urgent, low-friction

📱 SOSYAL MEDYA FORMÜLÜ:
- Scroll-stopper hook
- Emotional storytelling
- Visual + verbal sync
- Thumb-stopping moments

💰 SATIŞ PSİKOLOJİSİ:
- Pain → Agitate → Solve
- Before → After → Bridge
- Problem → Solution → Transformation
- Feature → Advantage → Benefit

GÖREV:
Her segmenti SATIŞ PATLATMA formülü ile yeniden yaz:
1. Hook (ilk 3 sn): Scroll durdurucu + merak uyandırıcı
2. Value Stack: Özellik → Fayda → Yaşam kalitesi
3. Social Proof: "Nadir", "Talep yüksek", "Hızlı gidiyor"
4. CTA (son 5 sn): Acil, net, kolay eylem

KURALLAR:
- MEVCUT SAHNELERİ KORU: Aynı oda, aynı özellik, sadece SATIŞ DİLİ ile anlat
- Her cümle CONVERSION odaklı
- Emotional triggers kullan
- Dream outcome'a hitap et
- Objection handling (itirazları önceden çöz)
- **CTA ZORUNLU**: Eğer videoda CTA yoksa, MUTLAKA son segmente güçlü bir CTA ekle!

🚨 CTA KONTROLÜ (ÇOK ÖNEMLİ):
1. Transkripti oku ve CTA var mı kontrol et
2. CTA örnekleri: "DM'den yazın", "Linke tıklayın", "Arayın", "Mesaj atın", "Randevu alın"
3. Eğer CTA YOKSA → Son segmente MUTLAKA güçlü CTA ekle!
4. CTA varsa ama zayıfsa → Güçlendir (aciliyet + kolaylık + değer)

CTA ÖRNEKLERİ:
❌ CTA YOK: "İşte böyle bir daire" → KABUL EDİLEMEZ!
✅ GÜÇLÜ CTA: "Hemen DM'den yazın, bugün görüşelim - bu fırsat hızla gidiyor!"

❌ ZAYIF CTA: "Bilgi için mesaj atın"
✅ GÜÇLÜ CTA: "Şimdi DM'den 'FİYAT' yazın, 2 dakikada tüm detayları öğrenin!"

SATIŞ DİLİ FORMÜLLERI:

🔥 HOOK FORMÜLLERI:
- "Özlüce'de bu fırsatı kaçırmayın..." (Scarcity)
- "Hayalinizdeki ev tam burada..." (Dream outcome)
- "Sadece 2 daire kaldı..." (Urgency)

💎 VALUE STACK FORMÜLLERI:
- "X özelliği → Y faydası → Z yaşam kalitesi"
- "Komple ankastre → Hazır mutfak → İlk günden keyif"
- "Güney cepheli → Gün ışığı → Sağlıklı yaşam"

⚡ CTA FORMÜLLERI:
- "DM'den yazın → 2 dk'da fiyat → Bugün rezerve edin"
- "Hemen arayın → Özel indirim → Kaçırmayın"
- "Link bio'da → Sanal tur → Randevu alın"

ÖRNEK DÖNÜŞÜM:
❌ Zayıf: "Mutfağımız ankastre dahil"
✅ Güçlü: "Mutfağınız komple hazır - Bosch ankastre setiyle ilk günden yemek keyfi. Ekstra maliyet yok!"
Teknik: Feature (ankastre) → Benefit (hazır) → Outcome (keyif) + Objection handling (maliyet yok)

FORMAT (JSON):
{
  "rewritten_script": [
    {
      "timestamp": "00:00-00:03",
      "original": "GERÇEK ORİJİNAL METNİ BURAYA YAZ",
      "rewritten": "Aynı sahneyi SATIŞ PSİKOLOJİSİ ile anlat",
      "improvement": "Kullanıcı dostu Türkçe ile açıkla: Neden bu değişiklik yapıldı? Ne kazandırıyor?",
      "emotion": "Seslendirme tonu (energetic, calm, excited, confident, warm, urgent, professional)"
    }
  ]
}

ÖNEMLİ: 
- "original" field'ına gerçek orijinal metni yaz
- "improvement" field'ını KULLANICI DOSTU TÜRKÇE ile yaz! Teknik terim kullanma!
  ❌ Kötü: "Hook formula + curiosity gap"
  ✅ İyi: "Dikkat çekici başlangıç ve merak uyandırma"
  ❌ Kötü: "Value stack + social proof"
  ✅ İyi: "Değer vurgusu ve güven oluşturma"
- "emotion" field'ında seslendirme için ton bilgisi ekle

Sadece JSON döndür.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    console.log('✅ Full rewrite generated:', result.rewritten_script?.length);

    return result.rewritten_script || [];
  } catch (error) {
    console.error('Full rewrite error:', error);
    throw new Error('Full rewrite başarısız oldu');
  }
}

/**
 * Main Director AI function
 * Mode'a göre analiz yap
 */
export async function analyzeWithDirectorAI(
  transcription: any,
  mode: 'scene_director' | 'script_rewrite' | 'full_rewrite',
  cinematicAnalysis?: any
): Promise<DirectorAnalysis> {
  console.log(`🎬 Director AI Mode: ${mode}`);
  
  if (cinematicAnalysis) {
    console.log('🎥 Cinematic analysis available - using visual data');
    console.log(`🚁 Drone detected: ${cinematicAnalysis.camera_analysis?.drone_detected}`);
  }

  switch (mode) {
    case 'scene_director':
      const notes = await generateSceneDirectorNotes(transcription, cinematicAnalysis);
      return {
        mode: 'scene_director',
        director_notes: notes,
      };

    case 'script_rewrite':
      const rewrite = await generateScriptRewrite(transcription);
      return {
        mode: 'script_rewrite',
        script_analysis: rewrite.analysis,
        rewritten_script: rewrite.rewritten,
      };

    case 'full_rewrite':
      const fullRewrite = await generateFullRewrite(transcription);
      return {
        mode: 'full_rewrite',
        rewritten_script: fullRewrite,
      };

    default:
      throw new Error('Invalid director mode');
  }
}
