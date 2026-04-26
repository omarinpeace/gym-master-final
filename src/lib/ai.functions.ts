import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemini-3.1-pro-preview";

function getKey() {
  const gKey = process.env.GROQ_API_KEY || import.meta.env.VITE_GROQ_API_KEY;
  const oKey = process.env.OPENROUTER_API_KEY || import.meta.env.VITE_OPENROUTER_API_KEY;
  const geKey = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
  
  const key = gKey || oKey || geKey || process.env.LOVABLE_API_KEY;
  
  if (!key) {
    console.error("DEBUG: Environment keys found:", { hasGroq: !!gKey, hasOpenRouter: !!oKey, hasGemini: !!geKey });
    throw new Error("AI API Key missing on server. Please check your Cloudflare Environment Variables.");
  }
  return key;
}

async function callGateway(body: Record<string, any>) {
  const key = getKey();
  const isGeminiDirect = key.startsWith("AIza");
  const isOpenRouter = key.startsWith("sk-or");
  const isGroq = key.startsWith("gsk_");

  if (isGeminiDirect) {
    // Transform OpenAI-like body to Gemini format
    const contents = body.messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: Array.isArray(m.content)
        ? m.content.map((c: any) =>
            c.type === "image_url"
              ? { inlineData: { mimeType: "image/jpeg", data: c.image_url.url.split(",")[1] } }
              : { text: c.text },
          )
        : [{ text: m.content }],
    }));

    // Move first system message to system_instruction if present
    const systemInstruction = body.messages.find((m: any) => m.role === "system")?.content;
    const finalContents = contents.filter((c: any) => c.role !== "system");

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: finalContents,
          system_instruction: systemInstruction
            ? { parts: [{ text: systemInstruction }] }
            : undefined,
          generationConfig: {
            response_mime_type: body.messages[0].content.includes("JSON")
              ? "application/json"
              : "text/plain",
          },
        }),
      },
    );

    if (!res.ok) throw new Error(`Gemini API error: ${await res.text()}`);
    const data = await res.json();
    return {
      choices: [
        {
          message: {
            content: data.candidates[0].content.parts[0].text,
          },
        },
      ],
    };
  }

  let endpoint = GATEWAY;
  if (isOpenRouter) endpoint = "https://openrouter.ai/api/v1/chat/completions";
  if (isGroq) endpoint = "https://api.groq.com/openai/v1/chat/completions";
  
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(isOpenRouter ? { "HTTP-Referer": "http://localhost:8080", "X-Title": "Gym Master" } : {})
    },
    body: JSON.stringify({ 
      model: isGroq ? "llama-3.3-70b-versatile" : (isOpenRouter ? MODEL : MODEL), 
      ...body,
      response_format: body.messages.some((m: any) => m.content.includes("JSON")) 
        ? { type: "json_object" } 
        : undefined
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    // Do not mask errors so the user can see exactly what's wrong.
    if (isOpenRouter || isGroq) {
      throw new Error(`AI API error ${res.status}: ${t}`);
    }
    if (res.status === 429) throw new Error("Rate limit reached. Try again in a minute.");
    if (res.status === 402)
      throw new Error("AI credits exhausted. Add funds in workspace settings.");
    throw new Error(`AI error ${res.status}: ${t}`);
  }
  return res.json();
}

/* ---------------- Coach Chat ---------------- */
export const coachChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { message: string; conversationId?: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Load profile + recent context
    const [{ data: profile }, { data: injuries }, { data: recentWorkouts }, { data: lastScan }] =
      await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase
          .from("injuries")
          .select("body_part,notes")
          .eq("user_id", userId)
          .eq("active", true),
        supabase
          .from("workouts")
          .select("name,scheduled_date,completed,focus")
          .eq("user_id", userId)
          .order("scheduled_date", { ascending: false })
          .limit(7),
        supabase
          .from("inbody_scans")
          .select("weight_kg,body_fat_pct,muscle_mass_kg,recommendations")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

    // Conversation history
    const convoId = data.conversationId;
    let history: { role: string; content: string }[] = [];
    if (convoId) {
      const { data: msgs } = await supabase
        .from("chat_messages")
        .select("role,content")
        .eq("user_id", userId)
        .eq("conversation_id", convoId)
        .order("created_at", { ascending: true })
        .limit(30);
      history = msgs ?? [];
    }

    const systemPrompt = `You are Gym Master, an adaptive AI fitness coach. Be concise, warm, evidence-based.

USER PROFILE:
${JSON.stringify(profile ?? {}, null, 2)}

ACTIVE INJURIES: ${injuries?.length ? injuries.map((i) => `${i.body_part} (${i.notes ?? "no notes"})`).join(", ") : "none"}

LAST 7 WORKOUTS: ${JSON.stringify(recentWorkouts ?? [])}

LATEST INBODY: ${lastScan ? JSON.stringify(lastScan) : "none"}

Rules:
- If user asks about exercise form, give 3 short cues.
- If they mention injury, never recommend exercises that load the injured area.
- Use markdown sparingly. Keep replies under 150 words unless asked for detail.
- For Egyptian/student context, suggest cheap local foods (eggs, ful, rice, chicken, beans, bananas, oats).`;

    const result = await callGateway({
      messages: [
        { role: "system", content: systemPrompt },
        ...history,
        { role: "user", content: data.message },
      ],
    });

    const reply = result.choices?.[0]?.message?.content ?? "Sorry, no response.";

    // Persist
    const conversationId = convoId ?? crypto.randomUUID();
    await supabase.from("chat_messages").insert([
      { user_id: userId, conversation_id: conversationId, role: "user", content: data.message },
      { user_id: userId, conversation_id: conversationId, role: "assistant", content: reply },
    ]);

    return { reply, conversationId };
  });

/* ---------------- Generate Adaptive Plan ---------------- */
export const generatePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [{ data: profile }, { data: injuries }, { data: lastWeek }, { data: lastScan }] =
      await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase
          .from("injuries")
          .select("body_part,notes,severity")
          .eq("user_id", userId)
          .eq("active", true),
        supabase
          .from("workouts")
          .select("name,scheduled_date,completed,focus")
          .eq("user_id", userId)
          .gte("scheduled_date", new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10))
          .order("scheduled_date", { ascending: true }),
        supabase
          .from("inbody_scans")
          .select("weight_kg,body_fat_pct,muscle_mass_kg,recommendations")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

    const equipment = profile?.equipment ?? [];

    const missed = (lastWeek ?? []).filter((w) => !w.completed).length;
    const completed = (lastWeek ?? []).filter((w) => w.completed).length;

    // Severity legend the AI must follow exactly.
    const injuryLines = (injuries ?? []).map(
      (i) => `- ${i.body_part} (severity: ${i.severity}${i.notes ? `, notes: ${i.notes}` : ""})`,
    );

    const prompt = `Build the most efficient 7-day workout plan starting today, fully tailored to this user.

USER PROFILE:
${JSON.stringify(profile, null, 2)}

LATEST INBODY SCAN: ${lastScan ? JSON.stringify(lastScan) : "none provided"}

ACTIVE INJURIES:
${injuryLines.length ? injuryLines.join("\n") : "none"}

LAST WEEK ADHERENCE: ${completed} completed, ${missed} missed.

PRESCRIPTION RULES (follow strictly):
1. EXPERIENCE LEVEL & SCIENTIFIC PRINCIPLES:
   - beginner: Focus on compound movements, 3 full-body days, Linear Progression (+1-2kg per session).
   - intermediate: Upper/Lower or PPL split, implement Undulating Periodization (mix of strength and hypertrophy days), focus on volume accumulation.
   - advanced: Specialized split, RPE-based loading (Rate of Perceived Exertion), focus on weak points identified in InBody (e.g., lower limb muscle mass).
2. GOAL & INTENSITY:
   - build_muscle: 6-12 reps, 1-2 reps shy of failure (RPE 8-9).
   - lose_fat: Maintain intensity to preserve muscle, 8-15 reps, include 1 HIIT finisher.
   - strength: 1-5 reps, 3-5 min rest, RPE 9.
3. EQUIPMENT: Only use exercises possible with these tools: ${equipment.length ? equipment.join(", ") : "commercial gym equipment"}.
4. INJURY HANDLING: Use severity to swap exercises (mild: reduced load, moderate: isolation only, severe: skip body part).
5. ADAPTATION: Missed >= 3? Deload. Completed >= 5? Progressive Overload (increase weight or reps).

Return JSON ONLY with this exact shape:
{
  "summary": "one sentence summarizing the week (mention split + key adaptation)",
  "reasoning": "2-3 sentences explaining how you used profile, InBody, equipment, and training principles",
  "days": [
    {
      "date_offset": 0,
      "name": "Push Day",
      "focus": "chest, shoulders, triceps",
      "exercises": [
        {
          "name": "Bench Press",
          "sets": 4,
          "reps": 8,
          "target_rpe": 8,
          "rest_seconds": 120,
          "starting_weight_kg": 60,
          "progressive_overload_cue": "Add 2.5kg if you hit all reps last session",
          "injury_note": "optional"
        }
      ]
    }
  ]
}`;

    const result = await callGateway({
      messages: [
        { role: "system", content: "You return ONLY valid JSON. No markdown fences." },
        { role: "user", content: prompt },
      ],
    });

    let raw = result.choices?.[0]?.message?.content ?? "{}";
    raw = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    let parsed: {
      summary: string;
      reasoning: string;
      days: Array<{
        date_offset: number;
        name: string;
        focus: string;
        exercises: Array<{
          name: string;
          sets: number;
          reps: number;
          rest_seconds: number;
          starting_weight_kg?: number | null;
          injury_note?: string | null;
        }>;
      }>;
    };
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("AI returned invalid plan JSON.");
    }

    const today = new Date();
    const weekStart = today.toISOString().slice(0, 10);

    const { data: planRow, error: planErr } = await supabase
      .from("plans")
      .insert({
        user_id: userId,
        week_start: weekStart,
        summary: parsed.summary,
        plan_data: parsed,
        reasoning: parsed.reasoning,
      })
      .select()
      .single();
    if (planErr) throw planErr;

    // Create workouts + sets
    for (const day of parsed.days) {
      const date = new Date(today);
      date.setDate(date.getDate() + day.date_offset);
      const { data: w, error: wErr } = await supabase
        .from("workouts")
        .insert({
          user_id: userId,
          plan_id: planRow.id,
          scheduled_date: date.toISOString().slice(0, 10),
          name: day.name,
          focus: day.focus,
        })
        .select()
        .single();
      if (wErr) continue;
      const setRows = day.exercises.flatMap((ex) =>
        Array.from({ length: ex.sets }, (_, i) => ({
          user_id: userId,
          workout_id: w.id,
          exercise_name: ex.name,
          set_index: i + 1,
          target_reps: ex.reps,
          rest_seconds: ex.rest_seconds,
          weight_kg: ex.starting_weight_kg ?? null,
        })),
      );
      if (setRows.length) await supabase.from("exercise_sets").insert(setRows);
    }

    return { plan: planRow, summary: parsed.summary, reasoning: parsed.reasoning };
  });

/* ---------------- Generate Meal Plan ---------------- */
export const generateMeals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: { goal: "cheap_bulk" | "cheap_cut" | "balanced"; budget_egp_per_day: number }) => d,
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    const prompt = `Build a 1-day meal plan for the user based on their profile and budget.
Profile: ${JSON.stringify(profile)}
Goal: ${data.goal}
Budget: ${data.budget_egp_per_day} EGP/day.

Instructions for Food Variety:
Use a very wide and diverse range of foods! Include diverse proteins, diverse carbs, healthy fats, and a colorful mix of fruits and vegetables. You can include international meals as well as local Egyptian staples.

Verified April 2026 Market Prices (Egypt):
Use these EXACT prices to calculate 'cost_egp':
- Chicken Breast: ~200 EGP / kg (20 EGP per 100g)
- Ground Beef: ~420 EGP / kg (42 EGP per 100g)
- Eggs: ~4.5 EGP per egg
- Rice/Pasta: ~35 EGP / kg (3.5 EGP per 100g)
- Potatoes: ~25 EGP / kg (2.5 EGP per 100g)
- Milk: ~46 EGP / Liter
- Bread (Fresh White): ~33 EGP / kg
- Oats: ~65 EGP / kg
Calculate the cost based on these real-time verified market benchmarks.

Return JSON only:
{
  "meals": [
    { "meal_type": "breakfast", "name": "...", "calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0, "cost_egp": 0 }
  ]
}
Include breakfast, lunch, dinner, snack.`;

    const result = await callGateway({
      messages: [
        { role: "system", content: "Return ONLY valid JSON. No markdown." },
        { role: "user", content: prompt },
      ],
    });
    let raw = result.choices?.[0]?.message?.content ?? "{}";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) raw = jsonMatch[0];
    let parsed: any = { meals: [] };
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error("Failed to parse Llama JSON (generate):", raw, e);
      throw new Error("AI failed to return valid JSON format for meal plan.");
    }
    
    if (!Array.isArray(parsed.meals)) {
      parsed.meals = [];
    }

    const today = new Date().toISOString().slice(0, 10);
    const rows = parsed.meals.map((m: any) => ({ 
      user_id: userId, 
      date: today, 
      meal_type: m.meal_type || "snack",
      name: m.name || "Unknown Meal",
      calories: m.calories || 0,
      protein_g: m.protein_g || m.protein || 0,
      carbs_g: m.carbs_g || m.carbs || 0,
      fat_g: m.fat_g || m.fat || 0,
      cost_egp: m.cost_egp || m.cost || 0
    }));
    await supabase
      .from("meals")
      .delete()
      .eq("user_id", userId)
      .eq("date", today);
    if (rows.length) await supabase.from("meals").insert(rows);
    return { meals: rows };
  });



/* ---------------- Form Video Lookup ---------------- */
export const exerciseFormHelp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { exercise: string }) => d)
  .handler(async ({ data }) => {
    const prompt = `For the exercise "${data.exercise}":
Return JSON only:
{
  "exercise": "canonical name",
  "youtube_query": "best search query for a tutorial video",
  "form_cues": ["cue 1", "cue 2", "cue 3"],
  "common_mistakes": ["mistake 1", "mistake 2"],
  "muscles_worked": ["muscle 1", "muscle 2"]
}`;
    const result = await callGateway({
      messages: [
        { role: "system", content: "Return ONLY valid JSON. No markdown." },
        { role: "user", content: prompt },
      ],
    });
    let raw = result.choices?.[0]?.message?.content ?? "{}";
    raw = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const parsed = JSON.parse(raw) as {
      exercise: string;
      youtube_query: string;
      form_cues: string[];
      common_mistakes: string[];
      muscles_worked: string[];
    };

    // Resolve a real, embeddable YouTube video by scraping the public search page.
    // YouTube's embed?listType=search was deprecated and now shows "Video unavailable".
    const query = `${parsed.youtube_query} proper form tutorial`;
    let videoId: string | null = null;
    let videoUrl: string | null = null;
    let provider: "youtube" | "search" = "search";

    try {
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
      const html = await fetch(searchUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
        },
      }).then((r) => (r.ok ? r.text() : ""));

      // Find the first videoId in the search results JSON blob.
      const match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
      if (match) {
        videoId = match[1];
        videoUrl = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
        provider = "youtube";
      }
    } catch {
      // ignore — fall back to search link below
    }

    // Fallback: link out to a YouTube search (cannot embed search pages).
    const youtubeEmbed =
      videoUrl ?? `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

    return { ...parsed, youtubeEmbed, videoId, provider };
  });

/* ---------------- InBody Analysis ---------------- */
export const analyzeInBody = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { imageUrl: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    const prompt = `Analyze this InBody body composition scan. Extract numeric values and give recommendations tuned to the user's profile.

User profile: ${JSON.stringify(profile)}

Return JSON only:
{
  "weight_kg": 0,
  "body_fat_pct": 0,
  "muscle_mass_kg": 0,
  "recommendations": "3-5 sentences with actionable advice on training and nutrition",
  "target_calories": 0,
  "target_protein_g": 0,
  "target_carbs_g": 0,
  "target_fat_g": 0
}
If a value is not clearly visible, set it to null. For the targets, use science-based calculations (e.g., Mifflin-St Jeor + activity factor + goal adjustment). Protein should be ~1.8-2.2g/kg of lean mass if known.`;

    const result = await callGateway({
      messages: [
        { role: "system", content: "Return ONLY valid JSON. No markdown." },
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: data.imageUrl } },
          ],
        },
      ],
    });
    let raw = result.choices?.[0]?.message?.content ?? "{}";
    raw = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const parsed = JSON.parse(raw) as {
      weight_kg: number | null;
      body_fat_pct: number | null;
      muscle_mass_kg: number | null;
      recommendations: string;
      target_calories: number | null;
      target_protein_g: number | null;
      target_carbs_g: number | null;
      target_fat_g: number | null;
    };

    const { data: row, error } = await supabase
      .from("inbody_scans")
      .insert({
        user_id: userId,
        image_url: data.imageUrl,
        weight_kg: parsed.weight_kg,
        body_fat_pct: parsed.body_fat_pct,
        muscle_mass_kg: parsed.muscle_mass_kg,
        recommendations: parsed.recommendations,
        raw_analysis: parsed,
      })
      .select()
      .single();
    if (error) throw error;

    // Update profile with new targets
    await supabase
      .from("profiles")
      .update({
        weight_kg: parsed.weight_kg ?? profile?.weight_kg,
        target_calories: parsed.target_calories,
        target_protein_g: parsed.target_protein_g,
        target_carbs_g: parsed.target_carbs_g,
        target_fat_g: parsed.target_fat_g,
      })
      .eq("id", userId);

    return { scan: row };
  });

/* ---------------- Gym Insights ---------------- */
export const getGymInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    // Get last 60 days of scheduled vs completed
    const { data: workouts } = await supabase
      .from("workouts")
      .select("scheduled_date,completed")
      .eq("user_id", userId)
      .order("scheduled_date", { ascending: false })
      .limit(60);

    if (!workouts || workouts.length < 5) {
      return { skippedDay: null, message: "Need more data to analyze your habits." };
    }

    // Count missed per weekday
    const missedCounts: Record<string, number> = {
      Sunday: 0,
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
    };

    workouts.forEach((w) => {
      if (!w.completed) {
        const day = new Date(w.scheduled_date).toLocaleDateString("en-US", { weekday: "long" });
        missedCounts[day]++;
      }
    });

    let maxMissed = 0;
    let skippedDay = "";
    Object.entries(missedCounts).forEach(([day, count]) => {
      if (count > maxMissed) {
        maxMissed = count;
        skippedDay = day;
      }
    });

    if (maxMissed === 0)
      return { skippedDay: null, message: "Perfect attendance lately! Keep it up." };

    return {
      skippedDay,
      message: `Watch out! You've missed ${maxMissed} workouts on ${skippedDay}s recently.`,
    };
  });
